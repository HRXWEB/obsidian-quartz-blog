---
permalink: 
title:
draft: false
aliases: []
tags: []
created: 2025-09-19T17:05:09.099+08:00
updated: 2025-10-10T18:01:21.2121+08:00
---

在：

- 使用 obsidian 撰写 markdown
- 使用 quartz 生成静态站点

的情况下，撰写博客注意以下几点：

- 双链的写法： `[[blog文件名|显示的文字]]`。虽然 obsidian 支持`文件名` 或者 `显示的文字` 含有空格，但是 quartz 生成站点时，若想要实现页面间跳转，<font color = red>不能含有空格</font>。可以使用 `-` 替代 ` `
- 目录不能使用 html 语法的上标，即 1，会导致无法点击目录实现页面内跳转，使用 `[^1]` 的写法来引用参考资料
