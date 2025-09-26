---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:24 pm
updated: Friday, September 26th 2025, 5:53:35 pm
---

> [!important] 通关手册
> 
> [CUDA_Python通关引导.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/CUDA_Python%E9%80%9A%E5%85%B3%E5%BC%95%E5%AF%BC.pdf)

---

> 基于 **Numba** 的 **CUDA Python** 编程简介
> 
> [IntroductiontoCUDAPythonwithNumba.ipynb](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/IntroductiontoCUDAPythonwithNumba.ipynb)

Numba 是一个**类型专用**的**即时函数编译器**，用于为 CPU 或 GPU 加速**以数值计算为主的** Python 函数。此定义很长，下面就让我们逐一解析这些术语：

- **函数编译器**：Numba 用于编译 Python 函数，而非整个应用程序，它也不是函数的一部分。Numba 不会取代 Python 解释器，而仅作为另一个 Python 模块，将普通函数转化为执行速度更快的函数（通常情况下）。
- **类型专用**：Numba 可为您当前使用的**特定数据类型（感觉像模板特化）**生成专门的执行代码，从而加速函数运行。Python函数被设计为对通用数据类型进行操作，这为其带来了极大的灵活性，但也严重拖慢了运行速度。实际上，您只会调用具有少量参数类型的函数，因此Numba会为每种类型的集合生成快速实现。
- **即时**：在函数首次被调用时，Numba 会对它们进11111111行转换，这样可以确保编译器知道您将使用的参数类型。这也使得Numba可以像传统应用程序一样轻松地在Jupyter笔记本中交互使用。
- **以数字计算为主**：Numba 目前以处理数值型数据类型为主，如 `int`、`float` 和 `complex`。字符串处理支持极为受限，且许多字符串处理函数还无法在 GPU 上获得有效加速。若要借助 Numba 获得最佳加速效果，您可能需要搭配使用 NumPy 数组。

1. NumPy 通用函数（“ufunc”）的概念是，此类函数可对相同或不同维度的 NumPy 数组或标量，进行**逐元素**的处理。
2. 逐元素时，使用 vectorize 装饰器
3. `np` 数学函数无法在设备上使用，需改用与其作用相同的 `math` 函数。

---

> 使用 Numba 的 CUDA Python 的自定义核函数和内存管理
> 
> [CustomCUDAKernelsinPythonwithNumba.ipynb](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/CustomCUDAKernelsinPythonwithNumba.ipynb)
> 
> [cuda基础.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/cuda%E5%9F%BA%E7%A1%80.pdf)

对于支持 CUDA 的 NVIDIA GPU 而言，其每个晶片上均包含数个 **[流多处理器](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#hardware-implementation)** (**SM**)，并附带 DRAM。SM 包含执行核函数代码所需的所有资源，并且包括多个 CUDA 核心。启动核函数时，每个线程块只分给一个 SM，亦有可能多个线程块分给一个 SM。SM 会将线程块进一步细分为每32个线程一个单位（称为**warp**），而接收并执行并行指令的正是这些warps。

当一条指令需要多个时钟周期才能完成（或以CUDA的说法是**到期**）时，_如果仍有其它的warps等待接收新指令_，则 SM 便能继续做有意义的工作。==由于 SM 上的寄存器堆非常庞大==，因而在转向一个新的warp发布指令时，SM 不会因改变工作的上下文环境而造成时间损失。简言之，只要有其它待做的工作，SM 便会一直执行有意义的工作而将操作延迟隐藏起来。

**因此，对于充分利用 GPU 的潜力并进而编写出高性能的加速应用程序而言，最重要的是必须为 SM 提供足够数量的 warps，使 SM 能够隐藏延迟。而实现这一目的的最简单的方法便是使用足够大的网格与线程块来执行核函数。**

确定CUDA线程网格的最佳大小是一个复杂的问题，取决于算法和特定的GPU的[计算能力](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#compute-capabilities)。不过，以下是几条粗略的启发式规则，遵循它们可以很好地帮助我们入门：

- ==一个线程块所含的线程数应为 32（warp）的倍数，每个线程块通常包含 128 至 512 个线程。==
- ==网格大小应确保能够充分利用 GPU 的全部潜能。学习伊始，建议您在 GPU 上启动的网格里的块数是 SM 数的2至4倍。使用 20 至 100 个线程块通常是一个适合的起点。==
- ==CUDA 核函数的启动开销的确会随块数而增长，因此在输入的数据规模非常庞大时，建议您不要启动线程数与输入元素数相等的网格，以免产生大量的线程块。相反，我们可以改用另一种模式：跨网络循环。==

[网格跨度循环.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/%E7%BD%91%E6%A0%BC%E8%B7%A8%E5%BA%A6%E5%BE%AA%E7%8E%AF.pdf)

网格跨度循环：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175243567.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175254760.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175303561.png)

---

> 有效使用内存子系统

[EffectiveMemoryUse.ipynb](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/EffectiveMemoryUse.ipynb)

如何利用称为**共享内存**的片上设备内存区域。共享内存是程序员定义的容量有限的缓存，容量大小[取决于GPU](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#compute-capabilities) ，并且只在==同一个块==中的所有线程之间所**共享**。它是一种稀缺资源，不能由分配该共享内存的块之外的线程所访问，并且在核函数完成执行后不会持续存在。

[内存合并.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/%E5%86%85%E5%AD%98%E5%90%88%E5%B9%B6.pdf)

👆考虑连续内存读取对数据读取效率的影响

[使用共享内存来支持内存合并访问.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/%E4%BD%BF%E7%94%A8%E5%85%B1%E4%BA%AB%E5%86%85%E5%AD%98%E6%9D%A5%E6%94%AF%E6%8C%81%E5%86%85%E5%AD%98%E5%90%88%E5%B9%B6%E8%AE%BF%E9%97%AE.pdf)

👆共享内存间隔读取效率不低，可以用于支持输入输出读写时都满足完全内存合并访问：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175321293.png)

[共享内存区冲突.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/%E5%85%B1%E4%BA%AB%E5%86%85%E5%AD%98%E5%8C%BA%E5%86%B2%E7%AA%81.pdf)

实际共享内存为32个4字节宽度的区，每次一个区最好读取一个元素，避免冲突（可以通过逻辑共享内存多加一列实现）：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175331539.png)
