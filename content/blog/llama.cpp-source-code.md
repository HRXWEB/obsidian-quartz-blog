---
title: LLaMA源码解读笔记
draft: true
aliases: []
tags: [infra]
created: 2025-11-05T16:44:31.3131+08:00
updated: 2025-12-11T12:42:17.1717+08:00
---

# 课程链接

- [【大模型部署】llama.cpp源码逐行调试带读！（已完结\~）\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1N4wreWE8z/?spm_id_from=333.788.recommend_more_video.2&trackid=web_related_0.router-related-2206419-bzvv8.1762331081392.106)
- [【大模型部署】llama.cpp大模型算子源码详解（已完结\~）\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1ZWKAe1EWL/?spm_id_from=333.1387.collection.video_card.click&vd_source=a7368c6184a1b162acff7bf0efed19b2)
- [【大模型部署】8bit量化算子解析（已完结！）\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1NU9wY4ENo/?spm_id_from=333.1387.collection.video_card.click&vd_source=a7368c6184a1b162acff7bf0efed19b2)

---
> [!success] PART I
> **源码结构解析**

---
> [!success] PART II
> **算子源码解析**

---
> [!success] PART III
> **8 bit 量化算子解析**

# 前置思考

## 为什么要进行量化？

- **减小模型存储（Storage Saving）**
	- **原理：** 将浮点数（通常是 float32 占用 4 字节）转换为低精度整数（例如 int8 占用 1 字节，Q4_0 占用 0.5 字节）。
	- **收益：** 模型大小减少 4 倍甚至更多。
- **降低内存带宽和能耗（Bandwidth and Energy Efficiency）**
	- **原理：** 推理时，需要从内存/缓存中读取权重和激活值。读取 1 字节数据比读取 4 字节数据所需的时间和能量显著减少。
	- **收益：** 减少内存墙（Memory Wall）瓶颈，提高设备（尤其是移动端、边缘设备）的能效。
- **加速计算（Computational Speedup）**
	- **原理：** 硬件（如 CPU、GPU、ASIC/NPU）处理低精度整数运算（如 int8 乘加）的速度远快于浮点运算。
	- **收益：** 这是实现推理加速的关键，详细阐述见 [[#量化具体如何加速推理过程？]]

## 量化的算法广义上可以随便定义吗？

> [!HINT] 
> **广义上说，是的**
> 
> 量化算法的核心是找到一个合适的映射 $Q=f(W)$ 和一个可逆的逆映射 $W'=g(Q)$

但通常在设计量化算法时需要满足三个核心约束：

- **约束 1: 必须可精确反量化（理想情况）或近似反量化（实际情况）**
	- $\text{量化} \quad Q = \text{Round}\left(\frac{W}{S}\right) + Z$
	- $\text{反量化} \quad W' = (Q - Z) \times S$
	只要能定义 $f$ 和 $g$ 使 $W' \approx W$ ，这种量化就是**数学上可行**的
- **约束 2: 必须适应硬件特性（实际瓶颈）**
	量化算法不能随便定义，它必须能够被**目标硬件高效地执行**。例如：
	- **硬件支持 $M \times N$ 的 int8 矩阵乘法**：因此，量化算法必须以 int8 或 int4 作为最终存储格式。
	- **硬件缺乏快速的位操作指令**：那么像 Q4_0 那样复杂的位打包/解包操作可能会在某些设备上变慢。
- **约束 3: 必须保证精度损失在可接受范围内（效果约束）**
	这是最重要的工程约束。如果量化导致模型精度（如 Top-1 准确率）下降超过 1-2%，那么这个量化算法就是失败的。因此，需要在 S 和 Z 的计算上进行大量优化（如分块量化、混合精度量化等）。

**总结：** 量化算法在数学上是灵活的，但必须服从**硬件效率**和**模型精度**的双重约束。`llama.cpp` 的 `Q4_0` 就是为了在 CPU 上实现极限压缩和合理速度而特别定制的算法。

## 量化具体如何加速推理过程？

最粗暴的计算方式——每次计算前都进行反量化，此时量化就只起到了减少存储空间和降低内存带宽的作用。而量化真正的加速秘密在于：**反量化只发生在推理循环的边缘，而核心计算（矩阵乘法）是在低精度整数域完成的。**

计算时的核心瓶颈为矩阵乘法 GEMM：

$$
\text{浮点矩阵乘法} \quad Y = W \cdot X
$$

加速的原理——整数累加器。当模型量化后，核心计算变成了：

$$
Y_{\text{int}} = W_{\text{int}} \cdot X_{\text{int}}
$$

作用为：

1. 消除浮点乘法：硬件可以利用专门的 INT8 单元执行乘法
2. 避免反量化 $W$ 和 $X$
	推理时，我们**不立即反量化** $W_{int}$​ 和 $X_{int}$​。相反，硬件直接执行**整数乘法和累加**：
	$$
	\text{整数累加器} \quad \text{Accumulator} = \sum_{k} W_{\text{int}}[i, k] \times X_{\text{int}}[k, j]
	$$

	这里的 `Accumulator` 是一个高位宽的整数（通常是 32 位或 64 位整数），以防止溢出。

3. **延迟反量化和反偏移（核心）**
	**整个矩阵乘法完成后，才进行一次性的大规模反量化操作**，将高精度整数 Accumulator 转换回浮点数，并应用 Scale 和 Zero-Point。
	$$
	\text{最终输出} \quad \text{Output } Y = ( (\text{Accumulator} - \text{ZeroPoint}) \times S_{\text{output}} ) + Z_{\text{output}}
	$$

	这个 $S_{output}$​ 和 $Z_{output}$​ 是基于输入 $X$、权重 $W$ 和输出 $Y$ 的缩放因子计算出来的。

计算差异为：

- 一个 `float32` 的矩阵乘法，需要 $O(N^3)$ 次 `float32` 乘法和 $O(N^3)$ 次 `float32` 加法。
- 一个 `int8` 的矩阵乘法，需要 $O(N^3)$ 次 `int8` 乘法和 $O(N^3)$ 次 `int32` 加法，**加上** $O(N^2)$ 次反量化操作。
- 由于现代硬件处理 int8 乘加的速度比 float32 快 **4 倍甚至更多**，且 $O(N^3)$ 的核心计算远大于 $O(N^2)$ 的反量化开销，因此**总体耗时大幅减少**。

|**操作**|**复杂度**|**计算成本**|
|---|---|---|
|**核心乘加**|$O(N^3)$|**加速 4x+ (使用 $\text{INT8}$ 单元)**|
|**反量化**|$O(N^2)$|额外的计算开销|

**总结：量化加速的秘密在于：通过将最耗时的 $O(N^3)$ 核心计算转移到速度更快的整数域，来抵消 $O(N^2)$ 的反量化开销。**

## 为什么延迟反量化和反偏移是可行的

关键字在于——**延迟**。通过它才真正避免了每次计算前先反量化，而且反量化了就不能用 INT8 硬件了。所以为什么可以延迟呢？

我们从原始的浮点矩阵乘法开始：

$$
Y = W \cdot X
$$

量化后，权重 $W$ 和输入 $X$ 可以近似表示为（非对称量化）：

$$
\begin{align} W &\approx (Q_w - Z_w) \cdot S_w \\ X &\approx (Q_x - Z_x) \cdot S_x \end{align}
$$

对于输出矩阵 $Y$ 中的一个元素 $Y_{i,j}$​：

$$
Y_{i,j} = \sum_{k} W_{i,k} \cdot X_{k,j}
$$

代入量化近似项：

$$
Y_{i,j} \approx \sum_{k} \left[ (Q_{w}[i,k] - Z_w) \cdot S_w \right] \cdot \left[ (Q_{x}[k,j] - Z_x) \cdot S_x \right]
$$

通过结合律和交换律，我们可以将浮点标量 $S_w$​ 和 $S_x$​ 提取到求和符号外面：

$$
Y_{i,j} \approx S_w S_x \sum_{k} (Q_{w}[i,k] - Z_w) \cdot (Q_{x}[k,j] - Z_x)
$$

展开求和项 $\sum k​(\cdot)$ :

$$
Y_{i,j} \approx S_w S_x \left[ \sum_{k} Q_{w} Q_{x} - Z_x \sum_{k} Q_{w} - Z_w \sum_{k} Q_{x} + \sum_{k} Z_w Z_x \right]
$$

总结：延迟的目的就是让矩阵乘这个耗时的计算在整数域计算。

## 当前输出 $Y$ 是浮点的，送入下一层又要重新量化？更耗时？

> [!question] 问题
> 上面解释的过程，输出 $Y$ 最终会回到浮点数域，那之后和下一层的整数权重相乘时岂不是又要量化一次，再做计算，岂不是很耗时？
> 
> 这是一个非常关键的问题，涉及到量化模型在**多层网络**中如何保持效率的机制——这就是**量化感知训练 (Quantization Aware Training, QAT)** 或 **后训练量化 (Post-Training Quantization, PTQ)** 所解决的核心问题。

若按照问题的描述，当前层的输出送到下一层做输入时，还要再做一次 `Re-Quantize`

这个过程大致是：

$$
\text{Accumulator} \xrightarrow{\text{De-Quantize}} Y_{\text{float}} \xrightarrow{\text{Re-Quantize}} Q_{\text{out}}
$$

$$
Q_{\text{out}} = \text{Round}\left(\frac{Y_{\text{float}}}{S_{\text{out}}}\right) + Z_{\text{out}}
$$

其中，$S_{out}$​ 和 $Z_{out}$​ 是针对**当前层输出**计算出的新的缩放因子和零点，它们是在 PTQ 或者 QAT 过程校准计算出来的。为了解决这个问题，引入了下面的优化机制：

> [!HINT] 核心优化机制
> **链式整数运算 (Chaining Integer Operations)**

现代量化推理的加速机制不是让每层都回到浮点数，而是尽可能地保持在整数域进行计算，实现**端到端（End-to-End）的整数运算链**。

高效的推理引擎中，这两个步骤被**融合（Fused）**在一起，避免了实际的 float32 中间表示。

关键在于，我们可以直接找到一个单一的**整数到整数**的乘数 M 和加数 B，将 $\text{Accumulator}$（int32）直接映射到下一层的输入 $Q_{out}$​（int8），

$$

Q_{\text{out}} = \text{Clamp} \left( \text{Round} \left( M \times \text{Accumulator} + B \right), Q_{\min}, Q_{\max} \right)

$$

具体过程为：

我们从上一问推导的 $Y_{i,j}$​ 公式开始（为简洁，省略下标 $i,j$）：

$$
Y \approx S_w S_x \left[ \sum_k Q_w Q_x - Z_x \sum_k Q_w - Z_w \sum_k Q_x + \sum_k Z_w Z_x \right]
$$

其中，中括号内是高精度整数 (Accumulator) 的代数形式。

$$
\text{Acc} = \sum_k Q_w Q_x - Z_x \sum_k Q_w - Z_w \sum_k Q_x + \sum_k Z_w Z_x
$$

**延迟反量化 (De-Quantization):**

$$

Y_{\text{float}} \approx S_w S_x \cdot \text{Acc}

$$

**重新量化 (Re-Quantization):** 下一层（int8）的输入 $Q_{out}$​ 依赖于 $Y_{\text{float}}$​、输出缩放因子 $S_{out}$​ 和零点 $Z_{out}$​：

$$

Q_{\text{out}} = \text{Round}\left(\frac{Y_{\text{float}}}{S_{\text{out}}}\right) + Z_{\text{out}}

$$

将 De-Quantization 结果代入 Re-Quantization 公式:

$$ Q_{\text{out}} \approx \text{Round}\left(\frac{\text{Acc} \cdot (S_w S_x)}{S_{\text{out}}}\right) + Z_{\text{out}} $$ $$ Q_{\text{out}} \approx \text{Round}\left(\text{Acc} \cdot \underbrace{\frac{S_w S_x}{S_{\text{out}}}}_{M_{\text{float}}}\right) + Z_{\text{out}} $$

为了将 $Q_{\text{out}}$ 的计算保持在整数域，推理引擎会执行**定点化**：将浮点乘数 $M_{\text{float}}$ 转换为一个整数乘数 $M$ (通常是一个 $\text{int}32$ 乘数，结合一个位移操作 $\text{shift}$)。

$$

M_{\text{float}} = \frac{S_w S_x}{S_{\text{out}}}

$$
**$M$ 和 $B$ 的携带信息**：
- **$M$ (乘数):** $$ M_{\text{float}} = \frac{S_w S_x}{S_{\text{out}}} $$ $M$ 携带了**本层的权重缩放 $S_w$**、**本层的输入 (激活) 缩放 $S_x$** 和**下一层的输入缩放 $S_{\text{out}}$** 的信息。它是实现 $\text{INT}32 \to \text{INT}8$ 跨层缩放的关键。 
- **$B$ (加数):** $$ B \approx Z_{\text{out}} $$ $B$ 携带了**下一层量化所需的零点偏移 $Z_{\text{out}}$** 的信息。由于 $\text{Acc}$ 已经是经过零点修正的，所以 $B$ 主要用来补偿 $Z_{\text{out}}$。

因此，$M$ 和 $B$ 通过这种代数组合，将两层的缩放和偏移信息融合在一起，**实现了从 $\text{Acc}$ ($\text{int}32$) 直接高效地跳转到 $Q_{\text{out}}$ ($\text{int}8$) 的整数计算链。**

**总结**：
- **没有回到 float32 的必要：** 推理加速的关键就在于避免 O(N3) 的核心计算使用浮点数。
- **计算链：** 整个网络中的计算流是：INT8×INT8→INT32→INT8→INT8×INT8→…
- **瓶颈解决：** 虽然 De-Quantize/Re-Quantize 步骤（即 INT32→INT8）仍然是 O(N2) 的开销，但它仍然是整数或定点数运算，并且远小于 O(N3) 的核心乘法带来的加速收益。

计算过程

| **步骤** | 解释                                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1      | 网络的第一层输入 $\text{float32}$ $X$                                                                                                                                                                    |
| 2      | 对 $X$ 进行量化，得到 $\text{int8}$ 的 $Q_x$ 和对应的缩放因子 $S_x, Z_x$。                                                                                                                                         |
| 3      | $Q_w$ 和 $Q_x$ 进行 $\text{int8} \times \text{int8}$ 矩阵乘法，结果累加到 $\text{int32}$ 或 $\text{int64}$ 的 $\text{Accumulator}$ 中。                                                                           |
| 4      | **关键步骤（融合操作）：** 这步将 $\text{Accumulator}$（$\text{int32}$）通过**整数乘数 $M$**（携带 $S_w, S_x, S_{\text{out}}$ 信息）和**加数 $B$**（携带 $Z_{\text{out}}$ 信息）进行定点运算，直接输出下一层所需的 $\text{int8}$ 激活值 $Q_{\text{out}}$。 |
| 5      | $Q_{\text{out}}$ 成为下一层的 $Q_x$ 输入。                                                                                                                                                                |
| 6      | 重复 3-5                                                                                                                                                                                           |

# 量化权重过程解析

# 推理反量化过程解析