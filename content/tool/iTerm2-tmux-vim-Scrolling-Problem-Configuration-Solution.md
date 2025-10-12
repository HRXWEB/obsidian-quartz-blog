---
title: iTerm2中tmux/vim无法滚动问题配置解决方案
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-12T17:40:04.044+08:00
---

# 问题

## tmux

正常 `ctrl + b [` 后就可以通过触控板滚动查看 tmux session terminal 的历史 console log，但是现状是上下滑动触控板时，是 scroll 的 iterm2 的 terminal tab。

## vim

无法用触控板滚动到其他行

# 解决办法

[https://superuser.com/a/1444958](https://superuser.com/a/1444958)

如图将这个配置改为 Yes

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925194644678.png)

tmux 和 vim 都用这个设置是因为 [[iTerm2-Alternate-Screen-Mode-Detailed-Analysis-Working-Principle-and-Mechanism]]