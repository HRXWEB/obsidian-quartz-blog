---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-11T15:45:54.5454+08:00
---

**CUDA 分为 Driver API 和 Runtime API 两个层面**，**在宿主机上只安装 Driver，而在 NGC Docker 容器中使用 CUDA Runtime——是目前业界主流且被官方推荐的最佳实践**。

---

- **CUDA Driver (驱动)**：这可以看作是连接操作系统内核和物理 GPU 硬件的“桥梁”和“指令集”。它由 NVIDIA 提供，并随着显卡驱动程序一同安装。它的核心任务是：
    - 管理 GPU 硬件资源。
    - 提供底层的、与硬件直接交互的接口（Driver API）。
    - 确保操作系统能够识别并与 NVIDIA GPU 正确通信。
    - **关键点**：Driver 是向后兼容的。这意味着，一个较新版本的 Driver 可以支持所有在此版本之前发布的 CUDA Toolkit (Runtime) 版本。例如，安装了最新版的 Driver，理论上可以在容器中运行基于旧版 CUDA Toolkit 11.x, 12.x 等构建的应用程序。
    - `nvidia-smi` 命令会显示 driver 版本及其支持最大版本。（下图驱动版本为 440.95.01，最大支持 10.2 版本的 CUDA Runtime Version）

        ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151411987.png)

- **CUDA Runtime (运行时)**：这可以看作是面向开发者的“工具箱”和“应用程序接口 (API)”。它包含了一系列的库（如 `libcudart.so`）、编译器（`nvcc`）、调试工具（`cuda-gdb`）以及标准的数学库（cuBLAS, cuFFT 等）。开发者在编写 CUDA 程序时，通常是调用这些 Runtime API。
    - **关键点**：Runtime 是与您的应用程序一起打包和分发的。在 Docker 的场景下，CUDA Runtime 和您的代码、依赖库（如 PyTorch, TensorFlow）一起被打包在 Docker 镜像中。NGC (NVIDIA GPU Cloud) 提供的容器正是预装了特定版本的 CUDA Runtime 和相关软件栈。
    - `nvcc -V` 命令会显示目前安装的 CUDA Runtime Version

---