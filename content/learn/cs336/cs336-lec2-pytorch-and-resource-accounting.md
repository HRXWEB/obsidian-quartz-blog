---
title:
draft: true
aliases: []
tags: []
created: 2025-10-13T16:24:23.2323+08:00
updated: 2025-10-16T22:21:45.4545+08:00
---

# tensor 内存计算

- fp32
	![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251016213246502.png)

- fp16
	![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251016213257529.png)

- bf16@GoogleBrain
	![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251016213309654.png)
- [fp8](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/examples/fp8_primer.html)
	![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251016213549653.png)

fraction 影响的小数点精度、exponent影响的是表示范围。因为模型精度不会受小数点影响太大，毕竟还有量化这种更容易损失精度的操作，所以 Google Brain 才开发了 bf16（相对于 fp16 表示范围更大）

# tensor 计算

- einops 计算：
	- einsum
	- reduce
	- rearrange

# FLOPs/计算量

> [!Question] How long would it take to train a 70B parameter model on 15T tokens on 1024 H100s?
> ```python
> total_flops = 6 * 70e9 * 15e12
> assert h100_flop_per_sec == 1979e12 / 2
> mfu = 0.5
> flops_per_day = h100_flop_per_sec * mfu * 1024 * 60 * 60 * 24
> days = total_flops / flops_per_day
> ```

## 前向传播

比较最大的就是矩阵乘 MatMul，所以只需要算矩阵乘的计算量就可以估算整个模型的计算量的量级。

$M[B, D] @ N[D, K]$ 的计算量为 $2 * B *  D * K$，解释：

- $B * D * K$ 是因为三层 for 循环
- 2 是一次乘法和一次加法

典型 Op 计算量：

| Op          | FLOPs             |
| ----------- | ----------------- |
| MatMul      | $O(2 \times n^3)$ |
| Elementwise | $O(n^2)$          |
| Addition    | $O(n^2)$          |

## 反向传播（计算 gradient）

**核心观点：梯度传导是操作 (Operation) 的一部分**

在深度学习的视角中，计算图由一系列**操作（Ops）**组成。假设模型中的操作是：

$H2_​=H_1​@W_2​$

这个矩阵乘法操作 $f(H_1​,W_2​)=H_1​W_2​$ 有两个输入 $(H_1​,W_2​)$ 和一个输出 $(H_2​)$。

当进行反向传播时，**操作 f** 必须完成两项主要的任务：

1. **计算对参数的梯度：** $W_2.\text{grad}[j, k] = \sum_{i=1}^{B} H_1[i, j] \times H_2.\text{grad}[i, k]$
    
2. **计算对输入的梯度：** $H_1.\text{grad}[i, j] = \sum_{k=1}^{K} H_2.\text{grad}[i, k] \times W_2[j, k]$​​（并将此梯度传导给图中的前一个操作）

因此，对于**矩阵乘法 $H_1​@W_2$​ 这个操作**而言，它的“反向计算”**天然地**包括了计算 $\frac{​∂loss}{∂W_2}$​ 和 $\frac{​∂loss}{∂H1}$​。

| 步骤     | 计算目标   | 线性代数形式 (PyTorch)   | FLOPs 数量 | 计入对象          |
| ------ | ------ | ------------------ | -------- | ------------- |
| **1.** | W2​ 梯度 | $H_1^T​@H_2​.grad$ | 2⋅B⋅D⋅K  | **W2​ 参数**    |
| **2.** | H1​ 梯度 | $H_2​.grad@W_2^T$​ | 2⋅B⋅D⋅K  | **W2​ 所在的操作** |

所以一个矩阵乘操作反向计算贡献了 $O(4 \times n^3)$ FLOPs

**因此一个矩阵乘的计算量为 $O(6 \times N^3)$**

## MFU（Model FLOPs utilization）

实际 FLOP/s 能达到显卡承诺的 FLOP/s 的 50 % 左右，即 $mfu = 0.5$

# Optimizer

- momentum = SGD + exponential averaging of grad
- AdaGrad = SGD + averaging by grad^2
- RMSProp = AdaGrad + exponentially averaging of grad^2
- Adam = RMSProp + momentum
