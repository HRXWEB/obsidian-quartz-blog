---
title: 图像裁剪对相机内参的影响分析与计算方法
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-12T16:08:46.4646+08:00
---

# 结论

- 若从左上角开始 crop：==**不变**==
- 若从别的位置crop，根据下面公式计算

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182619812.png)

    `crop_ci` 和 `crop_cj` 是在原图上的行列。

# 参考

1. [https://www.cnblogs.com/Todd-Qi/p/13149270.html](https://www.cnblogs.com/Todd-Qi/p/13149270.html)