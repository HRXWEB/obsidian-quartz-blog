---
title: 给终端文字添加超链接
draft: 
aliases: []
tags: []
created: 2025-10-27T18:34:39.3939+08:00
updated: 2025-10-27T18:44:30.3030+08:00
---

# 实例

```bash
printf '\e]8;;https://www.google.com\e\\Click Me!\e]8;;\e\\\n'
```

效果：最终会输出 <u>Click Me!</u>，点击即可跳转

# 用法

```bash
ESC]8;parameters;URISTTextESC]8;;ST
```

- `ESC]8` 表示这是一个 OSC 8 命令
- `parameters` 简单设置为空即可，高级用法待撰写
- `URISTTEXT` 是三个部分：
	- `URI`：链接
	- `ST`：string terminator，字符串结束符，一般用 `\e\\` 表示，即 `ESC \`。其中 `\\` 是因为转义符号的原因
	- `TEXT`：要显示的文字

# 关键原理：OSC 8 控制序列

**OSC (operating system command) 8** 是一种特殊的终端转义序列，它允许程序在终端中嵌入超链接信息。如果用户使用的终端模拟器（例如：iTerm2, GNOME Terminal, VS Code Integrated Terminal, newer versions of Terminal.app 等）支持这种序列，那么终端就会将这段文本渲染为可点击的链接。