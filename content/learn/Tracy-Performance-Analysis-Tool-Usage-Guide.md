---
title: Tracy性能分析工具使用方法指南
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-12T16:54:02.022+08:00
---

# 几种工具窗如何触发

1. statistics，查看统计性的信息。点击顶部菜单即可触发

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154424041.png)

2. sample entry call stacks，不太清楚作用。点击statistics中Name条目即可触发

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154436324.png)

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154445723.png)

3. source view，查看汇编代码。点击Ghost Zone的地方，就可以看到这个Ghost Zon的汇编代码

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154500320.png)

4. call stack，查看调用过程。点击Zone，给出这个Zone的callstack，stack深度自定义。

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154510819.png)
