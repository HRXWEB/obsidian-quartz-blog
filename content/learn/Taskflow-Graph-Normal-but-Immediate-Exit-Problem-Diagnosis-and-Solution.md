---
title: Taskflow图形正常但立即退出问题诊断与解决方案
draft: false
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-12T16:52:46.4646+08:00
---

具体碰到的情况是，graph如图

[![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251012162800303.png)

但是跑起来之后最关键的两行输出

```bash
I1021 18:33:55.932330 290986 stereo_flow.cpp:178] Start to run the main flow
I1021 18:33:55.953248 290986 main.cpp:70] Stereo Flow processing completed successfully.
```

开始跑之后立马就说**成功退出**了，中间没有任何的log信息，这不是正常现象。

> [!important] 排查发现是在task之间流动的或者taskflow最终的task的输出的cv::Mat 是empty的，没有报segmentfault是比较奇怪的。
