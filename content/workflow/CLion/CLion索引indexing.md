---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:28 pm
updated: Thursday, September 25th 2025, 7:14:48 pm
---

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191341970.png)

从图上看，索引就是建立 symbol，这样才能够使用 [finding usages](https://www.jetbrains.com/help/clion/find-highlight-usages.html), [navigation](https://www.jetbrains.com/help/clion/navigating-through-the-source-code.html), [code completion](https://www.jetbrains.com/help/clion/auto-completing-code.html), [code generation](https://www.jetbrains.com/help/clion/generating-code.html), and [refactorings](https://www.jetbrains.com/help/clion/refactoring-source-code.html). 这些特性

# 减少索引时间

排除文件或目录，即不必要的文件别扫描了，例如： logs, binaries, or imported libraries.

## 排除文件

右键文件→ override file type → plain text 即可

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191400940.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191423949.png)

## 排除目录

右键目录：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191433208.png)

==另外这会导致在使用 Find in Files 的功能时也排除搜索此目录==

## 排除库目录

右键库目录：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191444111.png)

这不会导致Find in Files功能跳过搜索这个目录