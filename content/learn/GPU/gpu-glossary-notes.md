---
title: gpu术语笔记
draft:
aliases: []
tags: []
created: 2025-10-22T11:20:13.1313+08:00
updated: 2025-10-27T15:59:12.1212+08:00
---

# 原文

[GPU Glossary](https://modal.com/gpu-glossary)

# Device Hardware

## CUDA (Compute Unified Device Architecture)

- Compute: 强调统一计算，而不是传统的图形渲染，类似于 GPGPU 的概念
- Unified: 统一的编程模型和软件环境，可以使用相对标准的 C/C++ 来编写代码
- Device: 主要指代 GPU。GPU 编程模型将 CPU 称为 Host
- Architecture：不仅是一个软件库（定义API），而是一个**软硬件**集成的架构
	- 硬件：定义了 GPU 大规模并行结构：SM、core、内存层次结构
	- 软件：编程模(Grid、Block、Thread)、编译器(NVCC)、加速库(cuBLAS、cuDNN)

Geforce 8800 和 Tesla 架构之前的 GPU 采用管线着色器架构，将软件着色器阶段映射到异构的专用硬件单元上。软件工程师要学会将程序映射到固定的管线上，硬件工程师需要猜测管线哥阶段的负载比例。

![terminal-fixed-pipeline-g71.svg](https://modal-cdn.com/gpu-glossary/terminal-fixed-pipeline-g71.svg)

现代的GPU采用统一的架构，所有硬件单元同质化并行计算。计算单元就是 SMs (Streaming Multiprocessors)，其中主要部件是 CUDA core 和更现代的 Tensor Core

![terminal-cuda-g80.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-g80.svg)

## Streaming Multiprocessor(SM)

![terminal-gh100-sm.svg](https://modal-cdn.com/gpu-glossary/terminal-gh100-sm.svg)

<center> H100 SM 架构</center>

- 一个 H100：
	- 132 个 SM
	- 一个 SM 可以管理 64 Warp，但是每个时钟周期只能有 $132(SM) * 4(Warp\ Schedulker/SM) * 32(thread/Warp) = 16896\ threads$ 工作，受限于 Warp Scheduler 数量
- 一个 SM：
	- 计算：
		- 128 个 FP32 CUDA Core
		- 64 个 INT32 CUDA Core
		- 4 个 Tensor Core
		- *4 个 SFU*
		- *4 个 Tex*
	- 存储
		- L0 Instruction Cache
		- L1 Instruction Cache
		- L1 Data Cache/Shared Memory: 256KB
		- 32 个 LD/ST
	- 存储+计算：1 个 Tensor Memory Accelerator
	- 调度：
		- 4 个 Warp Scheduler：负责从 **Warp** 池中选择一个**准备就绪**（即数据和操作数已到位）的 Warp（一个warp 32线程） 来执行。
		- 4 个 Dispatch Unit：负责将 Warp Scheduler 选择的指令和操作数，**分派**到SM内部具体的执行单元（路由功能）
- L2 Cache: 50MB
- VRAM: 80GB@HBM3

扩展阅读：[In The Loop \| 疯狂的 H100：现代 GPU 体系结构浅析，从算力焦虑开始聊起](https://loop.houmin.site/context/gpu-arch/#tldr)

SMs 类似于 CPU 核，既执行计算，又在寄存器存储可用于计算的状态，并带有 Cache。但是 SMs 在指令内部进行流水线（如取指、译码、执行、写回）处理时，不会使用分支预测技术。

Warp 之间切换速度是**单时钟周期**，比CPU快1000倍，这有助于它隐藏由内存读取、线程同步或其他昂贵指令引起的延迟，确保 CUDA Core 和 Tensor Core 提供的算力被充分利用。

## Core

包括 CUDA Core 和 Tensor Core

GPU Core 不是一个能独立、复杂地执行任务的**通用执行单元**（如 CPU Core），而是一个高度专业化、只负责高效执行**特定指令**的**数据处理单元**，追求高吞吐量。

而SM 是一个**独立且完整的处理单元**，它拥有**内存（寄存器）**、**执行单元（核心）**和**控制单元（调度器）**。这三者的结合使其具备了**管理和控制一组线程执行**的能力，这与 CPU Core 独立地管理和控制单个线程或多个线程的执行模式更为相似。

## Special Function Unit (SFU)

专门执行超越函数，如：$exp$ $sin$ $cos$

## Load/Store Unit

LD/ST 单元是 SM 中的**数据搬运工**。它将代码中表达的内存访问操作（如读取一个数组元素、写入一个结果）转换成实际的硬件指令，并处理复杂的**内存地址计算**和**访问合并**，以高效地在计算单元和内存之间移动数据。

## Warp Scheduler

- 一个 SM 可以管理 64 个 warp 构成的 warp 池，每次只有 4 个 warp 在工作。
- 能以极低的切换开销、快速地切换就绪的 warp 执行任务
	- 极低的切换开销：
		- 因为所有活跃 warp 的状态**一直**保持在 SM 的片上硬件（register file）中，不需要保存和恢复寄存器状态（上下文切换）。
		- L1 cache 是所有 warp 共享的可由程序员管理的缓存，可以设计多个 warp 共享数据放入到 L1 cache 共享内存，所以上下文切换对缓存命中率的影响要小得多
	- 快速地切换：单时钟周期，1ns。CPU需要上百乃至上千时钟周期，1ms。

追求的是 SM 的 100% 饱和度（高吞吐量），使得计算效率最大化。

Warp Scheduler 负责管理 warp 的执行状态。

## CUDA Core

- CPU core：每个指令独立调度
- CUDA core：一组 cores 接收 [[#Warp Scheduler]] 发出的相同指令，只是这个应用于不同的寄存器。组的大小就是一个 warp 的大小，即 32。

## Tensor Core

Tensor Core 的每条指令都在整个矩阵上运行，其提供的浮点运算每秒比 [[#CUDA Core]] 高出 100 倍。

Streaming Assembler(SASS) 指令 **HMMA16.16816.F32** 计算 $D = AB + C$:

- MMA: Matrix Multiply and Accumulate，矩阵乘加
- HMMA16: half-precision，即 16bits **输入**的矩阵乘加
- FP32：输出是 fp32
- 16816: 矩阵的维度是 16、8、16. 其中两个 16 是 outer dimension，8 是 inner dimension. $A_{16\times8}$, $B_{8\times16}$
- AB：A 和 B 矩阵乘需要进行 $16 \times 8 \times 16 = 2048$ 次 MAC 操作。即使每个 warp 的 32 线程同时工作，每个线程也要执行 64 MACs

因此设计了 Tensor Core 来专门计算矩阵乘，类似 TPU@google。

程序员负责写 PTX 级别的指令（当然一般也不写，除了 DeepSeek），如 `wwa` 表达一个大矩阵乘法操作，如 $64\times64$。编译过程会将其分解成多个 SASS Tensor Core 指令，每个 SASS 负责其中一个小的矩阵块，如 $16\times16$ 的计算，这些小矩阵是硬件 Tensor Core 能在一个周期内处理的基本单元

PTX 指令集中的指令在 CUDA C++ 编程中是以 Compiler Intrinsic Functions 的形式存在

由上，得到一个简单的 GPU 编程层次结构：CUDA/C++ -> PTX -> SASS，举例 $16 \times 16$ 的矩阵乘加：

- CUDA/C++
	```cpp
	wmma::mma_sync(c, a, b, c);
	```
- PTX
	```ptx
	wmma.mma.sync.aligned.col.row.m16n16k16.f32.f32 {%f2, %f3, %f4, %f5, %f6, %f7, %f8, %f9}, {%r2, %r3, %r4, %r5, %r6, %r7, %r8, %r9}, {%r10, %r11, %r12, %r13, %r14, %r15, %r16, %r17}, {%f1, %f1, %f1, %f1, %f1, %f1, %f1, %f1};
	```
- SASS
```
	HMMA.1688.F32 R20, R12, R11, RZ   // 1
	HMMA.1688.F32 R24, R12, R17, RZ   // 2
	HMMA.1688.F32 R20, R14, R16, R20  // 3
	HMMA.1688.F32 R24, R14, R18, R24  // 4
```

每条 SASS 指令都对应一个**分块**矩阵乘加 $D = A @B + C$。以第三条指令为例：

- register 20 存储输出 D
- register 14 和 register 16 存储输入 A 和 B
- 复用 register 20 存储 C，利用原地修改 `C += A @ B`

分析指令可知将 $16 \times16$ 的矩阵乘，分块成了 4 个 $A_{16\times8} @ B_{8\times8}$ 的矩阵乘。分块示意图：

![terminal-tensor-core-mma.svg](https://modal-cdn.com/gpu-glossary/terminal-tensor-core-mma.svg)

## Tensor Memory Accelerator(TMA)

每个 SM 都有一个，用于加速读取 GPU RAM 的多维数组。它将数据从全局内存加载到 L1 Cache，避免直接加载到 registers/register file。优势：

- 将**地址计算**的工作从 CUDA 核心和寄存器文件中分离出来，实现了资源的卸载。在访问大规模 KB 级别且具有两个或更多维度的数组时效果更明显。
- **异步执行模型**：
	- CUDA 线程可以**触发**一次大规模的数据复制操作（Global Memory → Shared Memory），然后该线程可以立即**返回其 Warp** 去执行其他计算任务。
	- 数据移动（TMA 复制）在**后台独立运行**。当 TMA 完成复制后，该线程或同一 **Thread Block** 内的其他线程可以**异步地检测**到复制完成，然后开始操作 Shared Memory 中的新数据。
	- 这种异步执行模式允许数据 I/O 与计算**完全并行**。GPU 无需等待慢速的内存传输完成，大大提高了 SM 的效率和吞吐量。

TMA 本身并不加速使用 tensor memory 的操作，而是优化 Global Memory 和 Shared Memory 之间的数据传输，喂饱 Tensor Cores 大量的数据需求。

## Streaming Multiprocessor Architecture

> [!INFO] 作用
> 定义了和 SASS 代码的兼容性

- 不同的 major version 对应不同的 GPU 架构，如 6.x 是帕斯卡架构，8.x 是安培架构
- 不同的大版本之间不保证兼容性
- nvcc 可以接受 sm 参数（nvcc -arch=sm_80）生成对应版本的 SASS 代码

| **架构名称 (Architecture Name)** | **计算能力 (SM Version)**    | **代表 GPU**          | **备注**         |
| ---------------------------- | ------------------------ | ------------------- | -------------- |
| **Hopper**                   | **sm_90**                | H100, H200          | 最新一代 AI/HPC 架构 |
| **Ada Lovelace**             | **sm_89**                | RTX 40 系列           | 消费级最新架构        |
| **Ampere**                   | **sm_86, sm_87(Orin)**   | RTX 30 系列, A30, A40 | 主要用于数据中心和高端消费级 |
| **Ampere**                   | **sm_80**                | A100                | 首代 Ampere 架构   |
| **Volta**                    | **sm_70, sm_72(Xavier)** | V100                | 高性能计算领域的重要里程碑  |
| **Pascal**                   | **sm_61, sm_60**         | GTX 10 系列, P100     |                |
| **Maxwell**                  | **sm_50, sm_52**         | GTX 900 系列          |                |

## Texture Processing Cluster(TPC)

> [!quote] 
> 在 Blackwell 架构中首次被纳入 CUDA 编程模型

> [!NOTE] 定义
> 一个 TPC 是由**两个相邻的 SM (Streaming Multiprocessors)** 组成的硬件单元。

> [!example] 特点
> - 在 Blackwell 之前只是一个硬件组织概念，不映射到 CUDA 编程模型中的任何一层：
> 	- 内存层级结构：无法直接通过 TPC 来管理缓存和内存
> 	- 线程层次结构：基本单位是 Thread、Block(CTA)、Grid。TPC 不对应任何一个层级
> - 从 Blackwell 开始引入了对 TPC 的软件支持：
> 	- 第五代 Tensor Core 在 PTX 线程层次结构中引入了 "CTA pair（线程块对）" 新层级，对应的就是 TPC（相邻的两个 SM）
> 	- PTX 指令变化：引入了 `.cta_group` 字段。`.cta_group::1` `.cta_group::2` 指定 tensor core 执行矩阵乘 （MMA）是在 1 个 SM 内，还是跨 TPC 内的 2 个 SM。

## Graphics/GPU Processing Cluster(GPC)

- GPC = 一组 TPC + 1 个 raster engine
- sm90 以上引入新的线程层级： a "cluster" of thread blocks，它们会被调到到同一个 GPC 上。对应的内存层册结构： **distributed** shared memory

## Register File

简单理解就是寄存器，这是最快的存储结构。

**实现 Warp 切换的关键：** SM 的 register file 容量巨大，足以容纳所有活跃 Warp（如 H100 中的 2048 个线程）的状态。这使得 **Warp Scheduler** 可以在一个时钟周期内无成本地切换执行上下文，从而有效地**隐藏内存延迟**。

> [!NOTE] 单位
> - **调度单位**：Warp Scheduler 以 Warp(32 threads) 为单位进行指令调度
> - **资源分配单位**：SM 上的 register file 和 shared memory 等宝贵资源按照 Thread Block(线程块，CTA) 来分配的。一个线程块一旦被分配到 SM 上，它所需要的所有寄存器空间和共享内存空间会被锁定。

在高[[#Register Pressure|寄存器压力]]的情况下，即线程块（资源分配单元）消耗了过多的寄存器，会导致一个 SM 容纳的 CTA 变少，容纳的 Warp 数量表少，若远少于 SM 的最大 Warp 容量 64，则会导致 SM 吞吐量不够， latency hiding 失效。

## L1 Data Cache

- SM 的私有内存
- L1 缓存的速度只比 cores 小一个数量级
- L1 被 LD/ST 单元操作
- 不同于 cpu 的 cache 都是硬件管理的，L1 cache 可以通过软件 CUDA/C++ 管理
- H100 的 SM 中的 L1 cache 大小是 256 KB。一个 132 个 SMs，共 33 MB

## Tensor Memory

> [!NOTE] 定义
> 用于存储 Tensor Cores 的输入输出的特殊内存

不是通用的内存区域，访问方式被严格限制和和优化，以满足 Tensor Cores 计算时对数据量的需求。

> [!WARNING] TM 和 [[#Tensor Memory Accelerator(TMA)]] 的关系
> Tensor 和 Tensor Memory Accelerator 并不直接相关， TMA 操作的是 L1 data cache。

## GPU RAM

![terminal-hbm-schematic.svg](https://modal-cdn.com/gpu-glossary/terminal-hbm-schematic.svg)

<center>高性能数据中心 GPU 的 RAM 所在的 die 都在计算单元的旁边</center>

补充阅读：

-  ["What Every Programmer Should Know About Memory"](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)
-  [High-Bandwidth Memory (HBM)](https://en.wikipedia.org/wiki/High_Bandwidth_Memory)

# Device Software

## CUDA(Programming Model)

不同语境的含义：

- **设备架构**：Compute Unified **Device Architecture**
- **编程模型**：使用上一条架构设计的硬件，对应的**编程模型**
- **软件平台**：扩展高级语言，比如 C 用于添加编程模型

CUDA 编程模型三个关键的抽象：

- 线程组层级：blocks -> grids
- 内存层级：寄存器（每个线程独有）-> 共享内存（同一线程块 Block 的线程共享） -> 全局内存/L2 Cache/HBM（整个 Gird 中的所有线程可以访问）
- 屏障同步（Barrier Synchronization）：定义了线程之间的协调机制
	- 目的：如果一个线程的结果被另一个线程依赖，必须在访问数据前进行同步
	- 工作方式：当**一个**线程到达屏障时，会暂停执行，直到**同一个线程组**的所有其他线程到达屏障
	- 作用范围：同一线程块（Block）内的线程。
	- 作用：确保了线程块内的协作是安全的，避免了竞态条件

![terminal-cuda-programming-model.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-programming-model.svg)

<center>线程层次、内存层次和对应的硬件概念</center>

通过引入编程模型的关键抽象，将程序逻辑和底层的 GPU 硬件参数解耦，让程序可以随着 GPU 更新换代直接获得性能提升，核心原因是通过**限制通信来“暴露并行性”**：

- **限制**协作：
	- 块内线程通过共享内存和屏障同步进行紧密、快速的通信和协作
	- 块间线程没有直接的同步机制，只能通过全局内存进行间接通信，这很慢，不会想要这么做的！
- 暴露并行性：
	- 上述的块间的通信限制，**强制**程序员设计程序的时候，必须将任务分解成一个个**逻辑上独立**、可以按**任意顺序**执行的线程块
	- **暴露**：计算机架构的术语，意思是程序员将固有的**大规模并行性**明确地展现（“expose”）给了编译器和 （GPU） 硬件。硬件看到这些独立的块后就知道可以并行处理它们。
- 结果：
	- 升级拥有更多 SMs 的 GPU 后，硬件的调度器会看到更多可独立执行的线程块
	- 调度器会将更多的线程块分配到新增的 SMs 上同时执行

如下， 同样的线程块计算，在 SMs 数量翻倍后，执行时间变为一半：

![terminal-wave-scheduling.svg](https://modal-cdn.com/gpu-glossary/terminal-wave-scheduling.svg)

## Streaming Assembler (SASS)

SASS 是有版本的，并且与特定的 NVIDIA GPU [[#Streaming Multiprocessor Architecture]] 相关联

- `FFMA R0, R7, R0, 1.5 ;`
	- 融合浮点乘加操作，单个周期执行 $R0 = (R7 \times R0) + 1.5$
- `S2UR UR4, SR_CTAID.X ;` 数据移动指令，寻址。
	- `S2UR`： 将数据从 special register 复制到 uniform register
	- `SR_CTAID.X`：special register，保存着当前 CTA 在 grid 中的 x 轴索引值
	- `UR4`：uniform register，这种寄存器的数据对于一个 Warp 中的 32 个线程来说是相同的
	- 对寻址的理解：将 `CTAID.X` 复制到 **Uniform Register** 中，表明这个 ID 在整个 Warp 内部是共享的，可以高效地用于计算该 Warp 负责的 **全局内存地址**。

## Parallel Thread eXecution (PTX)

PTX 是 IR （中间表示），这意味它其实不是指令集架构（Instruction Set Architecture）。

CUDA 二进制文件中会有 SASS 代码和 PTX 代码，当 CUDA 驱动发现没有为当前硬件架构（如 Hopper） 预编译的 SASS 代码，但是有**兼容的（前向兼容）** PTX 代码，就会通过 JIT 即时编译技术将 PTX 代码翻译成针对当前设备特定的 SASS 代码。之后 SASS 代码会被加载到 GPU 的 SM 上执行。比如，即使你的程序是为旧的 `sm_70` 架构编译的，新的 `sm_90` GPU 也能在运行时通过 JIT 编译器将 `sm_70` 对应的 PTX 代码翻译成 `sm_90` 的原生 **SASS** 机器码。

![terminal-ptx-machine-model.svg](https://modal-cdn.com/gpu-glossary/terminal-ptx-machine-model.svg)

<center>PTX machine model</center>

上图：

- Processor 1……M 共享一个指令单元
- 每个 Processor 运行一个线程，并且这些线程**执行相同的指令**，所以称之为 Parallel Thread eXecution (PTX)
- 它们通过 shared memory 协作、通过私有的 register 产生不同的结果

> [!TIP] Tips
> 截止 2025 年 9 月，in-line PTX 仍然是利用一些 Hopper 特定硬件功能的唯一方法

## Compute Capability

> [!NOTE] 定义
> 用于将物理 GPU 的细节与指令集和编译器抽象分离的版本系统

保证前向兼容性（旧的 PTX 代码可以在新的 GPU 上运行）

## Thread

> [!NOTE] Note
> GPU 编程的最小单元

| 特性                  | CUDA 线程 (GPU)                          | POSIX 线程 (CPU)                                          |
| ------------------- | -------------------------------------- | ------------------------------------------------------- |
| **目标代码**            | PTX (虚拟汇编) 和 SASS (机器码) 都直接针对**线程**执行。 | C/C++ 等程序首先面向一个 **进程**，进程内部包含一个或多个线程。                   |
| **执行环境**            | 运行在 GPU 的 **SM** 上。                    | 运行在 CPU 上，是操作系统进程的一部分。                                  |
| **核心目的**            | **计算**。用于大规模并行计算，以最大化吞吐量。              | **并发**和**系统交互**。用于管理任务、利用多核 CPU、进行 I/O 操作和系统调用。         |
| **系统调用 (Syscalls)** | **不能**。CUDA 线程是受限的、轻量级的。               | **能**。POSIX 线程是操作系统进程的一部分，可以发起系统调用（如文件 I/O、网络通信、内存管理等）。 |

- 虽然像 CPU 线程一样，每个 GPU 线程有自己的 PC (Program Counter)，这意味着它们在**理论**上是独立的执行流。但是**为了性能**，程序通常使 1 个 Warp 内的 32 个线程共享同一个 PC，以锁步 (lock-step) 的方式执行指令
- GPU 线程和 CPU 线程一样，可以在 global memory 中有 stack，用于存储溢出的寄存器 (Spilled Registers) 和函数调用栈。但是**为了性能**，通常会限制对溢出寄存器和函数调用栈的使用，保证数据保存在 SRAM 上
- 如图，一个 CUDA Core 执行来自一个线程的指令，说明 CUDA Core 执行 CUDA 线程指令的**最小硬件执行单元**
	![terminal-cuda-programming-model.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-programming-model.svg)

## Warp

> [!NOTE] 定义
> 一个 Warp 是**一组**被一起**调度**和**并行执行**的**线程**

- 单个 Warp 中所有的线程被调度到单个 [[#Streaming Multiprocessor(SM)]] 上
- 单个 SM 通常执行多个 Warp，**至少**执行来自同一个 [[#Cooperative Thread Array (CTA)]]，即 thread block 中的所有 Warp
	- 如何理解**至少**：因为一个 CTA 中所有的线程需要使用 **Shared Memory（共享内存）** 和 **`__syncthreads()` 屏障同步** 进行紧密协作。这些资源和同步机制都**仅限于单个 SM 内部**。如果一个线程块被分割到多个 SM 上，这些协作和同步就会失效。所以一个 CTA 必须在一个 SM 内，如一个 CTA 的 Warp 过多，它需要的 register files 和 shared memory 就会超出单个 SM 的容量，那么这个 CTA 就无法启动
- 一个 Warp 内所有的 threads 会并行执行 same instruction，这被称为 Single-Instruction, Multiple Thread (SIMT)。如果一个 warp 中的线程分开执行不同的指令时，也被称为 [[#Warp Divergence]]，性能会急剧下降
- Warp size 理论上是由 GPU 硬件架构决定的，但是实践中一直是 32，历代的 GPU Warp Size 都是 32
- 一个 warp 执行指令时，通常不能在一个时钟周期内完成（从 global memory 中获取数据不能，一些算术指令也不能），因此需要 warp scheduler 的引入来调度其他就绪的 warp，实现 latency hiding。
- 由于缺少操作数而停滞的 warp 的状态称为 `stalled`
- Warp 不实际是 CUDA 编程模型线程层次结构的一部分。相反，它们是 NVIDIA GPU 上该模型实现的一个实现细节。在这方面，它们在某种程度上类似于 CPU 中的缓存行：这是硬件的一个特性，不会直接控制也不需要考虑程序正确性，但对于实现最大性能是重要的。

## Cooperative Thread Array (CTA)

- 一个 CTA 包含多个线程，被调度到同一个 SM 上。
- 它是 CUDA 编程模型 `thread block` 的具体 `PTX/SASS` 实现
- CTA 可以包含一个或多个 Warps
- 程序员可以指导 CTA 内的线程相互协调。可被程序管理的 L1 data cache，使得这种协调变得快速。不同 CTA 中的线程不能通过屏障相互协调，而是必须通过全局内存进行协调，例如通过原子更新指令。由于驱动程序在运行时对 CTA 的调度具有控制权，CTA 的执行顺序是不确定的，并且阻塞一个 CTA 可能会轻易导致死锁。
- 一个 SM 可调度的 CTA 的数量决定了吞吐量，一个 CTA 所需要的 SM 的资源（register file、warp slots、L1 data cache）是在编译期确定的：
	- **寄存器计算**：CTA 所需的总寄存器数量 =（每个线程所需的寄存器数）×（线程块中的线程数）。
	- **共享内存计算：** 程序员在代码中会显式声明线程块需要的**共享内存**（`__shared__` 变量）。这个需求也是在**编译时/链接时**确定的。
	- **如果一个 CTA 需要的资源超过了一个 SM 的总量，这个 kernel 将无法启动**

## Kernel

> [!NOTE] 定义
> 编写和组织 CUDA 代码的基本单元，类似于函数和过程 (procedure)

内核在启动（launch）一次并返回一次的过程中，会被多个线程并发或并行的执行。内核就像“蓝图”一样，告诉 GPU 启动多个线程，然后按照“蓝图”去工作：

- 传统 CPU 函数
	```cpp
	void process_array(int* data, int size) {
	    // 函数体内的代码只执行一次
	    for (int i = 0; i < size; i++) {
	        data[i] = data[i] * 2; // 这行代码在循环中执行 size 次
	    }
	}
	```
- CUDA kernel
	```cpp
	__global__ void process_array_kernel(int* data, int size) {
	    // Kernel 体内的代码将被每个线程执行一次
	    int i = threadIdx.x + blockIdx.x * blockDim.x; // 计算自己的唯一 ID
	
	    if (i < size) {
	        data[i] = data[i] * 2; // 这行代码只被当前线程执行一次
	    }
	}
	```

执行同一个内核的所有线程的集合被称为 kernel grid（thread block grid），它是 [[#CUDA(Programming Model)|CUDA 编程模型]]的最高线程层级。kernel grid 在不同的 SMs 间执行，因此在整个 GPU 范围内计算，对应的 [[#Memory Hierarchy]] 就是 global memory

在 CUDA C++ 中，当 host 调用时，kernel 会接受指向 global memory 的指针，并且**不返回任何内容（void）**，它们会原地修改内存。

### CUDA "Hello World"——矩阵乘

#### 简单版本

```cpp
__global__ void mm(float* A, float* B, float* C, int N) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;

    if (row < N && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < N; k++) {
            sum += A[row * N + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
    }
}
```

在这个核函数中，每个线程 $1$ **FLOP/read from global memory**：一个乘法和一个加法；从 `A` 加载和从 `B` 加载。以这种方式永远无法充分利用整个 GPU，因为 CUDA 核心的算力（以 FLOP/s 为单位）远高于 GPU RAM 和 SM 之间的内存带宽。

#### Tiled Matrix Multiplication with Shared Memory

```cpp
#define TILE_WIDTH 16

__global__ void mm(float* A, float* B, float* C, int N) {

    // declare variables in shared memory ("smem")
    __shared__ float As[TILE_WIDTH][TILE_WIDTH];
    __shared__ float Bs[TILE_WIDTH][TILE_WIDTH];

    int row = blockIdx.y * TILE_WIDTH + threadIdx.y;
    int col = blockIdx.x * TILE_WIDTH + threadIdx.x;

    float c_output = 0;
    for (int m = 0; m < N/TILE_WIDTH; ++m) {

        // each thread loads one element of A and one of B from global memory into smem
        As[threadIdx.y][threadIdx.x] = A[row * N + (m * TILE_WIDTH + threadIdx.x)];
        Bs[threadIdx.y][threadIdx.x] = B[(m * TILE_WIDTH + threadIdx.y) * N + col];

        // we wait until all threads in the 16x16 block are done loading into smem
        // so that it contains two 16x16 tiles
        __syncthreads();

        // then we loop over the inner dimension,
        // performing 16 multiplies and 16 adds per pair of loads from global memory
        for (int k = 0; k < TILE_WIDTH; ++k) {
            c_output += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        }
        // wait for all threads to finish computing
        // before any start loading the next tile into smem
        __syncthreads();
    }
    C[row * N + col] = c_output;
}
```

##### 数学公式

首先从数学公式上理解分块的可能性（线性代数：分块矩阵乘法）。一开始简单的矩阵乘：

$$
C(i, j) = \sum_{k=0}^{N-1} A(i, k) \times B(k, j)
$$

可以变成分块矩阵乘：

$$
C(i, j) = \sum_{m=0}^{\frac{N}{T}-1} \left( \sum_{k'=0}^{T-1} A(i, m \cdot T + k') \times B(m \cdot T + k', j) \right)
$$

上述代码对应的算法将 $N \times N$ 矩阵的求和分解为 $\frac{N}{T}$​ 个分块乘积的求和，其中 $T=TILE\_WIDTH=16$，外层循环 $m$ 迭代分块维度，内层循环 $k'$ 执行块内的乘加操作。

##### 线程与数据映射

- **线程块维度：** 线程块 (block) 大小固定为 $T \times T$ (即 $16 \times 16$ 线程)。
- **线程格维度：** 线程格 (Grid) 大小为$\frac{N}{T} \times \frac{N}{T}$​。
- **目标计算点：** 每个线程 $(t_x​,t_y​)$ 负责计算最终矩阵 $C$ 中的一个元素 $C(row,col)$。

| **变量**      | **公式**                                                        | **含义**               |
| ----------- | ------------------------------------------------------------- | -------------------- |
| **$C$ 行索引** | $\text{row} = \text{blockIdx.y} \cdot T + \text{threadIdx.y}$ | 当前线程负责计算的 $C$ 矩阵行索引。 |
| **$C$ 列索引** | $\text{col} = \text{blockIdx.x} \cdot T + \text{threadIdx.x}$ | 当前线程负责计算的 $C$ 矩阵列索引。 |

##### 算法执行流程

每个阶段 $m$ 的算法步骤：

| **步骤**         | **代码对应**                                                     | **线程行为**                                                                                                           | **目的**                                                          |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **1. 加载 $A$块** | `As[ty][tx] = A[row * N + (m*T + tx)]`                       | 线程 $(t_x, t_y)$ 将 $A$ 矩阵第 $\text{row}$ 行的第 $m$ 个 $T \times T$ 块（行分块）的一个元素加载到 $\mathbf{As}$ 共享内存中。                  | 提升 $A$ 数据的**重用率**。                                              |
| **2. 加载 $B$块** | `Bs[ty][tx] = B[(m*T + ty) * N + col]`                       | 线程 $(t_x, t_y)$ 将 $B$ 矩阵第 $\text{col}$ 列的第 $m$ 个 $T \times T$ 块（列分块）的一个元素加载到 $\mathbf{Bs}$ 共享内存中。                  | 提升 $B$ 数据的**重用率**。                                              |
| **3. 块内同步**    | `__syncthreads();`                                           | 确保**整个 $T \times T$ 线程块**都完成了共享内存加载操作。                                                                             | 保证所有线程在开始计算时都能访问到完整的 $A$ 块和 $B$ 块。这是**协作**的体现。                  |
| **4. 块内计算**    | `for (k=0; k<T; ++k) { c_output += As[ty][k] * Bs[k][tx]; }` | 线程 $C(\text{row}, \text{col})$ **在共享内存内** 执行 $T$ 次乘加操作，计算 $A$ 的当前分块与 $B$ 的当前分块的乘积，并累加到 $\mathbf{c\_output}$ 局部变量中。 | **隐藏延迟！** 利用快速的共享内存执行 $T$ 次计算，将 **1 次全局内存访问** 摊销到 **$T$ 次乘加**中。 |
| **5. 块间同步**    | `__syncthreads();`                                           | 确保所有线程都完成了当前分块的计算和累加。                                                                                              | 保证在进入下一个 $m$ 循环，**新的数据块覆盖共享内存之前**，当前的数据块已被所有线程利用完毕。             |

每次线程读取 2 个元素，执行 `c_output += As[threadIdx.y][k] * Bs[k][threadIdx.x];` 中的 $2\ TILE\_WIDTH$ 次 FLOP，所以提升到了 $TILE\_WIDHT = 16$ **FLOP/read from global memory**

##### 为什么 $\mathbf{As}$ $\mathbf{Bs}$ 要申请 shared memory

- 每个线程 $(t_x, t_y)$ 只负责加载两个元素 $\mathbf{As}[t_y][t_x]$ $\mathbf{Bs}[t_y][t_x]$ 
- $T^2$ 个线程共加载 $2T^2$ 个元素，它们之间**共享**这些元素。比如线程 $(t_x, t_y)$ 在执行 `c_output += As[ty][k] * Bs[k][tx];` $k \in [0, T)$ 时，就需要其他 $2T - 2$ 加载的 $\mathbf{As}$ 元素 和 $\mathbf{Bs}$ 元素。如果每个线程加载元素到自己私有的 register，那就无法访问到其他线程加载的元素
- 一个 $T \times T$ 内的元素加载到 shared memory 后，会被重复利用 T 次。

## Thread Block

![terminal-cuda-programming-model.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-programming-model.svg)

<center>线程层级和对应的计算单元层级</center>

thread block 是 [[#CUDA(Programming Model)]] 中线程协调的最小单位。block 必须独立执行，不能有任何的依赖关系，所以任何执行顺序都是有效的。

一个 kernel 会启动一个或多个 thread block，一个 block 会包含一个或多个 warp。块大小可以任意设置，但是一般会设置成 warp size = 32 的倍数

## Thread Block Grid

一个 kernel 启动后创建的线程集称为 thread grid，grid 可以是 1，2，3 维的，它们由 [[#Thread Block]] 组成，对应的内存层级是 global memory。

## Thread Hierarchy

| 层级            | 计算单元      | 对应内存           | 调度                                           |
| ------------- | --------- | -------------- | -------------------------------------------- |
| threads       | cores     | register files | warp scheduler                               |
| thread blocks | single SM | shared memory  | 其内的 thread 通过 shared memory + barrier **同步** |
| thread grids  | all SMs   | global memory  | 其内的 thread block 任意执行顺序                      |

## Memory Hierarchy

![terminal-cuda-programming-model.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-programming-model.svg)

thread block 对应的内存层级结构是 Shared Memory，即 L1 data cache。对其的严格管理，例如，在加载新数据之前最大化原数据的算术操作的数量，是设计高性能内核的关键。实例：[[#Tiled Matrix Multiplication with Shared Memory]]

## Registers

> [!NOTE] 定义
> 最低层级的内存层级，存储了单个 thread 的操作数

<font color =red>registers 的值通常存储在 Register File，但是也可能溢出到 global memory，造成明显的性能下降</font>

寄存器通常是被编译器 `ptxas` 管理的，编译器的目标通常都是限制每个线程的寄存器空间，以实现更多的 thread block 可以在单个 SM 内调度，提升占用率。

## Shared Memory

对应 L1 data cache

## Global Memory

global memory 可以被 thread grid 内所有的线程获取，因此它的生命周期和 program 一样长

这个 global 和 `__global__` 二者是不幸的发生了 conflict，并没有对应关系。`__global__` 只是为了标识在 host 端启动但是 device 端运行的函数（内核）

# Host Software

## CUDA (Software Platform)

> [!NOTE] 定义
> 一组用于开发 CUDA 程序的软件集

![terminal-cuda-toolkit.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-toolkit.svg)

<center>CUDA Toolkit</center>

## CUDA C++ (Programming language)

> [!NOTE] 定义
> 一种用于扩展 C++ 编程的、对 CUDA 编程模型的具体实现

在 C++ 外添加的核心特性：

- **Kernel `__global__` 来定义**：kernel 被实现为输入为 pointer，返回值为 void 的 C++ 函数，并用 `__global__` 来标识
- **Kernel 用 `<<<>>>` 启动**：在 cpu host 侧，通过 `<<<>>>` 设定 thread block grid 的维度来启动
- 使用 `__shared__` 关键字来分配 shared memory
- 通过 `__syncthreads()` intrinsic function 进行 barrier synchronization
- 内建变量 `blockDim` 和 `threadIdx` 分别用于索引 thread block 和 thread

nvcc 和 gcc 一起编译 CUDA C++ 程序

## NVIDIA GPU Drivers

![terminal-cuda-toolkit.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-toolkit.svg)

- Nvidia GPU Driver 管理 host programs 或者 host systems 和 GPU 之间的交互
- CUDA application 和 CUDA GPU driver 之间的接口依次为： CUDA Runtime API、CUDA Driver API

Nvidia 开源了 GPU 内核：[GitHub - NVIDIA/open-gpu-kernel-modules: NVIDIA Linux open GPU kernel module source](https://github.com/NVIDIA/open-gpu-kernel-modules)

## nvidia.ko

> [!NOTE] 定义
> Nvidia GPU Driver 在 Linux 中的核心二进制内核模块文件

像其他内核模块一样，它在特权模式下运行，代表用户和硬件（GPU）通信。

开源：[GitHub - NVIDIA/open-gpu-kernel-modules: NVIDIA Linux open GPU kernel module source](https://github.com/NVIDIA/open-gpu-kernel-modules)

## CUDA Driver API

> [!NOTE] 定义
> Driver API 是用户空间访问 GPU 硬件的接口。提供了类似于 C 语言标准库的功能，如 `cuMalloc`。充当了用户程序与底层 **NVIDIA 内核驱动** 之间沟通的桥梁。

![terminal-cuda-toolkit.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-toolkit.svg)

- 一般程序员都会直接写 CUDA Runtime API 而不是 CUDA Driver API
- CUDA Driver API `libcuda.so` 通常是被动态链接的（dynamic link）
- binary-compatible：如果一个程序在 older CUDA Driver API 编译的，它也可以跑在 newer CUDA Driver API 系统上。此时操作系统会加载 newer CUDA Driver API，执行过程也会是一样的。
- 关于如何分发 CUDA C++ Application，见： [CUDA C/C++ Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide)
- CUDA Driver API 是闭源的，文档：[CUDA Driver API :: CUDA Toolkit Documentation](https://docs.nvidia.com/cuda/cuda-driver-api/index.html)
- 开源替代方案：
	- [GitHub - mikex86/LibreCuda](https://github.com/mikex86/LibreCuda)
	- [the tiny corp · GitHub](https://github.com/tinygrad)

## libcuda.so

[[#CUDA Driver API]] 的具体实现

## NVIDIA Management Library (NVML)

> [!INFO] 作用
> 监视和管理 Nvidia GPU 的状态

指标和[详细解读](https://modal.com/docs/guide/gpu-metrics):

- GPU 利用率：至少执行一个 CUDA kernel 的时间百分比。意义：
	- 核心活动的繁忙程序，是计算密集型（compute bound）还是内存密集型（memory bound）
- GPU 功耗
- GPU 功耗利用率：当前设备功耗占其最大设计功耗（TDP，Thermal Design Power）的百分比。意义：
	- 应用程序有多充分利用 GPU 的计算能力
	- 性能瓶颈是否来在功耗墙（Power Wall）
- GPU 温度
- GPU 功耗限制和功耗限制状态
- GPU 内存使用量：GPU 分配的内存量，以 bytes 为单位

nvidia-smi 命令行工具就是对其功能的封装，其他语言的 warpper 有：

- python 的 pynvml
- Rust 的 nvml_wrapper

## libnvml.so

[[#NVIDIA Management Library (NVML)]] 的具体实现

## nvidia-smi

报告如下的信息：

- GPU “身份证号”：card's model name, UUID, PCI ID.
	- card's model name：型号，如 B200
	- UUID：全球唯一标识，不可变
	- PCI ID：pci bus ID，如 `0000:01:00.0` 表示 `Domain:Bus:Device/Function`
- 实时利用率 GPU-util, memory allocation
- 实时功耗和温度

## CUDA Runtime API

> [!NOTE] 定义
> 提供比 [[#CUDA Driver API]] 更高一级的 API

![terminal-cuda-toolkit.svg](https://modal-cdn.com/gpu-glossary/terminal-cuda-toolkit.svg)

用于动态链接的 shared object file 通常是 `libcudart.so`

闭源，文档：[CUDA Runtime API :: CUDA Toolkit Documentation](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html)

## libcudart.so

[[#CUDA Runtime API]] 的具体实现

- 静态链接：通常部署到不同的服务器上，自己开发的 CUDA 程序会采用静态链接的方式
	- 确保这个程序尽可能地独立
	- 通过牺牲文件大小换取最高的部署可能性
- 动态链接：像 PyTorch、TensorFlow 这样的深度学习框架，它们本身不是最终的应用，而是供数百万用户使用的**基础库**，就会采取动态链接的方式
	- 框架本身不必包含巨大的运行时库副本，减少体积
	- 如果用户安装了最新的 CUDA Toolkit，PyTorch 可以自动利用新的运行时库，享受到新版本带来的 bug 修复和性能提升，**而不需要用户重新安装或编译 PyTorch**。

## NVIDIA CUDA Compiler Driver

> [!NOTE] 定义
> 用于编译 CUDA C++ 程序的工具链，它会输出符合 host ABI 的二进制可执行文件，包含 **PTX** 和 **SASS** 的 "fat binary"
> 
> 补充：fat binary 是指一个可执行文件或库文件，它包含针对**多个不同指令集架构**或**多个不同硬件版本**的代码

- PTX：fat binary 包含的 PTX 版本通过 compute capability 管理，将 `compute_XYz` 值传给 `--gpu-architecture` or `--gpu-code` 来控制
- SASS：fat binary 包含的 SASS 版本通过 SM architecture version 管理，将 `sm_XYz` 值传给 --gpu-architecture or --gpu-code 来控制
- 将 `comput_XYz` 传给 `--gpu-code` 可以同时控制 PTX 和 SASS 的版本

## NVIDIA Runtime Compiler

> [!NOTE] 定义
> 用于 CUDA C 的**运行时**编译库 `nvrtc`。它无需在单一单独的进程中启动 `nvcc` 就能将 CUDA C++ 编译为 PTX

作为一个库，它运行程序**直接调用**其函数接口，将内存中的 CUDA 源代码字符串作为输出，并立即获得 PTX 代码字符串作为输出。

应用场景——动态代码生成：

- 许多高级库和框架（高性能计算库或深度学习框架）需要针对特定的输入数据、硬件或优化参数来**动态生成**高效的 CUDA C/C++ 代码
- 具体：假设一个框架需要执行矩阵乘法，但矩阵的尺寸在程序运行前是未知的。框架可以在运行时根据实际尺寸生成一个专门优化的 CUDA C++ 函数，然后使用 `nvrtc` 将这个新生成的函数编译成 PTX
随后：
- PTX 会使用 JIT-compiled 技术将 PTX IR 编译成 SASS assembly。这个过程是由 [[#NVIDIA GPU Drivers]] 完成的

闭源，文档：[1. Introduction — NVRTC 13.0 documentation](https://docs.nvidia.com/cuda/nvrtc/index.html)

## NVIDIA CUDA Profiling Tools Interface (CUPTI)

CUPTI 提供了一组用于在 GPU 上对 CUDA C++, PTX, SASS 代码进行执行分的 API。关键是，它在 CPU host 和 GPU device 之间的时间戳是同步的。

时间戳同步：CPU 和 GPU 分别由自己的时钟，CUPTI 提供一个机制来校准和映射二者的时间戳，创建一个统一的、协调的时间参考系。

[[#NVIDIA Nsight Systems]] 和 `PyTorch Profiler` 就是用了 CUPTI 提供的接口

文档：[CUPTI — Cupti 13.0 documentation](https://docs.nvidia.com/cupti/)

## NVIDIA Nsight Systems

> [!NOTE] 定义
> 用于 CUDA C++ 程序的 profiling、tracing、expert systems anslysis 的 GUI 性能调试工具

Expert Systems Analysis：一种 **自动化、基于规则的性能诊断功能**。它超越了简单的数据收集和可视化，能够根据预设的性能规则和瓶颈模式，**自动识别**代码中的效率问题并提出改进建议。

使用示例：[Intro to NVIDIA Nsight Systems \| CUDA Developer Tools - YouTube](https://www.youtube.com/watch?v=dUDGO66IadU)

文档：[Nsight Systems — nsight-systems](https://docs.nvidia.com/nsight-systems/index.html)

## CUDA Binary Utilities

> [!NOTE] 定义
> 一组用于检查 `nvcc` 输出的二进制文件内容的工具集

- cuobjdumo：可以操作和检查 host binaries，或者嵌入在里面的 `cubin` 文件
- nvidisasm：旨在操作 `cubin` 文件，它可以提取 SASS 并对其操作

文档：[1. Overview — cuda-binary-utilities 13.0 documentation](https://docs.nvidia.com/cuda/cuda-binary-utilities/index.html)

## cuBLAS

> [!NOTE] cuBLAS (CUDA Basic Linear Algebra Subroutines)
> 它是 Nvidia 对 BLAS 标准的高性能实现。它是一种专有软件库，为常见线程代数运算提供高度优化的内核

使用 `cuBLAS` 最常见的错误来源是矩阵数据布局。处于历史原因和为了与最初以 `Fortan` 编写的 BLAS 标准保持兼容性：

- cuBLAS 期望矩阵按列主序排列（column-major order），这与 C, C++, Python 中常用的行主序（row-major）相反
- BLAS 函数不仅需要知道操作的大小（例如 M, N, k），还要知道如何在内存中找到每列的起始位置，这通过 leading dimension 指定：
	- leading dimension (LD)：LD 是内存中**相邻两列起始元素之间的距离**（以元素个数计算）。它本质上是一个 **跨度（Stride）**
	- 如果你正在操作一个 $M \times N$ 的**完整矩阵**（$M$ 行，$N$ 列），且该矩阵是**列主序**存储的，那么 LD 就等于 **矩阵的行数 ($M$)**。
	- 如果你正在操作一个从更大的 **父矩阵** 中取出的**子矩阵**，LD 必须是**父矩阵的行数**。这也好理解，二者共用内存空间， 列 stride 是不变的

对于像 GEMM 这样的密集计算，不需要将 row-major 重新花大量的排列为 col-major：

- 数学基础：如果 $C = A @ B$，则 $C^T = B^T @ A^T$
- **内存布局**：row-major 的 $A$ 矩阵和 column-major 的 $A^T$ 矩阵在内存上是一模一样的
- 详细计算：
	- $A^T$ 的 leading dimension 是它的行数，即 $A$ 的列数
	- $B^T$ 同理
	- 计算得到 column-major 的 $C^T$，其可以被解释为 row-major 的 $C$
- 实例：
	```cpp
	#include <cublas_v2.h>
	
	// performs single-precision C = alpha * A @ B + beta * C
	// on row-major matrices using cublasSgemm
	void sgemm_row_major(cublasHandle_t handle, int M, int N, int K,
	                     const float *alpha,
	                     const float *A, const float *B,
	                     const float *beta,
	                     float *C) {
	
	  // A is M x K (row-major), cuBLAS sees it as A^T (K x M, column-major),
	  //   the leading dimension of A^T is K
	  // B is K x N (row-major), cuBLAS sees it as B^T (N x K, column-major),
	  //   the leading dimension of B^T is N
	  // C is M x N (row-major), cuBLAS sees it as C^T (N x M, column-major),
	  //   the leading dimension of C^T is N
	
	  // note the swapped A and B, and the swapped M and N
	  cublasSgemm(handle, CUBLAS_OP_N, CUBLAS_OP_N,
	              N, M, K,
	              alpha,
	              B, N,  // leading dimension of B^T
	              A, K,  // leading dimension of A^T
	              beta,
	              C, N); // leading dimension of C^T
	}
	```
	- `CUBLAS_OP_N` flag 指示内核使用提供的矩阵（在其视角内不需要额外的转置操作）

要使用 cuBLAS 库，需要在 `nvcc` 中传入 `-lcublas` 标志，函数声明在 `cublas_v2.h` 

文档：[1. Introduction — cuBLAS 13.0 documentation](https://docs.nvidia.com/cuda/cublas/)

## cuDNN

> [!NOTE] 定义
> 用于构建 GPU-accelerated 深度神经网络的原语库

提供了神经网络中常出现算子的高度优化内核：Conv、self-attention、FlashAttention、GEMM、various normalization、pooling 等。

PyTorch：

- 使用 cuBLAS 进行通用线性代数运算，例如 fully-connected
- 使用 cuDNN 进行更专门的原语计算：Conv、normalization、attention

现代的 cuDNN 提供 声明图式API (Declarative Graph API) 来定义计算：

- 从传统的、一次调用一个函数的命令式 API，转向使用**操作图（Operation Graphs）**来表达整个计算流程。
- 图形表示允许 cuDNN 在执行前看到整个操作序列。这使得库能够进行**全局优化**，例如合并多个操作、重排执行顺序、优化内存重用，从而获得比单个函数调用更高的整体性能。
- 程序员可以通过 **Python 和 C++ 前端 API** 来构建这个图。
- Python 和 C++ 前端 API 依赖于一个底层的、**闭源的** C 语言后端。这个 C 后端提供了一个 API 接口，专门用于兼容旧的用法或支持**直接的 C 语言外部函数接口**（direct C FFI）。
	- 兼容旧的接口：低层级的 C API 保持不变，以确保依赖旧版 cuDNN 或采用命令式编程风格的**现有代码**和**遗留框架**能够继续运行。
	- direct C FFI：
		- **FFI (Foreign Function Interface，外部函数接口)：** 这是一种机制，允许用一种编程语言（如 Python、Rust、Julia）编写的代码调用用另一种语言（通常是 C 或 C++）编译的函数。
		- C 语言是计算机科学中的通用“桥梁”语言。由于这个后端暴露了一个标准的 **C 接口**，任何支持 FFI 的高级语言都可以轻松地**直接调用 cuDNN 的底层功能**，而无需通过官方的 Python 或 C++ 封装。

对于任何给定的 operation，cuDNN 维护多个底层实现，并使用（未知的）internal heuristics 方式为目标 [[#Streaming Multiprocessor Architecture]]、data types 和 input sizes 选择性能最佳的实现

cuDNN 最初以在 Ampere SM 架构 GPU 上加速卷积神经网络而闻名。对于 Hopper 和尤其是 Blackwell SM 架构上的 Transformer 神经网络，NVIDIA 倾向于更加强调 `CUTLASS` 库。

文档：[NVIDIA cuDNN — NVIDIA cuDNN](https://docs.nvidia.com/deeplearning/cudnn/)

# Performance

这个章节包含了优化 GPU 程序性能时所绘遇到的关键术语，它们应该涵盖了使用  [NSight Compute](https://developer.nvidia.com/nsight-compute) 调试 GPU kernel 性能问题时遇到的每个术语

## Performance Bottleneck

![terminal-roofline-model.svg](https://modal-cdn.com/gpu-glossary/terminal-roofline-model.svg)

<center>Roofline</center>

[Jane Street](https://youtu.be/139UPjoq7Kw?t=1229) 将GPU 上运行的内核工作分解为三类：

- Compute：在 CUDA Cores 或 Tensor Cores 进行浮点运算
- Memory：在不同的内存层级上搬移数据
- 其他
因此 kernel 的性能瓶颈相应的分为三类：

- compute-bound kernel：受计算单元的算力限制，如大矩阵乘法
- memory-bound kernel：受内存带宽限制，如大型 vector-vector 乘法
- overhead-bound kernel：受延迟限制，如小数组的操作

Roofline 模型分析有助于快速确定程序的性能是受**算力（算术带宽）**还是**内存带宽**的限制

## Roofline Model

![terminal-roofline-model.svg](https://modal-cdn.com/gpu-glossary/terminal-roofline-model.svg)

NVIDIA 的 **Nsight Compute** 等工具已集成了屋顶模型分析

斜线和水平线的交点称为“屋脊”点，其 x 坐标是能够避免内存瓶颈所需的最小算术强度。

- **计算受限 (Compute-Bound):** 如果程序点位于水平计算屋顶的**下方**，其性能受限于硬件的**最大计算能力**。
- **内存受限 (Memory-Bound):** 如果程序点位于倾斜内存屋顶的**下方**，其性能受限于硬件的**内存带宽**。
- **注意：** 由于开销 (overhead) 的影响，实际程序点通常会位于屋顶之下。

屋顶模型诞生于对当时和未来硬件趋势的准确洞察：

1. **带宽滞后于延迟 (Latency lags Bandwidth):** 历史上，系统延迟的线性提升伴随着带宽的平方级提升，预示着未来系统将是**吞吐量导向**的（如 GPU）。
2. **内存墙 (Memory Wall):** 计算子系统（如 CPU 核心）的性能提升速度远远快于内存子系统（如 DRAM），导致**内存带宽**成为主要的性能瓶颈。
3. **登纳德缩放终结 (End of Dennard Scaling):** 晶体管数量（摩尔定律）仍在增加，但由于漏电流问题，无法持续提高时钟频率。这导致架构转向 **硬件专业化**（Hardware Specialization），用更专业的、并行的组件（如 Tensor Cores）来提升吞吐量。

- **旧哲学（延迟导向）：** 传统的 CPU 系统追求**低延迟**，以尽快完成单个任务（如单个用户操作、单个分支预测）。
- **新哲学（吞吐量导向）：** 由于带宽资源充裕但延迟问题难以解决，未来系统的目标应该是**一次处理尽可能多的任务，以充分利用高带宽**。系统不再关注单个任务的完成时间（延迟），而是关注**单位时间完成的总工作量（吞吐量）**

## Compute-bound

compute-bound 内核的特点是计算强度高，程序对每 load 或者 store 一个字节的内存数据，都会执行大量的算术操作。

- Large diffusion model 推理负载通常是 compute-bound
- LLM 在 batch prefill 的推理阶段也是 compute-bound。此时每个权重都可以加载到共享内存一次，然后在多个 token 推理时使用

简单的例子：

- 模型有 500B 参数，以 16-bit 的精准存储，共 1 TB。推出**单 batch** 大约执行 $10^{12}$ 次浮点运算
- 在具有 1 PFLOP/s ($10^{15}$ FLOP/s) 的算力的 GPU 上执行时，假设 compute-bound，则每个 token 输出间隔为 1 ms
- 注意：要成为 compute-bound，那就要在 1 ms 时间内将所有参数 1 TB 全部加载完，内存带宽是 1 PB/s。当代内存带宽通常是 TB/s 级别，因此每次要加载数百个 batch 才能提供足够的算术强度（权重只需要加载一次，但是计算量增加了几百倍，所以计算强度变大了几百倍）

扩展阅读：[LLM Engineer's Almanac - Executive Summary \| Modal](https://modal.com/llm-almanac/summary)

## Memory-bound

这里的内存带宽通常是指 GPU global memory 和 shared memory 之间的带宽，因为深度学习需要被计算的数据量通常是 GB/TB 级别，而 shared memory 只有 MB 级别，需要不断的从 VRAM 搬移数据。

LLM 在 decode 阶段权重在每次前向传播时必须加载一次，计算量相对小，是 memory-bound。解决方法有：multi-token prediction、speculative decoding 等。

简单的例子：

- 模型有 500B 参数，以 16-bit 的精准存储，共 1 TB。推出**单 batch** 大约执行 $10^{12}$ 次浮点运算
- 在具有 10TB/s 内存带宽的 GPU 上执行，则每次加载权重需要 100ms
- 所以帧间延迟（Time Per Output Token，TPOT）下限为 100ms
- 原则上可以增加计算强度而不会产生额外的延迟，意味着吞吐量可以随着批处理大小线性增长

扩展阅读：[LLM Engineer's Almanac - Executive Summary \| Modal](https://modal.com/llm-almanac/summary)

## Arithmetic Intensity

现代 GPU 的算力远超其内存带宽，因此大多数程序在单次运行时都是内存受限（memory-bound）的。为了解决内存受限的问题，要从节省内存带宽和增加计算负载两个角度考虑，即增大计算强度 (Arithmetic Intensity)

增大 Intensity 的例子：

- 在全局内存中压缩数据，传输带宽小。计算时要解压缩，增加计算量。
- 反向传播时因为要存储大量的激活值，它们一般都存储在全局内存，在后向传播时加载到 shared memory。可以通过只保存一部分，然后重计算其他部分的方式来减少传输的数据量并加大计算量。[[introduction-to-FlashAttention]] 就用了这个技术——recomputation

| **系统 (计算/内存)**                      | **Arithmetic Bandwidth, TFLOPs/s** | **Memory Bandwidth, TB/s** | **Rootfline Ridge Point, FLOPs/byte** |
| ----------------------------------- | ---------------------------------- | -------------------------- | ------------------------------------- |
| **A100 80GB SXM** (BF16 TC / HBM2e) | 312                                | 2.0                        | 156                                   |
| **H100 SXM** (BF16 TC / HBM3)       | 989                                | 3.35                       | 295                                   |
| **B200** (BF16 TC / HBM3e)          | 2250                               | 8                          | 281                                   |
| **H100 SXM** (FP8 TC / HBM3)        | 1979                               | 3.35                       | 592                                   |
| **B200** (FP8 TC / HBM3e)           | 4500                               | 8                          | 562                                   |
| **B200** (FP4 TC / HBM3e)           | 9000                               | 8                          | 1125                                  |

## Overhead

> [!NOTE] 定义
> GPU 没有进行任何有效工作的情况下所花费的时间

overhead 通常来自于 cpu 侧。比如 CUDA API call overhead 会在每次 kernel 启动时增加大约 10 微秒，PyTorch 等框架也需要花时间来决定启动哪个 kernel。

将多个 device-side kernels 汇集到一个 host-side launch 是一种解决办法。更多提升利用率的方法：[CUDA Techniques to Maximize Concurrency and System Utilization S72686 \| GTC 2025 \| NVIDIA On-Demand](https://www.nvidia.com/en-us/on-demand/session/gtc25-s72686/)

memory overhead 或者 communications overhead 是指数据从 CPU 传输到 GPU 或者一个 GPU 传输到另一个 GPU 的开销延迟

## Little's Law

阐述了完全隐藏延迟时，所需的并发量

$$
concurrency \ (ops) = latency \ (s) \times throughput \ (ops/s)
$$

例如，期望每个周期 throughout 为 1 条指令，内存访问延迟为 400 个周期，那么所有[[#Warp Execution State|活跃 warp]] 需要 400 个并发内存操作

## Memory Bandwith

> [!NOTE] 定义
> 数据在内存层级结构的不同级别之间传输的最大速率，它决定了 [[#Roofline Model]] 的斜率

因为大多数内核工作时的数据量级需要 GPU RAM，因此 GPU RAM 和 register files of SM 之间的带宽是 [[#Roofline Model]] 建模时使用的主要带宽

## Arithmetic Bandwidth

> [!NOTE] 定义
> 系统可以执行算术工作的峰值速率，它决定了 [[#Roofline Model]] 的最大高度

不同的硬件单元组提供不同的算术带宽（算力）：

- CUDA Cores：
	- 许多 GPU 上最重要的算力，通常为浮点运算提供比整数运算更多的带宽。
	- CUDA 架构实现了从**专用的图形硬件**向**通用的并行超级计算机**的转变，核心就是通过 **CUDA Cores** 和支持系统提供了一个 **统一、可编程的计算接口**。
- Tensor Cores：
	- PB FLOP/s 的级别
	- 引入它有点减弱 CUDA 架构的统一性
	- 它只执行矩阵乘法运算
	- 它和 CUDA Cores 的算力保持 100:1 是一个好的经验，如果一个 kernel 可以被重写以利用 Tensor Core，那么性能上限会更高

## Latency Hiding

> [!NOTE] 定义
> 通过**并发**大量长延时的操作，来达到隐藏延迟

高性能的 GPU 程序通过任意 interleaving 执行多个线程来隐藏延迟，这使得程序在指令延迟较长的情况下，也能保持高吞吐量。具体来说就是当一个 [[#Warp Execution State|warp 停止]]在慢速的内存操作时， GPU 就会立即切换到执行[[#Warp Execution State|符合条件的 warp]] 的指令

实例，考虑如下的指令序列：

```nasm
LDG.E.SYS R1, [R0]        // memory load, 400 cycles
IMUL R2, R1, 0xBEEF       // integer multiply, 6 cycles
IADD R4, R2, 0xAFFE       // integer add, 4 cycles
IMUL R6, R4, 0x1337       // integer multiply, 6 cycles
```

按顺序执行的情况下，需要 416 个周期才能完成。要想通过并发来隐藏延迟（假设每个周期可以发射一条指令），那么根据 [[#Little's Law]]，需要 416 个并发线程，此时可以在一个周期内完成上面的指令序列

416 个线程对应 $416 \div 32 = 13$ 个 warps，因此 warp scheduler 要保证 13 个 warps 都在 "inflight" 状态，随时切出 stalled warp，切入 eligible warp，才能实现 latency hiding

## Warp Execution State

> [!NOTE] 定义
> 用一组互不排斥（可同时存在）的形容词描述：active、stalled、eligible、selected

![terminal-cycles.svg](https://modal-cdn.com/gpu-glossary/terminal-cycles.svg)

- Active：一个 warp 的所有线程开始执行到推出的时间段，都是活跃的。
	- 每个 SM 的 active warp 容量上限因架构而异，H100 是 64 个
	- 注意：active warp 不一定在执行指令
- Eligible：调度器**下一个**时钟周期可以选择它执行指令
	- 具体条件：
		- 下一条指令已被获取
		- 所需的执行单元可用
		- 所有指令依赖关系已经解决
		- 没有同步屏障阻止执行
	- 上图除第 $n + 2$ 周期外，其余周期均符合 eligible。如果连续多个周期都没有 eligible warp，会严重影响性能，特别是使用像 CUDA Core 这样的低延迟计算单元时
- Stalled：一个无法发出下一个指令的 **active** warp
	- 原因：
		- 执行依赖，它必须等待前面算术指令的结果
		- 内存依赖，必须等待来自先前内存操作的结果
		- 管线冲突，所需执行资源目前被占用
	- short scoreboard：warp 在访问共享内存或运行时间较长的算术指令时被阻塞
	- long scoreboard：warp 在访问 global memory 时被阻塞
	- scoreboard 是 warp scheduler 中的硬件单元，是一种用于动态指定调度中的依赖跟踪技术
	- 注意：大量 stalled 并不意味着效率低下，它只反映了当前 warp 在等待某个操作完成。只要此时有足够的 eligible warp 供 warp scheduler 使用，GPU 的计算单元就能保持忙碌
- Selected：被 warp scheduler 选中的、在当前周期接受指令的 **eligible** warp
	- 每个周期被选中的 warp 和发出指令的比例是指令效率。

## Active Cycle

> [!NOTE] 定义
> 指在其中至少有一个 active warp 驻留的时钟周期。该 warp 可能是 eligible or stalled

## Occupancy

> [!NOTE] 定义
> active warps 的数量占**最大 active warps 数量**的比例

H100 单个 SM 的 max active warps = 64

- 理论占用率：由内核启动配置和设备能力所限制的占用率上限
- 实际占用率：内核执行期间的实际占用率，等同于 [[#Active Cycle]]

因为 [[#Thread Block]] 内的线程必须被调度到同一个 SM 上，因为单个 SM 的资源是有限的，所以可以调度的 [[#Thread Block]] 数量也是有限的

实例：

- 硬件：H100
	- 64 Maximum warps / SM
	- 32 Maximum blocks / SM
	- 65536@32bit Registers
	- 228 KB shared memory
- 内核（kernel）：
	- 一个 thread block 使用 32 个 thread
	- 一个 thread 使用 8 个 registers
	- 一个 thread block 使用 12 KB 的 shared memory
- 结论：
	- 从 warps 数量考虑：一个 block 32 线程，需要一个 warp，硬件上限为 64
	- 从 blocks 数量考虑：硬件上限为 32
	- 从 register files 数量考虑：可以分配给 $65536/32/8=256$ 个 blocks，硬件上限为 32
	- 从 shared memory 数量考虑：可以分配给 $228/12=19$ block
	- **所以一个 SM 最多跑 19 个 thread block**
- 它代表了一种常见的情况：存储在寄存器中的程序中间结果大小**远小于**需要保留在共享内存中的程序数据集的元素总大小。

occupancy 是一个**间接指标**，而不是最终的优化目标。过高或过低都会损害性能，最终的目标应该是最大化计算或内存资源占用率：

- 过低时无法隐藏延迟，导致指令发射效率降低，算术管线闲置
- 过高时每个 warp 所能分配到的 SM 资源减少。比如分配到的 register 数量变少，数据会溢出到 shared memory 甚至 global memory，导致寄存器瓶颈

## Pipe Utilization

> [!INFO] 作用
> 衡量 kernel 在每个 SM 中有效使用执行资源的效率

在测试这个程序性能之前，应该首先考虑 [GPU kernel utilization](https://modal.com/blog/gpu-utilization-guide) 和 [[#Streaming Multiprocessor Utilization]]

每个 SM 包含多个**独立的**执行管道（pipe），针对不同的指令类型进行了优化：

- 浮点运算的 CUDA Cores
- 张量计算的 Tensor Cores
- 内存访问的 LD/ST 单元
- 分支的 control flow 单元

管道利用率可在 [NSight Compute](https://developer.nvidia.com/nsight-compute)（ `ncu` ）的 `sm__inst_executed_pipe_*.avg.pct_of_peak_sustained_active` 指标中找到，其中星号代表特定管道，如 `fma` 、 `tensor` 、 `lsu` 或 `adu` （地址）。

## Peak Rate

例如，一款拥有 132 个 SM，每个 SM 包含 128 个 FP32 核心的 NVIDIA H100 GPU，可以执行 1 个单精度融合乘加（ `FMA` ）操作，每个核心包含 2 个浮点运算。这意味着每个时钟周期执行 33,792 条指令。当使用 FP32 核心时，H100 可以将其计算子系统时钟运行在最大速率 1980 MHz（每秒百万个时钟周期），因此峰值速率为 $66,908 \times 10^6$ 次 FLOPS，即 66.9 TFLOPS。

## Issue Efficiency

> [!INFO] 作用
> 衡量了 [[#Warp Scheduler]] 通过从 [[#Warp Execution State|eligible warp]] 中发出指令来有效地保持执行管道忙碌的能力

- 100% 意味着每个 scheduler 在**每个周期**都发布了一条指令，表明每个周期至少有一个符合条件的 warp。
- 低于 100%的数值表明，在某些周期内，所有 [[#Warp Execution State|active warp]] 都被阻塞了 - 在等待数据、资源或依赖关系 - 因此调度器处于空闲状态，整体指令吞吐量下降。

## Streaming Multiprocessor Utilization

> [!INFO] 作用
> 衡量了 SMs 执行指令的时间百分比

利用率精度，从精到粗：Pipe Utilization -> SM Utilization -> GPU Utilization -> Kernel Utilization

- Pipe：衡量 **CUDA Core/Tensor Core** 等单个硬件单元在每个时钟周期内的繁忙程度。这是最底层的利用率。
- SM：衡量一个 **SM** 上的 **Warp 调度器** 成功发射指令的效率，或者 SM 上的 CUDA Cores/Tensor Cores 的平均繁忙程度。
- GPU：使用 `nvidia-smi` 时看到的最常见的指标，通常是 **所有 SM 利用率的平均值**。
- Kernel：这个指标通常不是一个原始的“利用率百分比”，而是一个**分析结果**。它衡量的是一个特定的 **CUDA Kernel** 在运行期间，**相对于其理论峰值**的效率（例如，FLOPS/s）。它涵盖了从 SM 到内存的所有瓶颈分析。

## Warp Divergence

> [!NOTE] 定义
> warp 中的线程由于控制流语句而采用不同的执行路径
> 

例如：

```cpp
__global__ void divergent_kernel(float* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        if (data[idx] > 0.5f) {
		    // A
            data[idx] = data[idx] * 4.0f;
        } else {
		    // B
            data[idx] = data[idx] + 2.0f;
        }
        data[idx] = data[idx] * data[idx];
    }
}
```

而由于 [[#Parallel Thread eXecution (PTX)|PTX machine model]] 的约束，warp 必须以 SMIT 模式运行，即同一时间 warp 内所有线程必须执行同一条指令，因此使用了线程 “mask” 的机制来处理这个 divergence 问题，实现方式：

- **Predicate Registers（谓词寄存器）：** 每个线程都有一个或多个谓词寄存器（例如下面 `SASS` 中的 `P0`）。这些寄存器的值为布尔值（真或假），用于控制指令的执行。
- **执行流程：** 调度器首先执行分支 A，并将所有不需要执行分支 A 的线程的谓词寄存器设置为假，从而**掩码**掉这些线程。接着，它执行分支 B，并激活需要执行分支 B 的线程。

```nasm
LDG.E.SYS R4, [R2]                       // L1 load data[idx]
FSETP.GT.AND P0, PT, R4.reuse, 0.5, PT   // L2 set P0 to data[idx] > 0.5
FADD R0, R4, 2                           // L3 store 2 + data[idx] in R0
@P0 FMUL R0, R4, 4                       // L4 in some threads, store 4 * data[idx] in R0
FMUL R5, R0, R0                          // L5 store R0 * R0 in R5
STG.E.SYS [R2], R5                       // L6 store R5 in data[idx]
```

分析：

| **行号** | **SASS 指令**                              | **对应操作**                    | **解释**                                                                                                                |
| ------ | ---------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| L1     | `LDG.E.SYS R4, [R2]`                     | **加载数据**                    | 从全局内存加载 `data[idx]` 的值到寄存器 `R4`。                                                                                      |
| L2     | `FSETP.GT.AND P0, PT, R4.reuse, 0.5, PT` | **设置谓词**                    | 执行浮点设置指令：比较 `R4` (即 `data[idx]`) 是否大于 `0.5`。将结果（真/假）存储到 **谓词寄存器 P0** 中。`PT` 是恒为真的特殊谓词。                                |
| L3     | `FADD R0, R4, 2`                         | **执行 Block B** (隐式 `else`块) | 计算 `R4 + 2` 并存储到 `R0`。**所有线程**（没有谓词限制）都执行这一步。                                                                         |
| L4     | `@P0 FMUL R0, R4, 4`                     | **执行 Block A** (`if` 块)     | **关键：** `@P0` 表示只有那些 **谓词 P0 为真**（即 `data[idx] > 0.5`）的线程才执行这条指令，计算 `R4 * 4` 并**覆盖** `R0`。P0 为假的线程被**掩码**，保持 `R0` 不变。 |
| L5     | `FMUL R5, R0, R0`                        | **合并/后续操作**                 | 计算 `R0 * R0`。此时，`R0` 中已经包含了正确分支的结果。所有线程都执行这一步。                                                                        |
| L6     | `STG.E.SYS [R2], R5`                     | **存储结果**                    | 将最终结果 `R5` 存回全局内存。                                                                                                    |

注：精髓的部分是——所有线程都会执行一次，部分线程会执行第二次且**覆盖**

> [!NOTE] Insight
> 通过谓词寄存器来避免昂贵的分支控制，尽管多算了一部分的 block B。这也是 GPU 的使用哲学——浪费计算资源比增加复杂度要更好

## Branch Efficiency

> [!NOTE] 作用
> 衡量了当遇到条件语句时，一个 warp 中的所有线程有多**频繁**采用相同的执行路径

$$
\text{Branch Efficiency}=  \frac{\text{统一控制流决策次数​}}{\text{执行的总分支指令次数}}
$$

- **统一控制流决策 (Uniform Control Flow Decisions):** 指一个 Warp 中的 **所有线程** 都执行相同的分支路径（即，它们都进入 `if` 块或都进入 `else` 块）。这表明 **没有发生分歧**。
- **总分支指令次数 (Total Branch Instructions Executed):** 指 Warp 中所有线程执行的条件语句（如 `if` 语句）的总次数。

并不是所有的条件语句都会降低分支效率，比如常见的边界检查：

```cpp
int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n)
```

对于绝大多数 Warp 而言，要么是 **全部进入 `if` 块**，要么是 **全部跳过 `if` 块**。因此，对于这些 Warp，**分支效率是 100%**。只有那些**恰好跨越 `n` 边界**的 Warp 才会发生分歧。

## Memory Coalescing

> [!NOTE] 定义
> 一种用于提高 GPU global memory bandwidth 的**硬件技术**。

核心机制：

- 目标：将 Warp 内多个独立的 **逻辑内存读取** 合并成一次 **物理内存访问**
- 硬件基础： GPU RAM（如 GDDR 或 HBM）虽然延迟高，但支持 **DRAM Burst**（DRAM 突发）。每次物理访问一个地址时，硬件会并行地获取多个连续地址的数据
- **合并的定义：** 如果 Warp 中多个线程对内存的并发逻辑访问，可以被一个或少数几个物理 DRAM burst（通常是 128 字节）满足，则称这些访问是**合并的（Coalesced）**

考虑一个可变访问步幅（stride）的 kernel，看看内存合并对其性能的影响：

```cpp
__global__ void strided_read_kernel(const float* __restrict__ in,
                                    float* __restrict__ out,
                                    size_t N, int stride)
{
    const size_t t  = blockIdx.x * blockDim.x + threadIdx.x;
    const size_t T  = gridDim.x * (size_t)blockDim.x;

    float acc = 0.f;

    for (size_t j = (size_t)t * (size_t)stride; j < N; j += (size_t)T * (size_t)stride) {
        // across a warp, addresses differ by (stride * sizeof(float))
        float v = in[j]; // perfectly coalesced for stride == 1
        acc = acc * 1.000000119f + v;  // force compiler to keep the load
    }

    // do one write per thread (negligible vs reads)
    if (t < N) out[t] = acc;
}
```

在 [Godbolt](https://godbolt.org/z/KbWhEWjcb)运行 micro-benchmark，得到步幅和吞吐量之间的预期关系（Device Tesla T4; N = 67108864 floats, 256MB; iters = 10）：

| **步幅 (Stride)** | **吞吐量 (GB/s)** |
| --------------- | -------------- |
| 1               | 206.0          |
| 2               | 130.5          |
| 4               | 68.8           |
| 8               | 33.8           |
| 16              | 16.8           |
| 32              | 15.2           |
| 64              | 13.6           |
| 128             | 11.2           |

可以看到一开始步幅增大一倍，吞吐量就下降一倍，因为为了服务每个 warp 的请求所需的 DRAM burst 次数加倍。从 16 倍开始有点变化，但不清楚具体原因

## Bank Conflict

> [!NOTE] 定义
> 一个 warp 中的**多个线程同时**请求共享内存中**同一 bank 内的内存**、**但跨越不同地址**（across distinct addresses）时，称之为 bank conflict

- Bank：Shared Memory 为了实现高带宽，内部被分割成多个独立的、可以**同时**进行读写操作的物理单元，这些单元就称为 **Bank**。
- Conflict：一个 Warp 中的**多个线程**在**同一时刻**发起内存请求，这些线程请求的内存地址恰好都映射到了 Shared Memory 中的**同一个 Bank**。而一个 Bank 在一个时钟周期内只能处理一个请求，所以当多个线程同时请求同一个 Bank 时，硬件无法同时满足这些请求。这些请求会被**串行化**（逐个处理），这导致 Warp 必须等待，从而极大地降低了内存访问速度和程序性能。
- Across distinct addresses：
	- 如果多个线程访问的是**同一个 Bank**，且访问的**地址是相同的**，那么就不会发生 Bank Conflict，反而会发生最高效的内存访问——**广播（Broadcast）** 或 **多播（Multicast）**。
	- 只有多个线程同时访问同一个 Bank 的不同地址时，才会发生 Bank Conflict 导致需要串行化访问

![terminal-bank-conflict.svg](https://modal-cdn.com/gpu-glossary/terminal-bank-conflict.svg)

<center>当线程访问不同的共享内存 bank 时，访问是并行服务的（左）。当它们都访问同一个 bank，但在不同的地址时，访问是串行的（右）</center>

在 GPU 中，有 32 个 bank，每个 bank 宽度为 4 Bytes，即 32 bits（不是 64 bits；GPU 设计时考虑了 32 位浮点数和整数）映射到连续的 bank。之所以选择 32 是一个 warp 有 32 个线程，理想情况下他们可以在一个周期内并行访问

```
Address:  0x00  0x04  0x08  0x0C  0x10  0x14  0x18  0x1C  ...  0x7C
Bank:       0     1     2     3     4     5     6     7   ...    31

Address:  0x80  0x84  0x88  0x8C  0x90  0x94  0x98  0x9C  ...  0xFC

Bank:       0     1     2     3     4     5     6     7   ...    31
```

如上，因为 shared memory 通常是 KB 级别，所以会有多个地址映射到同一个 Bank

线程并发访问的例子，每个线程会访问不同的 Bank，对应上图左侧：

```cpp
__shared__ float data[1024];  // array in shared memory

// all 32 threads access consecutive elements of data
int tid = threadIdx.x;
float value = data[tid];  // address LSBs: 0x00, 0x04, 0x08, ...
```

线程串行访问例子，每个线程都会访问同一个 Bank，对应上图右侧（假设每个线程访问一个每行有 **32** 个元素的 row-major shared memory memory的一列：

```cpp
float value = data[tid * 32];  // address LSBs: 0x000, 0x080, 0x100 ...
// recall: floats are 4 bytes wide
```

这种情况下可以通过转置 shared memory array 的方式来解 Bank Conflict

## Register Pressure

一个 thread 使用的 register files 数量由 kernel 的 `SASS` 代码确定，由于 [[#Thread Block]] 中的所有线程都被调度到同一个 SM 上，线程块所需的总空间也由内核启动配置确定。随着每个 Thread Block 分配的空间增加，较少的 Thread Block 可以被调度到同一个 SM 上，降低了占用率，使得隐藏延迟变得更加困难

register pressure 和如下关键功能之间的关系，[见此](https://newsletter.semianalysis.com/p/nvidia-tensor-core-evolution-from-volta-to-blackwell)：

 - 异步拷贝（asynchronous copies），在 Ampere 架构添加
 - [[#Tensor Memory Accelerator(TMA)]]，在 Hopper 架构添加
 - [[#Tensor Memory]]，在 Blackwell 架构添加