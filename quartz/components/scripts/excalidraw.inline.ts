function toSitePath(filePath: string): string {
  // URL-decode first (obsidian:// uses %2F etc.)
  let p = decodeURIComponent(filePath)
  // Strip content/ prefix (vault-relative → Quartz URL)
  p = p.replace(/^content\//, "")
  // Strip .md extension
  p = p.replace(/\.md$/, "")
  return "/" + p
}

// ---------------------------------------------------------------------------
// String-level preprocessing — runs BEFORE innerHTML to avoid triggering
// obsidian:// protocol handlers.
// ---------------------------------------------------------------------------
function preprocessSvg(svgText: string): string {
  // 1. Obsidian YouTube proxy → standard embed URL
  svgText = svgText.replace(
    /(<iframe[^>]*?)src="https:\/\/releases\.obsidian\.md\/youtube\?v=([^&"]+)[^"]*"/g,
    '$1src="https://www.youtube.com/embed/$2"',
  )

  // 2. obsidian:// iframe src → site path
  svgText = svgText.replace(
    /(<iframe[^>]*?)src="obsidian:\/\/open\?[^"]*?file=([^&"]+)[^"]*"/g,
    (_match, prefix: string, encodedFile: string) => {
      return `${prefix}src="${toSitePath(encodedFile)}"`
    },
  )

  // 3. obsidian:// link href → site path
  svgText = svgText.replace(
    /(<a[^>]*?)href="obsidian:\/\/open\?[^"]*?file=([^&"]+)[^"]*"/g,
    (_match, prefix: string, encodedFile: string) => {
      return `${prefix}href="${toSitePath(encodedFile)}" target="_self"`
    },
  )

  return svgText
}

// ---------------------------------------------------------------------------
// DOM-level fallback — catches hook-converted plain vault paths that
// preprocessSvg can't handle (they look like relative URLs, not obsidian://).
// ---------------------------------------------------------------------------
function resolveInternalHref(href: string): string | null {
  if (/^https?:\/\/|^#|^\/\/|^mailto:|^tel:/.test(href)) return null
  if (href.startsWith("/")) return null
  if (href.startsWith("obsidian://open?")) {
    try {
      const file = new URL(href).searchParams.get("file")
      if (file) return toSitePath(file)
    } catch {
      /* malformed */
    }
    return null
  }
  return toSitePath(href)
}

function rewriteLinks(svgElement: Element) {
  const links = svgElement.querySelectorAll("a[href]")
  for (const link of links) {
    const href = link.getAttribute("href")
    if (!href) continue
    const resolved = resolveInternalHref(href)
    if (resolved) {
      link.setAttribute("href", resolved)
      link.setAttribute("target", "_self")
    }
  }
}

// ---------------------------------------------------------------------------
// Safari foreignObject fallback: extract iframes from SVG and overlay them
// as HTML elements at the corresponding positions.
// Safari doesn't render iframe content inside foreignObject (renders 0×0),
// so we detect this and create HTML overlays instead.
// ---------------------------------------------------------------------------
function createIframeOverlays(container: HTMLElement) {
  const svg = container.querySelector("svg")
  if (!svg) return

  // Check if foreignObject actually renders (Chrome = yes, Safari = no)
  const testFo = svg.querySelector("foreignObject")
  if (!testFo) return
  const testRect = testFo.getBoundingClientRect()
  if (testRect.width > 0 && testRect.height > 0) return // works natively, no overlay needed

  // Get SVG intrinsic dimensions for coordinate mapping
  const svgW = parseFloat(svg.getAttribute("width") || "0")
  const svgH = parseFloat(svg.getAttribute("height") || "0")
  if (!svgW || !svgH) return

  // Wrap SVG in a container whose aspect-ratio matches the SVG viewBox exactly.
  // Then force the SVG to fill 100% of this wrapper. This guarantees percentage-
  // based overlay positions map 1:1 to the SVG coordinate system — no pixel
  // calculations or ResizeObserver needed.
  const wrapper = document.createElement("div")
  wrapper.style.position = "relative"
  wrapper.style.width = "100%"
  wrapper.style.aspectRatio = `${svgW} / ${svgH}`
  svg.parentNode!.insertBefore(wrapper, svg)
  wrapper.appendChild(svg)

  // Override CSS sizing so SVG fills the wrapper without gaps
  const svgEl = svg as SVGSVGElement
  svgEl.style.width = "100%"
  svgEl.style.height = "100%"
  svgEl.style.maxHeight = "none"

  const foreignObjects = svg.querySelectorAll("foreignObject")
  for (const fo of foreignObjects) {
    const iframe = fo.querySelector("iframe")
    if (!iframe) continue

    const src = iframe.getAttribute("src")
    if (!src) continue

    // Get dimensions from style
    const style = fo.getAttribute("style") || ""
    const wMatch = style.match(/width:\s*([\d.]+)px/)
    const hMatch = style.match(/height:\s*([\d.]+)px/)
    if (!wMatch || !hMatch) continue
    const foW = parseFloat(wMatch[1])
    const foH = parseFloat(hMatch[1])

    // Get position from parent <g> transform
    const parentG = fo.closest("g[transform]")
    if (!parentG) continue
    const transform = parentG.getAttribute("transform") || ""
    const translateMatch = transform.match(/translate\(([\d.-]+)[\s,]+([\d.-]+)\)/)
    if (!translateMatch) continue
    const tx = parseFloat(translateMatch[1])
    const ty = parseFloat(translateMatch[2])

    // Percentage positioning — maps directly to SVG coordinate space
    // because wrapper aspect-ratio == SVG viewBox aspect-ratio
    const overlay = document.createElement("div")
    overlay.style.position = "absolute"
    overlay.style.left = `${(tx / svgW) * 100}%`
    overlay.style.top = `${(ty / svgH) * 100}%`
    overlay.style.width = `${(foW / svgW) * 100}%`
    overlay.style.height = `${(foH / svgH) * 100}%`
    overlay.style.overflow = "hidden"
    overlay.style.borderRadius = "32px"

    const overlayIframe = document.createElement("iframe")
    overlayIframe.src = src
    overlayIframe.style.width = "100%"
    overlayIframe.style.height = "100%"
    overlayIframe.style.border = "none"
    overlayIframe.setAttribute("allowfullscreen", "")
    overlay.appendChild(overlayIframe)

    wrapper.appendChild(overlay)
  }
}

function addInteractivity(container: HTMLElement) {
  const svg = container.querySelector("svg")
  if (!svg) return

  let scale = 1
  let translateX = 0
  let translateY = 0
  let isPanning = false
  let startX = 0
  let startY = 0
  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (isMobile) return // disable interactions on mobile

  function updateTransform() {
    svg!.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`
  }

  function resetTransform() {
    scale = 1
    translateX = 0
    translateY = 0
    updateTransform()
    container.classList.remove("enlarged")
  }

  // Long press (1s) to toggle enlarged mode
  container.addEventListener("pointerdown", (e) => {
    startX = e.clientX
    startY = e.clientY
    longPressTimer = setTimeout(() => {
      container.classList.toggle("enlarged")
      resetTransform()
    }, 1000)
  })

  container.addEventListener("pointerup", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    isPanning = false
    // Re-enable pointer events on links after panning
    svg!.querySelectorAll("a").forEach((a) => (a.style.pointerEvents = ""))
  })

  container.addEventListener("pointermove", (e) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const deadzone = 20

    // Cancel long press if moved beyond deadzone
    if (Math.abs(dx) > deadzone || Math.abs(dy) > deadzone) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
    }

    // Pan when enlarged
    if (container.classList.contains("enlarged") && e.buttons === 1) {
      if (!isPanning && (Math.abs(dx) > deadzone || Math.abs(dy) > deadzone)) {
        isPanning = true
        // Disable pointer events on links during panning
        svg!.querySelectorAll("a").forEach((a) => (a.style.pointerEvents = "none"))
      }
      if (isPanning) {
        translateX += e.movementX / scale
        translateY += e.movementY / scale
        updateTransform()
      }
    }
  })

  // Shift + wheel to zoom
  container.addEventListener(
    "wheel",
    (e) => {
      if (!e.shiftKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      scale = Math.max(0.1, Math.min(10, scale * delta))
      updateTransform()
    },
    { passive: false },
  )

  // ESC to reset
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      resetTransform()
    }
  }
  document.addEventListener("keydown", handleKeydown)
  window.addCleanup(() => document.removeEventListener("keydown", handleKeydown))
}

async function processExcalidrawEmbeds() {
  const embeds = document.querySelectorAll<HTMLElement>(".excalidraw-embed:not(.is-loaded)")
  for (const embed of embeds) {
    const src = embed.getAttribute("data-src")
    if (!src) continue
    try {
      const response = await fetch(src)
      if (!response.ok) {
        embed.innerHTML = `<p class="excalidraw-error">Failed to load drawing</p>`
        continue
      }
      const svgText = await response.text()
      // Pre-process SVG string BEFORE inserting into DOM:
      // rewrites obsidian:// and YouTube proxy URLs so the browser
      // never tries to load the original broken srcs.
      const processed = preprocessSvg(svgText)
      embed.innerHTML = processed
      const svgElement = embed.querySelector("svg")
      if (svgElement) {
        // Detect aspect ratio: landscape gets max-height cap, portrait scrolls naturally
        const w = parseFloat(svgElement.getAttribute("width") || "0")
        const h = parseFloat(svgElement.getAttribute("height") || "0")
        if (w && h && w >= h) {
          embed.classList.add("landscape")
        }
        // DOM-level fallback for hook-converted vault paths
        rewriteLinks(svgElement)
        embed.classList.add("is-loaded")
        // Safari fallback: overlay iframes as HTML elements
        createIframeOverlays(embed)
        addInteractivity(embed)
      }
    } catch (e) {
      console.error(`Failed to load excalidraw SVG: ${src}`, e)
      embed.innerHTML = `<p class="excalidraw-error">Failed to load drawing</p>`
    }
  }
}

document.addEventListener("nav", () => {
  processExcalidrawEmbeds()
})
