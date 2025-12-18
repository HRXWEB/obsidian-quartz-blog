---
permalink:
title: Obsidian+Quartz博客写作注意事项
draft: false
aliases: []
tags: []
created: 2025-09-19T17:05:09.099+08:00
updated: 2025-12-18T11:42:13.1313+08:00
---

在：

- 使用 obsidian 撰写 markdown
- 使用 quartz 生成静态站点

的情况下，撰写博客注意以下几点：

- 双链的写法： `[[blog文件名|显示的文字]]`：
	- 虽然 obsidian 支持 `文件名` 或者 `显示的文字` 含有空格，但是 quartz 生成站点时，若想要实现**页面间**跳转，<font color = red>不能含有空格</font>。可以使用 `-` 替代 ` `
	- 空的链接，即 `[]()` 会反向链接到首页，要注意避免
- 目录
	- 不能使用 html 语法的上标，即 `<sup>1</sup>`，会导致无法点击章节并跳转，使用 `[^1]` 的写法来引用参考资料
	- 不能含有 ->，或则会被解析成 `<span>&rarr;</span>`，也会导致无法点击章节并跳转
- frontmatter yaml
	- 时间有关的字段，如 `created`、`updated`，写法要符合 [JavaScript Date format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format)，如 `YYYY-MM-DDTHH:mm:ss.sssZ`
- code block
	- 所有的代码块的语言要写成小写的，不能大写，比如 C 语言要写成 "\`\`\`c"，而不是写大写的 "\`\`\`C"，会高亮渲染失败！[原因](https://github.com/jackyzha0/quartz/issues/552)。支持渲染的语言 [见此](https://github.com/shikijs/shiki/blob/main/docs/references/engine-js-compat.md)
	- `mermaid` 代码块的注释要写成 `%% ... %%`，不能只写一个 `%%`，会导致无法渲染！因为 `quartz/plugins/transformers/ofm.ts` 中，会通过正则表达式 `const commentRegex = new RegExp(/%%[\s\S]*?%%/g)` 来识别 obsidian 的注释，然后替换成空字符串：
		```js
			textTransform(_ctx, src) {
				// do comments at text level
				if (opts.comments) {
					src = src.replace(commentRegex, "")
			}
		```

		如果只写一个 `%%`，而且出现了多次的话，会导致每两个 `%%` 之间的内容被删除，从而导致无法渲染！详见 [Mermaid · Issue #2217 · jackyzha0/quartz](https://github.com/jackyzha0/quartz/issues/2217)
