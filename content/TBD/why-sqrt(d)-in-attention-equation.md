---
title: 为什么Attention计算要除以根号d
draft: true
aliases: []
tags: []
created: 2025-10-20T15:13:46.4646+08:00
updated: 2025-10-20T15:34:04.044+08:00
---

# 基本回答

当向量维度变大的时候，softmax 函数会造成梯度消失问题，所以设置了一个 softmax 的 temperature 来缓解这个问题。这里 temperature 被设置为了 $\sqrt{d}$

# 追问

## 为什么会导致梯度消失

1. 如果 d 变大，q 和 k 点积的方差会变大。
2. 方差变大会导致向量之间元素的差值变大。
3. 元素的差值变大会导致 softmax 退化为 argmax, 也就是最大值 softmax 后的值为 1， 其他值则为0。
4. softmax 只有一个值为 1 的元素，其他都为 0 的话，反向传播的梯度会变为 0, 也就是所谓的梯度消失。

## 为什么是 $\sqrt{d}$

除以 $\sqrt{d}$ 之前，方差为：

$$
\begin{align*}
\text{Var}(S) &= \text{Var}\left(\sum_{i=1}^d q_i k_i\right) \\
&\overset{(1)}{=} \sum_{i=1}^d \text{Var}(q_i k_i) \\
&\overset{(2)}{=} \sum_{i=1}^d \left( \mathbb{E}[q_i^2 k_i^2] - \left(\mathbb{E}[q_i k_i]\right)^2 \right) \\
&\overset{(3)}{=} \sum_{i=1}^d \left( \mathbb{E}[q_i^2] \mathbb{E}[k_i^2] - \left(\mathbb{E}[q_i]\mathbb{E}[k_i]\right)^2 \right) \\
&\overset{(4)}{=} \sum_{i=1}^d \left( \left(\text{Var}(q_i) + \mathbb{E}[q_i]^2\right) \left(\text{Var}(k_i) + \mathbb{E}[k_i]^2\right) - \left(0 \cdot 0\right)^2 \right) \\
&\overset{(5)}{=} \sum_{i=1}^d \left( \left(1 + 0\right) \left(1 + 0\right) - 0 \right) \\
&= \sum_{i=1}^d 1 \\
&= d
\end{align*}
$$

除以 $\sqrt{d}$ 之后，方差为：

$$
\begin{align*}
\text{Var}\left(S'\right) &= \text{Var}\left(\frac{S}{\sqrt{d}}\right) \\
&= \left(\frac{1}{\sqrt{d}}\right)^2 \text{Var}(S) \\
&\overset{\text{Var}(S)=d}{=} \frac{1}{d} \cdot d \\
&= 1
\end{align*}
$$

因此就是将 QK 的点积结果归一化成了一个 **均值为0，方差为1** 的向量

# 相关问题

- [[Q-K-V-and-Multi-Head-Attention-Mechanism-Analysis|如何理解QKV]]
- [[qkv-difference-encoder-decoder-transformer|QKV在Encoder和Decoder部分有什么不同]]
