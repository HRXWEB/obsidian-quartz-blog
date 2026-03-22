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
