---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Thursday, September 25th 2025, 7:35:53 pm
---

相关文档

[[配置X11Forward显示远程图形界面]]

---

# 问题描述

直接通过终端程序 ssh 到远程，运行 xeyes 可以正常出现小眼睛。

但是 vscode 远程开发的时候，直接打开远程终端， xeyes 命令不行。

# 原因&&解决办法

## tldr

原因：remote-ssh 插件打开的终端没有读取本地 `~/.ssh/config` 配置，自然没有转发。

~~解决办法（不保证正确性）：找到cursor 的设置 `@ext:ms-vscode-remote.remote-ssh,ms-vscode-remote.remote-ssh-edit,ms-vscode.remote-explorer config file` 配置 config file 的绝对路径即可。~~

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925193528258.png)

> [!fail] Title
> 上面的方法验证了没有用，新打开的终端依然不会读取config文件。
