---
title:
draft:
aliases: [c++-template-typename]
tags: []
created: 2025-09-16T15:24:41.4141+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

# 转载

[原文](https://www.cnblogs.com/weiyouqing/p/10538892.html)

# 文内几个重点关注的内容

1. 三个关键概念
    - 限定名与非限定名
    - 依赖名与非依赖名
    - 类作用域
2. 引入typename是为了解决模板中的类型名与成员名冲突问题，即编译时无法确定是类型还是成员名。