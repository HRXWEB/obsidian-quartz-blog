---
title:
draft: true
aliases: []
tags: []
created: 2025-10-16T22:24:01.011+08:00
updated: 2025-10-17T00:00:22.2222+08:00
---

# standard transformer

## 变体

- pre-norm instead of post-norm：激活值和梯度都更稳定，训练也就更稳定。
- RMSNorm instead of LayerNorm：效果上没有太大区别、但是 RMSNorm 通过**去除均值计算**，大大优化了**数据在内存和计算核心之间的移动和依赖关系**，从而节省了大量**运行时间**，缓解了仿存瓶颈。
	![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251016225144437.png)
- FFN 计算去掉偏置项 bias：训练更稳定
- 各种 \*GLU、ReLU 等激活函数
- 并行计算 MLP 和 MHA(multi-head attention): $output = x + MLP(x) + MHA(x)$

# Hyperparameters

- $dim_{feedforward} = （4\ or\ 2.66） \cdot dim_{models}$
- 纵横比：模型深度比宽度（100-200）
- vocab size：100k-250k
- dropout = 0.1
- 正则化 weight decay = 0.1 

# stability training tricks

- softmax 