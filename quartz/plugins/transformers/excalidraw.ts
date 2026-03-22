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
        // Obsidian autoexport: xxx.excalidraw.md → xxx.excalidraw.svg (only strips .md, adds .svg)
        const svgFilename = filename + ".svg"
        const cdnUrl = opts.cdnBase ? `${opts.cdnBase}/${svgFilename}` : svgFilename
        const altText = alias?.trim() || filename

        return `<div class="excalidraw-embed" data-src="${cdnUrl}" data-alt="${altText}"><p class="excalidraw-loading">Loading excalidraw...</p></div>`
      })
    },
  }
}
