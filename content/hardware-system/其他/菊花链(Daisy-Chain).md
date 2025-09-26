---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 2:19:58 pm
---

> 链条，故名思义就是一系列同样的东西首尾相接，组成一个“链”。类比链表结构，像封面图也体现了这个思想。

## [DP菊花链](https://juejin.cn/post/7041516788437237796)

DP还分为几种模式：

- SST（Single Stream Transport）（DP1.0@2006）
- MST（Multi Stream Transport）（DP1.2@2010）

> [!important] 只有支持MST模式的DP信号传输才能实现菊花链

通常情况下笔记本电脑都是支持DP菊花链的，这样买两台支持MST的带DP口的显示器就可以实现三屏异显（包括电脑屏幕在内）

**由于MacOS系统的限制，不能支持DP的菊花链，还有一个解决办法就是雷电菊花链**

## 雷电菊花链

除了MacOS的限制以外，标准M系列芯片由于硬件的限制，只能用Displaylink技术实现多屏异显，否则只能扩展一块屏幕，其它屏幕都是镜像，即最终的效果是ABBBB。

==而配备M Pro系列以上的产品，可以通过菊花链支持双屏异显。==

雷电 3/4 可以输出 2 条 DP 信号。

- 在使用雷电 3 拓展坞时。需要关注的接口有三个：
    
    - 一个雷电接口（带有闪电标志）接到 MacBook（基本上这个接口还有供电功能给电脑充电）
    - 一个 DP 接口接一台显示器
    - 一个下游雷电 3 接口，通过一根 type-c 转 DP 接口接另一台显示器。此时雷电口降级为 DP Alternate Mode 传输视频信号。

    有时拓展坞也会把下游雷电 3 接口直接做成 DP 物理接口，此时就是两个 DP 接口接到两台显示器的 DP接口，即可实现双屏异显。最好的话还是保留这个下游雷电 3 接口，能实现更丰富的作用，type-c 转 DP 的线还是很好买的。

- 雷电 4 拓展坞，一般雷电 4 拓展坞带有 3 个下游雷电接口
    - 其中 2 个下游雷电接口可以直接接显示器实现双屏异显。
    - 另外一个下游雷电接口就没法接显示器了，因为**只有 2 条 DP 信号**。

## 显示器带宽占用

首先了解一下雷电接口的速率：

- 雷电3：40Gb/s
- 雷电4：40Gb/s
- 雷电5：==**120Gb/s**==

带宽计算公式：

$$\text{Bandwidth} = \text{Resolution} \times \text{FPS} \times \text{Color Depth} \times \text{Color Format}$$

以一个 RGB、8bit、4k、60Hz显示器为例：

$$\text{BandWidth} = 3920 \cdot 2160 \cdot 60(s^{-1}) \cdot 8\text{bit} \cdot 3 = 11.355 \text{Gb/s}$$

所以 2 台显示器需要占用大概 25Gb/s 的带宽用于视频传输，剩余的才能用作数据传输。在这个问题上，雷电 3/4 也存在区别：

- 雷电 3 为视频传输预留了 18 Gb/s 的带宽，不够时可以向数据传输的 22Gb/s 借，==反之则不行==。
- 雷电 4 动态带宽调节，不为视频传输专门预留，提升了其它外设连接的速率。

# Reference

1. [https://juejin.cn/post/7041516788437237796](https://juejin.cn/post/7041516788437237796)
2. [https://www.kensington.com/zh-cn/News-Index---Blogs--Press-Center/%E4%B8%AD%E5%9B%BD/sst-%E4%B8%8E-mst-%E6%A8%A1%E5%BC%8F%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/?srsltid=AfmBOoojCSUTvnaDAyLwRKzWDEmI-eKlXtrcK5p2It1ZuVJcjAUVxvbc](https://www.kensington.com/zh-cn/News-Index---Blogs--Press-Center/%E4%B8%AD%E5%9B%BD/sst-%E4%B8%8E-mst-%E6%A8%A1%E5%BC%8F%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/?srsltid=AfmBOoojCSUTvnaDAyLwRKzWDEmI-eKlXtrcK5p2It1ZuVJcjAUVxvbc)
3. [https://www.v2ex.com/t/897791](https://www.v2ex.com/t/897791)
4. [https://www.v2ex.com/t/840209](https://www.v2ex.com/t/840209)
5. [https://www.graniteriverlabs.com.cn/wp-content/cache/wp-rocket/www.graniteriverlabs.com.cn/technical-blog/application-notes-display-resolution-bandwidth/index.html_gzip](https://www.graniteriverlabs.com.cn/wp-content/cache/wp-rocket/www.graniteriverlabs.com.cn/technical-blog/application-notes-display-resolution-bandwidth/index.html_gzip)
6. [https://sspai.com/post/59194](https://sspai.com/post/59194)
7. [https://sspai.com/post/69701](https://sspai.com/post/69701)