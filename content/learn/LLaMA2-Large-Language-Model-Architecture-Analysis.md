---
title: LLaMA2大语言模型架构详解
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-31T10:26:16.1616+08:00
---

[llama_struct.drawio](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/llama_struct.drawio)

![](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925174602285.svg)

上面的架构图还忽略了一些小细节的运算，不可作为完整数据流来参考，但是可以高屋建瓴的看一下

## 前置基础

了解 [[Transformer-Model-Detailed-Analysis]]

## LLaMA vs Transformer

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174720671.png)

LLaMA 相比于 Transformer 来说：

- Norm 操作放到了 Attention 前面
- 位置编码不针对输入，只针对 Q 和 K，且变成了 Rotary Position Encoding
- self attention block 带有 KV Cache 了，且变成了 GMQA（Grouped Multi-Query Attention）
- Transformer feed forward 使用 ReLU 作为激活函数，LLaMA 使用 SwiGLU

## RMS Norm

layer normalization

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174730784.png)

RMS: Root Mean Square Normalization

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174742441.png)

RMS 相比于 Layer Normalization，计算量更小，不用算均值。

## Rotary Position Encoding

self-attention 使用的是绝对的位置进行编译，后来在论文 `Self-Attention with Relative Position Representations` 中提出使用相对位置编码来表示联系两个 token

`RoFormer: Enhance Transformer With Rotary Position Embedding` 提出

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174753013.png)

相对编码函数 `g` 的自变量就是两个 embedding 向量和两向量之间的相对位置的函数。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174802045.png)

Tips:

- 因为 Rotary Position Encoding 描述的是两个 token 之间的关系，**所以只用在 query 和 key 上**，value embedding 不会进行 Rotary Position Encoding 操作。
- q/k 乘完 Weight 矩阵之后才会加上 Rotary Position Embedding 信息。

## KV cache

### 提出的背景

（只）在推理过程，只关心模型上一次输出的 token，因为前面的 token 都已经计算过了；另一方面，模型需要知道所有的前序 tokens 用于决定，因为这些 tokens 被看作上下文（context/prompt）

### 实现的基础

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174812042.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174821801.png)

==观察上图==，考虑推理的时候是一个 token 一个 token 往外输出的，所以 $QK^T$ 是从 1 * 1 逐渐变成n * n 矩阵的：

1. 计算第 n+1 个 token 的时候， $QK^T$ 的前 n 行已经计算过了，可以不用重复计算
2. 深紫色的部分之后都会被 mask，完全可以不用计算
3. 在计算第 n+1 个 token 的时候，不需要关心 Attention 的前 n 行的值

==观察下图==，使用 Cache 的情况下，以输出第 4 个 token 为例

1. Q 中 token 不用一直堆叠，直接将 Token4 替换上一次的 Token3，Q的维度保持 `1 * embedding_size`
2. K 中利用缓存，只需要 append token4，此时 $K^T$ 维度为 `embedding_size * 4`。计算 $QK^T$，其维度为 `1 * 4`
3. V 中利用缓存，只需要 append token4，其维度变为 `4 * embedding_size`
4. 只需计算出 Attention4

## Grouped Multi-Query Attention (GQA)

> [!important] 借由 KV cache，实现了计算量的大幅度减少，这时就需要考虑一个问题，特别是对 Nvidia 的 GPU 来说，算的太快，数据传输反而成为了瓶颈，也就是 LPDDR5 都不够用，如何解决这个问题？使用 Grouped Query Attention 来解决！

### IO 瓶颈

对于 Nvidia A100 80GB PCIe 来说：

- 计算能力是 19.5 TFLOPS@FP32
- 而 Memory Bandwidth 是 1.935 GB/s

二者大约是 40 倍的差距（1 FP32 = 4 Bytes）

> [!important] 如果使用的是 n 个相同的数据，那么原本 n 次的传输就变成了 1 次

### 对比三种 attention 方案

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174857862.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174905050.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174913182.png)

### Multi-Query

将 head 维度，即 h 从 K 和 V 中移除，而 Q 保留。最终不同的 query 是共享同样的 Key/Value。

最终在 batched multi-head attention 和 multi-query attention 之间折衷一下，就得到了 Grouped Multi-Query Attention：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174924171.png)

## SwiGLU Activation Function

we attribute their success, as all also, to divine benevolence

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174943526.png)

## *参考资料*

1. [https://www.bilibili.com/video/BV1nK4y1F7x7/?spm_id_from=333.337.search-card.all.click&vd_source=a7368c6184a1b162acff7bf0efed19b2](https://www.bilibili.com/video/BV1nK4y1F7x7/?spm_id_from=333.337.search-card.all.click&vd_source=a7368c6184a1b162acff7bf0efed19b2)
2. [https://www.bilibili.com/video/BV1EN411V7bx?spm_id_from=333.788.videopod.sections&vd_source=a7368c6184a1b162acff7bf0efed19b2](https://www.bilibili.com/video/BV1EN411V7bx?spm_id_from=333.788.videopod.sections&vd_source=a7368c6184a1b162acff7bf0efed19b2)
3. [https://github.com/hkproj/pytorch-llama-notes](https://github.com/hkproj/pytorch-llama-notes)
4. [https://github.com/hkproj/pytorch-llama-notes/blob/main/LLaMA_Final.pdf](https://github.com/hkproj/pytorch-llama-notes/blob/main/LLaMA_Final.pdf)