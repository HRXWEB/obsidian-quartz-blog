---
title: iTerm2中tmux/vim退出后内容残留问题解决方案
draft: 
aliases: []
tags: []
created: 2025-10-12T17:24:54.5454+08:00
updated: 2025-10-12T17:39:49.4949+08:00
---

# 现象描述

如图，使用 vim 编辑完 `/tmp/a.txt` 退出后，滚动终端，发现文件内容”残留“在终端上

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251012172530249.png)

# 原因

[[iTerm2-Alternate-Screen-Mode-Detailed-Analysis-Working-Principle-and-Mechanism|交替屏幕缓冲区]]的内容被错误的保存到了主屏幕缓冲区

# 解决方案

取消勾选 `Prefs > Profiles > Terminal > Save lines to scrollback in alternate screen mode`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251012172845167.png)
