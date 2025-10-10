---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 原因

定义的 `enum` 结构体与其它处的**宏定义**有冲突。

# 例子

之前碰过这个问题时，报错是

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926152546451.png)

然后全局搜索了一下代码，发现确实定义了一个叫 `DEBUG_MODE` 的宏

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926152619668.png)

# 解决方法

改名，简单粗暴

# 参考

1. [https://blog.csdn.net/u012503639/article/details/79722889](https://blog.csdn.net/u012503639/article/details/79722889)