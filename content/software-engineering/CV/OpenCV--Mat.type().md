---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:30 pm
updated: Friday, September 26th 2025, 5:11:42 pm
---

cv::Mat type 宏值：

```Plain
        C1  C2  C3  C4
CV_8U   0   8   16  24
CV_8S   1   9   17  25
CV_16U  2   10  18  26
CV_16S  3   11  19  27
CV_32S  4   12  20  28
CV_32F  5   13  21  29
CV_64F  6   14  22  30
```

如果不关心channel的数量的话，可以用：

```C++
cv::Mat mat;
int type = mat.type() % 8
// %8 其实就是等价于取最后3bit，即
int type = mat.type() & 0x07
```

来获取mat中每个值的数据类型。

# 从编码方式来理解 type

```C++
type = (depth & CV_MAT_DEPTH_MASK) | ((cn - 1) << CV_CN_SHIFT)
```

- `CV_MAT_DEPTH_MASK` = 0x07
- `CV_CN_SHIFT` = 3

type 由两个信息决定：

- depth，即位宽，即用多少 bit 表示一个数
- channel，即通道数

opencv 一共定义了 7 种 depth：CV_8U、CV_8S、…、CV_64F。用 3 个 bit 就能完全表示。于是就把通道个数往左移三位就不会与depth信息发生重叠了，很容易就能将 depth 和 channel 信息从 type 分离出来。即：

```C++
uchar depth = type & CV_MAT_DEPTH_MASK;
uchar chans = 1 + (type >> CV_CN_SHIFT);
```