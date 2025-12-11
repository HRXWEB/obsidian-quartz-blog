---
title: 初识 FlashAttention
draft: true
aliases: []
tags: []
created: 2025-10-23T17:10:53.5353+08:00
updated: 2025-10-23T18:00:59.5959+08:00
---

# 核心技术

记 $N$ 为序列长度

- Tiling 矩阵分块操作
	- 将注意力计算（包括 Softmax）分成多个块进行处理。
	- 在计算 Softmax 时，由于 Softmax 涉及到所有元素的归一化，通常难以分块。FlashAttention 通过引入两个额外的统计量 $m(x)$ 和 $l(x)$ 来解耦 Softmax 的分块计算，使得可以在不访问整个输入的情况下计算 Softmax 的缩减。
	- 通过分块计算，可以将数据加载到 SRAM 中，执行**融合 (fused)** 的算子操作（如矩阵乘法、Softmax、Dropout 等），然后将结果写回 HBM，从而**减少 HBM 访问次数**。
- Recomputation 重计算
	- 为了节省内存，FlashAttention **不存储**反向传播所需的中间注意力矩阵 $P = Softmax(QK^T)$ 和输出 $O=PV$
	- 在反向传播时，它会**重新计算**这些中间值
	- 通过“时间换空间”的策略，极大地减少了反向传播所需的显存（通常可以将显存占用从 $O(N^2)$ 降低到 $O(N)）$，尤其对长序列 $N$ 非常有效。

# 分块操作——HBM 访问次数从 $O(N^2$) 降至 $O(N)$

## 传统 self-attention 访存——HBM $O(N^2)$

1. 计算注意力分数： $S = QK^T$
	- $Q$ 和 $K$ 的维度是 $N \times d$。结果 $S$ 是 $N \times N$ 的矩阵。
	- **HBM 写入：** 存储 $S$ 需要 $O(N^2)$ 的空间，所以需要**写入 $O(N^2)$ 个数据到 HBM**。
2. Softmax 归一化： $P = Softmax(S)$
	- 需要从 HBM **加载** $S(O(N^2))$，计算 Softmax，然后将结果 $P_{N \times N}$ **写入 HBM** $O(N^2)$。
3. 加权求和： $O = PV$
	- 需要从 HBM 加载 $P(O(N^2))$，然后计算 $O_{N \times d}$

所以总的访存数 $O(N^2)$

## FlashAttention 访存——HBM $O(N)$

- 传统的三步：计算注意力分数、softmax 归一化、加权求和，都融合成一个 kernel
- 并且矩阵分块之后，所有的数据都能直接在 **SRAM** 中完成访存

因此，HBM 只需要将输入加载到 SRAM，将输出从 SRAM 读取出来，中间的结果都是存放在 SRAM 上，不需要写回 HBM。

- 加载 QKV：维度都是 $N \times d$，d 是常数，所以 $O(N)$
- 输出 O：维度 $N \times d$，所以 $O(N)$

总的访存数 $O(N)$

# 重计算——显存占用从 $O(N^2$) 降至 $O(N)$

## 传统 self-attention 显存占用 $O(N^2)$

在标准的反向传播中，为了计算梯度，我们需要保存以下中间结果：

1. 注意力矩阵 $P_{N \times N} = Softmax(QK^T)$：需要 $O(N^2)$ 的显存
2. 输出 $O_{N \times d} = PV$：需要 $O(N)$ 的显存

总显存占用 $O(N^2)$，如果序列很长，即 $N$ 很大时，会迅速耗尽 GPU VRAM

## FlashAttention 显存占用 $O(N)$

重计算策略使用时间换空间，仅在反向传播使用：

1. **前向传播时：** 仅存储 $O(N)$ 大小的输入 $Q$,$K$,$V$ 和 Softmax 所需的 $O(N)$ 大小的统计量 $m$ 和 $l$。**不存储 $P$ 和 $O$。**
2. **反向传播时：**
	- 当需要计算梯度 $\frac{\partial \mathcal{L}}{\partial Q}$, $\frac{\partial \mathcal{L}}{\partial K}$, $\frac{\partial \mathcal{L}}{\partial V}$​ 时，它会**重新执行一次前向传播**来计算所需的中间激活值 $P$ 和 $O$。
	- 这个重计算也是以分块、融合的方式在 SRAM 中完成的，因此**计算成本增加是可控的**，同时避免了将 $O(N^2)$ 的中间结果存储在 HBM 中。

# Related

[[introduction-to-PagedAttention]]