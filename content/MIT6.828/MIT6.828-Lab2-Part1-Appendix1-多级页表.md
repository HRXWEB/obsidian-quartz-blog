---
draft: false
aliases: []
title: MIT6.828-Lab2-Part1-Appendix1-多级页表
subtitle:
lang: zh
author: Ricky Yel
show_edit_on_github: true
tags: []
show_tags: true
created: 2025-09-18T16:51:35.3535+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

<!--more-->

# 分页内存管理

## 32-bit

在x86(32bit)架构中，需要管理4GB(2^32)的内存。

1. 通常一个“一级页表”是由1024个表项组成的，每个表项存储了物理页面的相关信息。
2. 页目录也是一个由1024个表项组成的“二级页表”，只不过其每一项都代表了一级页表的索引号。

由于每个页面大小是4KB，所以通过此二级页表，就可以管理 4KB \* 1024 \* 1024 = 4GB 的内存了。

总之多级页表的作用就是通过尽可能少的空间来管理尽可能多的内存，起到的是内存映射的效果。

具体在此架构(32bit)下，由虚拟地址VA映射到物理地址PA的过程用图表示为：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250918171850570.png)

<center>2级页表内存管理@https://github.com/0voice/kernel_memory_management</center>

一个32位的虚拟地址，就可以索引：10+10+12 --> 2^10 \* 2^ 10 \* 2^12Byte --> 1024 \* 1024 \* 4KB = 4GB 的内存

管理一级页表需要1024\*32bits=4KB的内存，管理二级页表需要 102\*1024\*32bits=4MB的内存。

## 64-bit

类推得，64-bit需要分成四级

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250918171901763.png)

<center>4级页表内存管理@https://github.com/0voice/kernel_memory_management</center>

1. Page Global Directory
2. Page Upper Directory
3. Page Middle Directory
4. Page Table Entry

# 参考资料

1. [stackoverflow--page table vs page directory](https://stackoverflow.com/questions/29945171/difference-between-page-table-and-page-directory)
2. [github--0voice](https://github.com/0voice/kernel_memory_management/blob/main/✍%20文章/一文带你了解，虚拟内存、内存分页、分段、段页式内存管理.md)

