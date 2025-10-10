---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

## Link

- [https://github.com/microsoft/T-MAC](https://github.com/microsoft/T-MAC)
- [https://www.arxiv.org/pdf/2407.00088](https://www.arxiv.org/pdf/2407.00088)

## Background&&Motivation

在端侧部署大模型都需要量化权重（weight quantization）来减少内存占用。但是

1. prefill stage 阶段的矩阵乘是计算密集型；decode stage 是矩阵向量乘，每次涉及整个模型的信息加载和处理，是内存密集型。
2. 推理时需要计算 **低精度的权重** * **高精度的激活值**，现有的硬件没有原生支持混合精度矩阵乘法（mixed precision matrix multiplication, mpGEMM）
    1. 权重是符合一定分布的，实验发现可以低比特量化而不影响模型性能
    2. 激活值由于离群点（outlier）的存在没法进行低比特量化
3. 混合计算的矩阵的精度和位宽是多种多样的，目前需要专门每一种设计计算内核
4. GPU 由于架构上的限制，查找表存储容量不足、查表速度慢，导致 LUT-based 技术在 GPU 上表现欠佳

## Contributions

T-MAC：LUT-based 推理范式

1. 权重无需反量化，直接支持 mpGEMM。只需：0次乘法、大量减少的加法、查表
2. 传统乘法是基于数据类型进行操作的，计算过程涉及大量的乘法运算。而T-MAC是将其中一个乘数按位分解，将乘法转为**基于位**的操作。
    1. 好处：
        1. 避免了大量的乘法计算。
        2. 对于不同的位宽组合W4A16、W2A16等，**T-MAC 计算过程是统一的，对数据类型不敏感。**
        3. 随着位宽降低，模型推理速度是线性提升的。
    2. 坏处：
        1. 权重和激活值是连续的，但是查表是随机访问
        2. LUT很大，增加了内存消耗。
3. 针对查找表随机访问，提出 `LUT-centric data layout` ，通过 **Axis reordering and tiling** 技术提高每个查找表的利率用
4. 针对内存消耗的问题，提出 `table quantization` 和 `mirror consolidation` 减少表的大小。
5. T-MAC kernel library

## Method

### Unified Multiplication

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926181953864.png)

通过线性变换，将以数据类型为中心的计算变成了比特计算。无论是什么类型和精度的Weight 和 Activation 相乘都转变成了统一的 activation matrix 和 one-bit matrix 的乘法运算。

### T-MAC algorithm

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182004717.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182016549.png)

1. Weight 矩阵维度是 M * K，位宽是 b bits，按位分成 b 个 M * K 矩阵，记为 $W_1',...,W_b'$
2. 以 $W_i'$ 每一行的 g bits 为一组，作为 LUT 的索引。需要注意的是，比如上图 `1110`，左边 1 是 高位，0 是低位，因此索引值是 14。此时得到 $W_1,...W_b$，其维度为 $M * \frac{K}{g}$
3. Activation 矩阵维度是 N * K，每行的 g 个 值为一组。每一组与 0000 到 1111 相乘，得到 $2^g$ 个值。因此可以得到 $N * \frac{K}{g} * 2^g$ 个表项
4. 查找 b 个权重值对应的表项的值，将其加权求和即可得到一个值 a，$\frac{K}{g}$个 a 相加则得到

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182027421.png)

### LUT-Centric Data Layout

1. 把 table 放到片上内存缓解随机访问带来的性能下降的问题，但是也会增加内存压力
2. Axis-reordering：因为是沿着 K 轴生成的 LUT，如果先循环 N，M轴，需要存储整个LUT，若先沿着 K 轴循环，则每次只需保存 1 * K~~/g~~ 大小的 LUT。
3. Tiling

    举例：假设每个 Cache Line 只能容纳 `b` 个数组元素（`j_i` 代表 `inner_j`，`j_o`代表 `outer_j`）

    ```Plain
    for i in range(0, N):
      for j in range(0, M):
        A[i] += B[j]
    
    # 对于 B[0] 来说，i=0,1,2... 时其都会被重新访问。如果 M 太大，那么 i=0 时存放在 cache 中的 B[0] 可能已经被 evict 了，i=1 时再访问就出现 cache miss。
    # 尝试量化分析 cache miss 的次数，
    #   - 对于 A[] 来说，cache miss 次数为 N/b
    #   - 对于 B[] 来说，miss 次数为 M/b * N
    # 总 cache miss 为 N/b*(1+M)
    ```

    数学原理：分块矩阵乘法

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182042127.png)

4. 布局优化
    1. weight permutation for sequential memory access：tile 带来的非连续内存访问
    2. weight interleaving for fast unpacking  
        理由：因为硬件的限制，最少是 8bits 计算数据  
        实现：下两图举例，将 32 个 uint4 的数据，通过 AND 和 （SHR + AND）的操作分成了 两个 16 * uint8 的索引数据。

        ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182058512.png)

        ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182110426.png)

### Reduce LUT Storage

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182119073.png)

1. Mirror Consolidation：利用表值对称的特性，如 1000 和 0000 索引对应的表项的值是相反数，只保留一半表项即可，另一半可反算得到。
2. Table Quantization：对表项的值本身做量化，比如论文中的举例，最终查表得到的值是 INT8

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182231218.png)

## Implementation

略

- Code generation through TVM
- C++/Python API，很容易和 Pytorch，numpy 等集成，C++ 裸指针传数据，避免 TVM runtime 依赖
- Parallelism
- Efficiant table look-up by TBL/PSHUF
- Fast 8-bit aggregation：聚合操作就是 n 个数据聚合成一个代表它们，如 sum 运算
- Bit-serial linear transformation
- Register swizzling for efficient LUT precomputation

## Evaluation

### Setup

- 四个硬件设备：M2-Ultra、Raspberry Pi 5、Jetson AGX Orin、Surface Book 3
- 从 Kernel 和 model 两个粒度来评估
- baseline：llama.cpp
- 评测方法：warmup

### mpGEMV/mpGEMM Performance Benchmark

加速好几倍

### End-to-End Inference Throughput

几倍

### Power and Energy Consumption

kernel 功耗降低10+%，model 功耗降低 20+%

### Optimization Breakdown

证明有效性

## 结论

- 优点
    - 通过查表运算取代了混合精度计算，大量减少了乘法运算和加法运算。
    - 计算过程对数据类型不敏感，可以用统一的 kernel 进行描述
    - 在内存访问和占用方面做了很多的工作
- 缺点
    - 对 table 进行量化会进一步的损失精度
    - 实验上最多进行了 4bit 的 weight 量化，没有对比 8bit，不知道 4bit 模型性能如何

## 附录

### Interleaving

- **基本概念**：交错方法是一种将不同类型的数据或者同一数据结构中不同部分的数据按照特定顺序交替排列存储的技术手段。其目的通常是为了优化后续的数据读取和处理效率，便于同时获取多种相关数据进行联合操作。
- **示例说明**：
    - 比如在计算机内存存储中，假设有两种不同的数据类型，数据 A（以字节为单位表示，例如存储的是图像的亮度信息）和数据 B（同样以字节为单位，比如存储的是图像的色度信息）。采用交错存储的方式，可能就会按照 A 的一个字节、B 的一个字节、A 的下一个字节、B 的下一个字节…… 这样依次交替排列的顺序把它们存储到内存空间中。这样做的好处在于，当后续需要同时使用这两种数据进行处理（比如在图像显示或者图像处理算法中同时用到亮度和色度信息来合成完整的图像效果）时，可以通过一次内存读取操作就能获取到相关联的一对 A 和 B 数据，而不需要分别去不同的存储位置先后读取，大大提高了数据获取和处理的效率。
    - 再比如在处理多维数组时，对于一个二维数组，如果按行存储和按列存储可以看作是两种基本的存储方式，而交错存储则可以是把每行中的元素与每列中的对应元素进行交替排列存储，当涉及到一些需要频繁跨行、跨列同时访问数据的算法时，这种交错存储的布局就能让数据读取更便捷，减少了内存寻址等操作花费的时间。
- **应用场景**：常用于图形处理（如前面提到的图像数据存储）、多媒体数据处理（音频、视频数据中不同声道、不同帧信息等的存储优化），以及在一些需要频繁同时操作多种相关数据的算法运算场景中，像并行计算里多个不同数据来源的数据整合存储以方便协同计算等。

### Swizzling

- **基本概念**：混排方法是对已有的数据排列顺序进行重新打乱、调整，按照特定的规则形成一种新的排列方式。它并非简单的随机打乱，而是基于一定的优化目标，比如改善数据的局部性（使得在后续读取数据时，相邻的数据往往是后续运算中更可能会一起用到的数据），提高缓存命中率，或者便于特定硬件架构下的数据处理流程等。
- **示例说明**：
    - 以一个简单的数组数据为例，原本数组元素顺序是 [1, 2, 3, 4, 5, 6, 7, 8]，通过一种特定的混排规则（比如按照某种哈希函数或者位运算规则来确定新的顺序），可能会变成 [3, 7, 1, 5, 2, 6, 4, 8]。在一些游戏开发中的纹理映射场景里，纹理数据原本的存储顺序可能不利于 GPU 快速读取和处理，通过混排的方式将纹理数据按照 GPU 纹理缓存的特性和纹理采样算法的要求进行重新排列后，GPU 在进行纹理渲染等操作时，能够更高效地从缓存中获取到所需纹理数据，减少了因为数据存储顺序不合理而频繁从内存中重新加载数据的情况，从而提升了图形渲染的速度。
    - 又比如在内存数据管理中，对于程序运行时频繁使用的一些数据块，通过混排的方式将它们按照更符合处理器缓存层次结构的顺序排列，使得这些数据进入缓存后，在后续运算过程中缓存命中率更高，处理器可以更快地获取数据进行计算，提高了整个程序的运行效率。
- **应用场景**：广泛应用于图形处理（优化纹理数据、顶点数据等在 GPU 中的存储和读取）、内存管理（提升缓存命中率）以及各种对数据读取效率、局部性有较高要求的高性能计算场景中，像科学计算中的矩阵运算等，通过混排数据来适配特定的计算硬件和算法流程，提升整体的计算性能。

## 参考阅读

1. [https://36kr.com/p/2904311413643905](https://36kr.com/p/2904311413643905)
2. [一篇文章了解 Loop Tiling 优化](https://zhuanlan.zhihu.com/p/477023757)
3. [https://github.com/microsoft/T-MAC/discussions/78](https://github.com/microsoft/T-MAC/discussions/78)
4. [https://www.matongxue.com/parts/2246/](https://www.matongxue.com/parts/2246/)