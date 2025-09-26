---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 3:26:33 pm
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