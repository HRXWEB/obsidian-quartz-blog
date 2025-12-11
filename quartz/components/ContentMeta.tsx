import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
  /**
   * Whether to show original article link
   */
  showOriginalLink: boolean
  /**
   * Text to display for original article link
   */
  originalLinkText: string
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
  showOriginalLink: true,
  originalLinkText: "查看原文",
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  // Merge options with defaults
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []

      if (fileData.dates) {
        segments.push(<Date date={getDate(cfg, fileData)!} locale={cfg.locale} />)
      }

      // Display reading time if enabled
      if (options.showReadingTime) {
        const { minutes, words: _words } = readingTime(text)
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes),
        })
        segments.push(<span>{displayedTime}</span>)
      }

      // Display original article link if URL exists in frontmatter
      // Support both 'url' and 'URL' field names
      if (options.showOriginalLink) {
        const url = (fileData.frontmatter?.url || fileData.frontmatter?.URL) as string | undefined
        if (url && url.trim() !== "") {
          segments.push(
            <a href={url} target="_blank" rel="noopener noreferrer" class="original-link">
              {options.originalLinkText}
            </a>
          )
        }
      }

      return (
        <p show-comma={options.showComma} class={classNames(displayClass, "content-meta")}>
          {segments}
        </p>
      )
    } else {
      return null
    }
  }

  ContentMetadata.css = style

  return ContentMetadata
}) satisfies QuartzComponentConstructor
