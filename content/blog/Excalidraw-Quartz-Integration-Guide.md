---
permalink:
title: Excalidraw + Quartz v4 集成方案：CDN 托管 + 交互式 SVG 内联注入
draft: false
aliases: []
tags:
  - quartz
  - excalidraw
  - obsidian
created: 2026-03-22T00:00:00.000+08:00
updated: 2026-03-22T00:00:00.000+08:00
---

# 目标

在 Quartz v4 发布的博客中完整支持 Excalidraw 绘图，实现：
1. Excalidraw 文件自动导出 SVG
2. SVG 自动上传到 GitHub 图床（jsDelivr CDN）
3. 发布后保留交互效果（链接可点击、YouTube 可播放、缩放/平移）
4. 深色模式自动适配（CSS 反色 + foreignObject counter-invert）
5. 双向链接敏感（文件重命名后 SVG 中的链接自动更新）

> [!tip] E2E 测试
> 端到端测试页面：[[test-excalidraw-e2e|Excalidraw E2E 测试]]

# 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│ Obsidian (本地编辑)                                          │
│                                                              │
│  .excalidraw.md ──autoexport+keepInSync──→ .excalidraw.svg  │
│                                                              │
│  注意：compatibilityMode=false 时源文件为 .excalidraw.md     │
│  autoexport 只剥离 .md 后缀再加 .svg                        │
└──────────────────────────────────────────────────────────────┘
                                                   │
┌──────────────────────────────────────────────────┼──────────┐
│ git commit (pre-commit hook)                     │          │
│                                                  ↓          │
│  upload_excalidraw_svgs.sh ──GitHub API──→ obsidian-images  │
│  convert_links.py (跳过 .excalidraw)      excalidraw/       │
│                                           jsDelivr CDN      │
└─────────────────────────────────────────────────────────────┘
                                                   │
┌──────────────────────────────────────────────────┼──────────┐
│ Quartz (构建时)                                  │          │
│                                                  ↓          │
│  ![[x.excalidraw]] ──transformer──→ <div data-src=CDN>     │
│  SVG 文件名: x.excalidraw.svg (不是 x.svg)                 │
└─────────────────────────────────────────────────────────────┘
                                                   │
┌──────────────────────────────────────────────────┼──────────┐
│ 浏览器 (运行时)                                  │          │
│                                                  ↓          │
│  1. 字符串预处理：改写 obsidian:// 和 YouTube 代理 URL      │
│  2. innerHTML 注入 SVG 到 DOM                               │
│  3. DOM 级别链接重写（兜底 hook 转换的路径）                 │
│  4. Safari fallback：foreignObject → HTML 覆盖层            │
│  5. 深色模式: CSS filter invert + counter-invert            │
│  6. 交互：长按放大、Shift+滚轮缩放、拖拽平移               │
└─────────────────────────────────────────────────────────────┘
```

# 第1步：配置 Excalidraw 插件

## 需要修改的设置

在 Obsidian 的 Excalidraw 插件设置中修改以下选项：

| 设置项 | 改为 | 说明 |
|--------|------|------|
| `autoexportSVG` | `true` | 每次保存自动导出 SVG |
| `keepInSync` | `true` | 修改绘图后自动更新 SVG |
| `exportWithBackground` | `true`（保持默认） | 导出含背景色（CSS 反色需要） |
| `autoExportLightAndDark` | `false`（保持默认） | 只导出一个主题，用 CSS 反色处理深色模式 |

## 文件格式与命名约定

> [!warning] 关键约定
> 当 `compatibilityMode = false`（默认）时：
> - 源文件格式：`xxx.excalidraw.md`（不是 `.excalidraw`）
> - autoexport 只剥离 `.md` 后缀再加 `.svg`：`xxx.excalidraw.md` → `xxx.excalidraw.svg`
> - 不是 `xxx.svg`！这个命名约定影响 transformer、上传脚本和 CDN URL

## 自动导出行为

- 保存 `drawing.excalidraw.md` 时，自动在同目录生成 `drawing.excalidraw.svg`
- 修改后再保存，SVG 会被覆盖更新
- 重命名时，`keepInSync` 确保旧 SVG 删除、新 SVG 生成

## 配置 onUpdateElementLinkForExportHook（可选）

Excalidraw 插件 v2.0.23+ 支持在 startup script 中配置链接导出 hook。这个 hook 在 SVG 导出时把 `obsidian://open?vault=...&file=...` 格式的链接转换为相对路径。

配置方法：在 Excalidraw 插件设置中找到 "Startup Script"，添加：

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

> [!note]
> 即使不配置此 hook，运行时 JS 也会在字符串预处理阶段改写 `obsidian://` 链接。此 hook 只是减少运行时工作量。

# 第2步：通过 Pre-commit Hook 自动上传 SVG 到 CDN

## 上传脚本

`scripts/upload_excalidraw_svgs.sh`：
1. 扫描 `content/` 目录中所有 `.excalidraw` 和 `.excalidraw.md` 文件
2. 推导对应 SVG 文件名（`.excalidraw.md` → `.excalidraw.svg`，`.excalidraw` → `.svg`）
3. 通过 GitHub API 上传/覆盖到 `hrxweb/obsidian-images` 仓库的 `excalidraw/` 目录
4. 需要 GitHub Token（通过 `gh auth token` 或 `GITHUB_TOKEN` 环境变量）

## 注册到 Pre-commit

在 `.pre-commit-config.yaml` 中添加：

```yaml
-   id: upload-excalidraw-svgs
    name: "Upload Excalidraw SVGs to GitHub image repo"
    entry: ./scripts/upload_excalidraw_svgs.sh
    language: system
    stages: [pre-commit]
    always_run: true
```

## 修改 convert_links.py

在 `scripts/convert_links.py` 中排除 `.excalidraw` 文件，避免和 Quartz transformer 冲突：

```python
if filename.endswith('.excalidraw'):
    return match.group(0)  # return original unchanged
```

## .gitignore 配置

`.excalidraw.svg` 文件由 Obsidian 自动导出，通过 pre-commit hook 上传到 CDN 图床，**不需要提交到 Git 仓库**。在 `.gitignore` 中添加：

```
*.excalidraw.svg
```

## CDN URL 格式

```
本地文件: content/Excalidraw/drawing.excalidraw.svg
CDN URL:  https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/excalidraw/drawing.excalidraw.svg
```

## jsDelivr 缓存刷新

jsDelivr 默认缓存 7 天。更新 SVG 后可手动刷新：

```
https://purge.jsdelivr.net/gh/hrxweb/obsidian-images/excalidraw/drawing.excalidraw.svg
```

# 第3步：开发 Quartz Transformer 插件

## 文件：`quartz/plugins/transformers/excalidraw.ts`

插件在 `textTransform` 阶段（最早执行，**必须在 `ofm.ts` 之前**）拦截 `![[xxx.excalidraw]]` 嵌入语法：

```typescript
import { QuartzTransformerPlugin } from "../types"

export interface ExcalidrawOptions {
  cdnBase: string
}

export const Excalidraw: QuartzTransformerPlugin<Partial<ExcalidrawOptions>> = (userOpts) => {
  const opts = { cdnBase: "", ...userOpts }

  return {
    name: "Excalidraw",
    textTransform(_ctx, src) {
      const excalidrawEmbedRegex = /!\[\[([^\[\]\|\#\\]+\.excalidraw)(?:\|([^\[\]\#]*))?\]\]/g

      return src.replace(excalidrawEmbedRegex, (_match, filename: string, alias?: string) => {
        // 关键：filename + ".svg"，不是 replace(".excalidraw", ".svg")
        // 因为 autoexport 的命名是 xxx.excalidraw.svg
        const svgFilename = filename + ".svg"
        const cdnUrl = opts.cdnBase ? `${opts.cdnBase}/${svgFilename}` : svgFilename
        const altText = alias?.trim() || filename

        return `<div class="excalidraw-embed" data-src="${cdnUrl}" data-alt="${altText}"><p class="excalidraw-loading">Loading excalidraw...</p></div>`
      })
    },
  }
}
```

## 注册插件

`quartz/plugins/transformers/index.ts` 中导出：

```typescript
export { Excalidraw } from "./excalidraw"
```

`quartz.config.ts` 中注册（**放在 `ObsidianFlavoredMarkdown` 之前**）：

```typescript
Plugin.Excalidraw({
  cdnBase: "https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/excalidraw",
}),
Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
```

# 第4步：开发客户端组件

## 组件注册

`quartz/components/ExcalidrawEmbed.tsx`：

```typescript
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

在 `quartz/components/index.ts` 中导出，在 `quartz.layout.ts` 的 `afterBody` 中注册。

## 运行时 JS：`excalidraw.inline.ts`

### 核心流程

```
页面加载 / SPA 导航（"nav" 事件）
    ↓
扫描所有 .excalidraw-embed:not(.is-loaded) 元素
    ↓
fetch(data-src) 获取 SVG 文本
    ↓
① 字符串预处理（preprocessSvg）：
   - YouTube 代理 URL → youtube.com/embed
   - obsidian:// iframe src → 站内路径
   - obsidian:// link href → 站内路径
    ↓
② innerHTML 注入（不用 DOMParser，因为 foreignObject iframe 需要 HTML parser）
    ↓
③ DOM 级链接重写（rewriteLinks）：兜底处理 hook 转换的相对路径
    ↓
④ Safari fallback（createIframeOverlays）：
   检测 foreignObject 是否 0×0，若是则创建 HTML 覆盖层
    ↓
⑤ 添加交互（addInteractivity）
```

### 字符串预处理（关键设计）

> [!important] 为什么需要字符串预处理？
> 如果直接 `innerHTML = svgText`，浏览器会**立即**加载 iframe 的原始 src：
> - `obsidian://open?vault=...` → 触发"打开 Obsidian"对话框
> - `https://releases.obsidian.md/youtube?v=...` → 404 错误
>
> 所以必须在插入 DOM **之前**，在字符串阶段完成 URL 改写。

预处理覆盖三类 URL：

| 原始 URL | 改写为 | 说明 |
|----------|--------|------|
| `https://releases.obsidian.md/youtube?v=xxx` | `https://www.youtube.com/embed/xxx` | Obsidian YouTube 代理 |
| `obsidian://open?...file=content%2Fblog%2Fxxx` | `/blog/xxx` | 内部链接 iframe src |
| `obsidian://open?...file=content%2Fblog%2Fxxx`（`<a>` href） | `/blog/xxx` | 内部链接 href |

路径转换逻辑（`toSitePath`）：
1. `decodeURIComponent`（`%2F` → `/`）
2. 去掉 `content/` 前缀
3. 去掉 `.md` 后缀
4. 加上 `/` 前缀

### Safari foreignObject 兼容

Safari 不支持 CSS-only 尺寸的 `<foreignObject>`（渲染为 0×0）。添加 `width`/`height` 属性会导致内容以原始像素大小渲染，不跟随 SVG 缩放，布局崩坏。

解决方案：`createIframeOverlays()` 函数
1. 检测 foreignObject 的 `getBoundingClientRect()` 是否为 0×0
2. 若是（Safari），创建 `aspect-ratio` 与 SVG viewBox 一致的 wrapper
3. 将 SVG 强制填满 wrapper（`width:100%; height:100%; max-height:none`）
4. 从 `<g transform="translate(x, y)">` 解析位置，从 `style` 解析尺寸
5. 以百分比定位创建 HTML `<iframe>` 覆盖层

> [!important] 为什么用 aspect-ratio wrapper？
> 之前用百分比定位时，CSS `max-height: 90vh` 会让 SVG 比 wrapper 窄，导致百分比基准错误。
> 像素定位 + `getBoundingClientRect()` 在 Safari 又有时序问题。
> 最终方案：wrapper 通过 `aspect-ratio` 精确匹配 SVG 比例，SVG 填满 wrapper，百分比天然准确。

### 为什么用 innerHTML 而不是 DOMParser？

`DOMParser.parseFromString(svgText, "image/svg+xml")` + `document.importNode()` 会丢失 `<foreignObject>` 内的 iframe 内容。`innerHTML` 使用浏览器的 HTML parser，能正确处理 SVG 中的 foreignObject HTML 内容。

## CSS 样式：`excalidraw.scss`

```scss
.excalidraw-embed {
  width: 100%;
  margin: 1rem 0;
  text-align: center;

  &.is-loaded svg {
    max-width: 100%;
    width: var(--page-width);
    cursor: default;
  }

  // 横版绘图：限制高度避免撑爆视口
  &.is-loaded.landscape svg {
    max-height: 90vh;
  }
}

// 深色模式：CSS 反色 + foreignObject counter-invert
[saved-theme="dark"] .excalidraw-embed svg {
  filter: invert(1) hue-rotate(180deg);

  foreignObject {
    filter: invert(1) hue-rotate(180deg);  // 抵消反色，iframe 内容正常显示
  }
}

// 放大模式
.excalidraw-embed.enlarged {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}
```

### 交互功能（桌面端）

| 操作 | 效果 |
|------|------|
| 长按 1 秒 | 切换全屏放大模式 |
| Shift + 滚轮 | 缩放（0.1x ~ 10x） |
| 拖拽 | 平移（20px 死区防误触链接） |
| ESC | 重置缩放/平移/退出放大 |
| 移动端 | 禁用上述交互 |

# 第5步：双向链接敏感性

## 笔记文件重命名

```
Obsidian 中重命名 note-A.md → note-B.md
    ↓
Obsidian 自动更新所有引用 note-A 的文件（包括 .excalidraw.md 中的链接）
    ↓
Excalidraw 插件检测到 .excalidraw.md 文件变更
    ↓
keepInSync=true → 自动重新导出 SVG（SVG 内链接已更新为 note-B）
    ↓
git commit → pre-commit hook 上传更新后的 SVG → 覆盖 CDN 旧版本
    ↓
Quartz 重新构建 → 绘图中链接正确指向 note-B
```

## Excalidraw 文件本身重命名

同理，Obsidian 更新所有 `![[old.excalidraw]]` → `![[new.excalidraw]]`，`keepInSync` 导出新 SVG，transformer 根据新文件名生成新 CDN URL。

# 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| Excalidraw 插件设置 | 修改 | 开启 `autoexportSVG`、`keepInSync` |
| `.gitignore` | 修改 | 添加 `*.excalidraw.svg`（SVG 只上传 CDN，不入仓库） |
| `scripts/upload_excalidraw_svgs.sh` | **新增** | Pre-commit hook：上传 SVG 到 GitHub 图床 |
| `scripts/convert_links.py` | 修改 | 排除 `.excalidraw` 文件 |
| `.pre-commit-config.yaml` | 修改 | 注册 SVG 上传 hook |
| `quartz/plugins/transformers/excalidraw.ts` | **新增** | 构建时 transformer |
| `quartz/plugins/transformers/index.ts` | 修改 | 导出新 transformer |
| `quartz.config.ts` | 修改 | 注册 Excalidraw transformer（在 OFM 之前） |
| `quartz/components/ExcalidrawEmbed.tsx` | **新增** | 客户端组件入口 |
| `quartz/components/scripts/excalidraw.inline.ts` | **新增** | 运行时 SVG 注入 + 链接重写 + 交互 |
| `quartz/components/styles/excalidraw.scss` | **新增** | 样式 + 深色模式 + 放大模式 |
| `quartz/components/index.ts` | 修改 | 导出 ExcalidrawEmbed |
| `quartz.layout.ts` | 修改 | 注册组件到 `afterBody` |

# 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| SVG 存储 | jsDelivr CDN | 与现有图床工作流一致，`Access-Control-Allow-Origin: *` |
| SVG 上传 | Pre-commit hook + GitHub API | 复用 `.pre-commit-config.yaml`，commit 时自动上传 |
| SVG 注入 | `innerHTML`（非 DOMParser） | DOMParser + importNode 丢失 foreignObject iframe |
| URL 改写时机 | 字符串阶段（DOM 之前） | 防止浏览器加载 `obsidian://` 触发协议处理 |
| Safari 兼容 | aspect-ratio wrapper + HTML 覆盖层 | 属性修复破坏缩放，像素定位有时序问题，aspect-ratio 让百分比天然准确 |
| 深色模式 | CSS `filter: invert(1) hue-rotate(180deg)` | 单文件导出，foreignObject 用 counter-invert |
| Transformer | 独立插件 | 不修改 ofm.ts，保持 Quartz 升级兼容性 |

# 已知限制

1. **Safari foreignObject**：iframe 通过 HTML 覆盖层渲染，与 SVG 缩放/平移交互可能不同步
2. **X-Frame-Options**：设置了此头的外部网站（如 excalidraw.com）无法在 iframe 中嵌入
3. **jsDelivr 缓存**：默认 7 天，更新 SVG 后需手动 purge 或等待过期
4. **CDN 旧文件**：重命名 excalidraw 文件后，旧 SVG 不会自动从 CDN 删除

# 参考资料

- [zsolt 的 publish.js 脚本](https://gist.github.com/zsviczian/0bb31aa2d08ba689c14158e82cbbda5a)
- [Excalidraw 插件 GitHub](https://github.com/zsviczian/obsidian-excalidraw-plugin)
- [Quartz Issue #1187: Excalidraw 支持讨论](https://github.com/jackyzha0/quartz/issues/1187)
- [bartkl 的 Quartz Excalidraw 渲染方案](https://gist.github.com/bartkl/0134c6ce4a5d532464b40d3bfbcb64e4)
