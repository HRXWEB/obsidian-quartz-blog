---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 2:26:40 pm
---

1. nvcc 是用于编译 cuda 代码的工具链，它和 gcc 等工具链一起工作，用于编译 CUDA C/C++ 代码。
2. nvidia.ko 是内核驱动模块
3. CPU-GPU 软件架构

    ![](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926183953500.svg)

4. Nvidia CUDA Profiling Tools Interface——CUPTI 是性能分析接口，一个应用的实例是 Nsight
5. CUDA 二进制文件可以用 readelf 等工具处理，也可以用 CUDA Binary Utilities 提供的工具处理/分析。
6. linnvml.so 是 Nvidia Management Library，可以查询显卡的运行状态，典型的 wrappers: `nvidia-smi` , `pynvml` in python, `nvml_warpper` in Rust.
7. 线程层级结构（由上到下）： Grid → CTA(cooperative thread array) → SM → Block → Thread

# 参考

1. [https://modal.com/gpu-glossary/](https://modal.com/gpu-glossary/)