---
title: FFN 在 transformer 中的作用
draft: true
aliases: []
tags: []
created: 2025-10-20T17:56:50.5050+08:00
updated: 2025-10-20T18:06:04.044+08:00
---

# 公式

$$
\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2
$$

思考角度：

- MLP 的作用
- 特征的升维和降维
- 归纳偏置，各向异性

# 1. MLP

MLP 的 relu(或者其他的activation) 会带来非线性

# 2. 特征维度变化

FNN 可以看作用 1x1 的卷积核来进行特征的升维和降维

# 3. 各向异性

？
