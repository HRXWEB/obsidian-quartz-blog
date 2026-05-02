# Excalidraw + Quartz v4 Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Excalidraw drawings to render as interactive inline SVGs on a Quartz v4 blog, with SVGs hosted on jsDelivr CDN, supporting link clicking, zoom/pan, and dark mode CSS inversion.

**Architecture:** A Quartz transformer plugin intercepts `![[xxx.excalidraw]]` wikilink embeds in raw markdown text (before `ofm.ts` processes them) and replaces them with `<div>` placeholders carrying a `data-src` attribute pointing to the CDN SVG URL. A Quartz component injects client-side JavaScript that fetches the SVG from CDN, inlines it into the DOM, rewrites `obsidian://` links to site-relative URLs, and adds zoom/pan interactivity. CSS handles dark mode via `filter: invert(1) hue-rotate(180deg)`.

**Tech Stack:** TypeScript, Preact (JSX components), SCSS, Quartz v4 plugin API

**Spec:** `content/blog/Excalidraw-Quartz-Integration-Guide.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `quartz/plugins/transformers/excalidraw.ts` | Create | Transformer: intercept `![[x.excalidraw]]` in raw text, replace with CDN-pointing div |
| `quartz/plugins/transformers/index.ts` | Modify (add 1 line) | Export the new transformer |
| `quartz/components/ExcalidrawEmbed.tsx` | Create | Component: attach afterDOMLoaded script + CSS, render nothing |
| `quartz/components/scripts/excalidraw.inline.ts` | Create | Client JS: fetch SVG from CDN, inline inject, rewrite links, add interactivity |
| `quartz/components/styles/excalidraw.scss` | Create | Styles for embed container, dark mode filter, enlarged mode |
| `quartz/components/index.ts` | Modify (add 2 lines) | Import + export ExcalidrawEmbed |
| `quartz.config.ts` | Modify | Register Excalidraw transformer before ObsidianFlavoredMarkdown |
| `quartz.layout.ts` | Modify | Add ExcalidrawEmbed component to afterBody |
| `.obsidian/plugins/obsidian-excalidraw-plugin/data.json` | Modify | Enable autoexportSVG + keepInSync |
| `content/blog/test-excalidraw.md` | Create (temporary) | Test page with excalidraw embed for manual verification |

---

## Chunk 1: Excalidraw Transformer Plugin

### Task 1: Create the Excalidraw transformer

**Files:**
- Create: `quartz/plugins/transformers/excalidraw.ts`

- [ ] **Step 1: Create the transformer file**

```typescript
// quartz/plugins/transformers/excalidraw.ts
import { QuartzTransformerPlugin } from "../types"

export interface ExcalidrawOptions {
  /** Base URL for the CDN where SVGs are hosted */
  cdnBase: string
}

export const Excalidraw: QuartzTransformerPlugin<Partial<ExcalidrawOptions>> = (userOpts) => {
  const opts = {
    cdnBase: "",
    ...userOpts,
  }

  return {
    name: "Excalidraw",
    textTransform(_ctx, src) {
      // Match ![[filename.excalidraw]] or ![[filename.excalidraw|alias]]
      // Must run BEFORE ofm.ts to intercept these before they become transclusion blockquotes
      const excalidrawEmbedRegex = /!\[\[([^\[\]\|\#\\]+\.excalidraw)(?:\|([^\[\]\#]*))?\]\]/g

      return src.replace(excalidrawEmbedRegex, (_match, filename: string, alias?: string) => {
        const svgFilename = filename.replace(/\.excalidraw$/, ".svg")
        const cdnUrl = opts.cdnBase ? `${opts.cdnBase}/${svgFilename}` : svgFilename
        const altText = alias?.trim() || filename

        return `<div class="excalidraw-embed" data-src="${cdnUrl}" data-alt="${altText}"><p class="excalidraw-loading">Loading excalidraw...</p></div>`
      })
    },
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd "/Users/huangruixin/Library/Mobile Documents/iCloud~md~obsidian/Documents/quartz" && npx tsc --noEmit quartz/plugins/transformers/excalidraw.ts 2>&1 | head -20`

Expected: No errors (or only pre-existing errors from the project)

- [ ] **Step 3: Commit**

```bash
git add quartz/plugins/transformers/excalidraw.ts
git commit -m "feat(excalidraw): add transformer plugin for excalidraw embeds

Intercepts ![[xxx.excalidraw]] wikilinks in textTransform phase
and replaces them with <div> placeholders pointing to CDN SVG URLs."
```

### Task 2: Register the transformer in the plugin index and config

**Files:**
- Modify: `quartz/plugins/transformers/index.ts` (add 1 line after line 14)
- Modify: `quartz.config.ts` (add Excalidraw plugin before ObsidianFlavoredMarkdown, around line 69)

- [ ] **Step 1: Export from transformer index**

In `quartz/plugins/transformers/index.ts`, add after the last export (line 14):

```typescript
export { Excalidraw } from "./excalidraw"
```

- [ ] **Step 2: Register in quartz.config.ts**

In `quartz.config.ts`, add before `Plugin.ObsidianFlavoredMarkdown()` (before line 69):

```typescript
      Plugin.Excalidraw({
        cdnBase: "https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/excalidraw",
      }),
```

The order matters: Excalidraw must run its `textTransform` BEFORE `ObsidianFlavoredMarkdown` so that `![[xxx.excalidraw]]` patterns are replaced before `ofm.ts` tries to handle them as transclusion blockquotes.

- [ ] **Step 3: Verify build succeeds**

Run: `cd "/Users/huangruixin/Library/Mobile Documents/iCloud~md~obsidian/Documents/quartz" && npx quartz build 2>&1 | tail -5`

Expected: Build completes without errors

- [ ] **Step 4: Commit**

```bash
git add quartz/plugins/transformers/index.ts quartz.config.ts
git commit -m "feat(excalidraw): register transformer in plugin index and config"
```

---

## Chunk 2: Client-Side Component (SVG Injection + Interactivity)

### Task 3: Create the excalidraw inline script

**Files:**
- Create: `quartz/components/scripts/excalidraw.inline.ts`

This is the runtime JavaScript that runs in the browser. It handles:
1. Finding `.excalidraw-embed` placeholders in the DOM
2. Fetching SVG content from CDN (jsDelivr supports CORS with `Access-Control-Allow-Origin: *`)
3. Parsing and inlining the SVG into the DOM
4. Rewriting `obsidian://` protocol links to site-relative URLs
5. Adding zoom/pan/enlarge interactivity (desktop only)

- [ ] **Step 1: Create the inline script**

```typescript
// quartz/components/scripts/excalidraw.inline.ts

function rewriteLinks(svgElement: SVGElement) {
  // Rewrite obsidian:// protocol links to site-relative URLs
  const links = svgElement.querySelectorAll("a[href]")
  for (const link of links) {
    const href = link.getAttribute("href")
    if (href?.startsWith("obsidian://open?")) {
      try {
        const url = new URL(href)
        const file = url.searchParams.get("file")
        if (file) {
          link.setAttribute("href", "/" + file.replace(/\.md$/, ""))
          link.setAttribute("target", "_self")
        }
      } catch {
        // malformed URL, leave as-is
      }
    }
  }

  // Rewrite obsidian:// iframe sources
  const iframes = svgElement.querySelectorAll("iframe[src]")
  for (const iframe of iframes) {
    const src = iframe.getAttribute("src")
    if (src?.startsWith("obsidian://")) {
      try {
        const url = new URL(src)
        const file = url.searchParams.get("file")
        if (file) {
          iframe.setAttribute("src", "/" + file.replace(/\.md$/, ""))
        }
      } catch {
        // malformed URL, leave as-is
      }
    }
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
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml")
      const svgElement = svgDoc.querySelector("svg")
      if (svgElement) {
        rewriteLinks(svgElement)
        embed.innerHTML = ""
        embed.appendChild(document.importNode(svgElement, true))
        embed.classList.add("is-loaded")
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
```

- [ ] **Step 2: Commit**

```bash
git add quartz/components/scripts/excalidraw.inline.ts
git commit -m "feat(excalidraw): add client-side SVG fetch, inline injection, and interactivity script"
```

### Task 4: Create the excalidraw SCSS styles

**Files:**
- Create: `quartz/components/styles/excalidraw.scss`

- [ ] **Step 1: Create the styles file**

```scss
// quartz/components/styles/excalidraw.scss

.excalidraw-embed {
  width: 100%;
  margin: 1rem 0;
  text-align: center;

  &.is-loaded svg {
    max-width: 100%;
    max-height: 90vh;
    width: var(--page-width);
    cursor: default;
  }

  .excalidraw-loading {
    color: var(--gray);
    font-style: italic;
  }

  .excalidraw-error {
    color: var(--red, #e74c3c);
    font-style: italic;
  }
}

// Dark mode: CSS inversion
[saved-theme="dark"] .excalidraw-embed svg {
  filter: invert(1) hue-rotate(180deg);
}

// Enlarged/fullscreen mode
.excalidraw-embed.enlarged {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  margin: 0;

  svg {
    max-height: 95vh;
    max-width: 95vw;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add quartz/components/styles/excalidraw.scss
git commit -m "feat(excalidraw): add styles for embed container, dark mode, and enlarged mode"
```

### Task 5: Create the ExcalidrawEmbed component

**Files:**
- Create: `quartz/components/ExcalidrawEmbed.tsx`

This component renders no visible HTML. It only attaches the afterDOMLoaded script and CSS. Pattern follows existing components like Darkmode.tsx.

- [ ] **Step 1: Create the component**

```tsx
// quartz/components/ExcalidrawEmbed.tsx
// @ts-ignore
import script from "./scripts/excalidraw.inline"
import style from "./styles/excalidraw.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ExcalidrawEmbed: QuartzComponent = (_props: QuartzComponentProps) => {
  return null
}

ExcalidrawEmbed.afterDOMLoaded = script
ExcalidrawEmbed.css = style

export default (() => ExcalidrawEmbed) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: Commit**

```bash
git add quartz/components/ExcalidrawEmbed.tsx
git commit -m "feat(excalidraw): add ExcalidrawEmbed component (script + CSS loader)"
```

### Task 6: Register the component

**Files:**
- Modify: `quartz/components/index.ts` (add import + export)
- Modify: `quartz.layout.ts` (add to afterBody)

- [ ] **Step 1: Add to component index**

In `quartz/components/index.ts`, add import after line 25 (`import ConditionalRender from "./ConditionalRender"`):

```typescript
import ExcalidrawEmbed from "./ExcalidrawEmbed"
```

And add `ExcalidrawEmbed` to the export block (after `ConditionalRender,` on line 52):

```typescript
  ExcalidrawEmbed,
```

- [ ] **Step 2: Add to layout**

In `quartz.layout.ts`, add `Component.ExcalidrawEmbed()` to the `afterBody` array in `sharedPageComponents`. The current afterBody has only the Comments component. Add ExcalidrawEmbed before Comments:

```typescript
  afterBody: [
    Component.ExcalidrawEmbed(),
    Component.Comments({
```

Note: The component renders `null` so its position in afterBody doesn't affect visual layout. It just needs to be in _some_ layout slot so its scripts/CSS get bundled.

- [ ] **Step 3: Verify build succeeds**

Run: `cd "/Users/huangruixin/Library/Mobile Documents/iCloud~md~obsidian/Documents/quartz" && npx quartz build 2>&1 | tail -5`

Expected: Build completes without errors

- [ ] **Step 4: Commit**

```bash
git add quartz/components/index.ts quartz.layout.ts
git commit -m "feat(excalidraw): register ExcalidrawEmbed in component index and layout"
```

---

## Chunk 3: Excalidraw Plugin Configuration + Manual Testing

### Task 7: Configure Excalidraw plugin settings

**Files:**
- Modify: `.obsidian/plugins/obsidian-excalidraw-plugin/data.json`

- [ ] **Step 1: Update plugin settings**

In `.obsidian/plugins/obsidian-excalidraw-plugin/data.json`, change these values:

- Line 91: `"keepInSync": false` → `"keepInSync": true`
- Line 92: `"autoexportSVG": false` → `"autoexportSVG": true`

Note: Do NOT change other settings. `autoExportLightAndDark` stays `false` (we use CSS inversion). `autoexportPNG` stays `false`.

- [ ] **Step 2: (Optional) Enable exportEmbedScene**

Also consider changing `"exportEmbedScene": false` → `"exportEmbedScene": true` (line 90 in data.json). This embeds the Excalidraw scene data into the SVG, allowing re-import and editing. Increases SVG file size but is useful for portability.

- [ ] **Step 3: (Optional, Recommended) Configure onUpdateElementLinkForExportHook**

This must be done manually in Obsidian's Excalidraw plugin settings UI. Go to Excalidraw plugin settings → "Startup Script" and add:

```javascript
ea.onUpdateElementLinkForExportHook = (link) => {
  if (link.startsWith("obsidian://open?")) {
    const url = new URL(link);
    const file = url.searchParams.get("file");
    if (file) return file;
  }
  return link;
};
```

This rewrites obsidian:// links to relative paths at SVG export time, reducing the runtime JS link-rewriting workload.

- [ ] **Step 4: Verify PicList directory monitoring**

Verify that PicList is configured to:
1. Monitor the directory where Excalidraw auto-exports SVGs (e.g., `content/Excalidraw/`)
2. Filter for `.svg` files only
3. Upload to path `excalidraw/{filename}` in the GitHub image hosting repo
4. Enable same-name overwrite (so re-exported SVGs replace the old version)

Without PicList properly configured, the CDN URLs generated by the transformer will return 404.

- [ ] **Step 5: Commit**

```bash
git add .obsidian/plugins/obsidian-excalidraw-plugin/data.json
git commit -m "feat(excalidraw): enable auto SVG export and keep-in-sync in plugin settings"
```

### Task 8: Create test content and verify end-to-end

**Files:**
- Create: `content/blog/test-excalidraw.md` (temporary, for manual testing)

- [ ] **Step 1: Create a test markdown page**

```markdown
---
title: Excalidraw Integration Test
draft: true
tags: []
created: 2026-03-22T00:00:00.000+08:00
updated: 2026-03-22T00:00:00.000+08:00
---

# Excalidraw Embed Test

Below should render an excalidraw drawing from CDN:

![[test-drawing.excalidraw]]

If you see "Loading drawing..." that stays forever, the CDN URL may not be accessible yet.
If you see the SVG content, the integration works!
```

- [ ] **Step 2: Build and preview**

Run: `cd "/Users/huangruixin/Library/Mobile Documents/iCloud~md~obsidian/Documents/quartz" && bash preview.sh`

Expected: Server starts. Navigate to `http://localhost:8080/blog/test-excalidraw` in browser.

- [ ] **Step 3: Verify in browser**

Check the page source for:
1. The `<div class="excalidraw-embed" data-src="https://cdn.jsdelivr.net/gh/...">` placeholder exists in the HTML
2. The `postscript.js` bundle includes the excalidraw fetch/inject code
3. The `index.css` bundle includes `.excalidraw-embed` styles
4. If you have an actual SVG at the CDN URL, it should inline into the page

- [ ] **Step 4: Verify dark mode**

Toggle dark mode in the site. The SVG (if loaded) should invert colors via CSS filter.

- [ ] **Step 5: Clean up test file**

Delete `content/blog/test-excalidraw.md` after verification (or keep as draft).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(excalidraw): complete excalidraw integration with CDN SVG support"
```
