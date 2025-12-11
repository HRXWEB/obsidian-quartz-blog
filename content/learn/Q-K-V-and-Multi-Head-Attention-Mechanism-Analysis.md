---
title: Q、K、V与多头注意力机制详解
draft: false
aliases: []
tags: []
created: 2025-10-10T18:26:05.055+08:00
updated: 2025-12-11T17:17:40.4040+08:00
date:
url: https://zhuanlan.zhihu.com/p/669027091
---

本文是上面所贴链接文章的备份，如侵权请 [联系我](rxhuang1014@gmail.com) 删除。

---

专栏：[https://zhuanlan.zhihu.com/p/669027091](https://zhuanlan.zhihu.com/p/669027091) 阅读笔记

# 祭出公式

$$
\begin{align*} \text{MultiHead}(Q, K, V) &= \text{Concat}(\text{head}_1, \dots, \text{head}_h)W^O \\ \text{where } \text{head}_i &= \text{Attention}(QW_i^Q, KW_i^K, VW_i^V) \\ (W_i^Q \in \mathbb{R}^{d_{\text{model}} \times d_k}, &\ W_i^K \in \mathbb{R}^{d_{\text{model}} \times d_k}, \ W_i^V \in \mathbb{R}^{d_{\text{model}} \times d_v}, \ W^O \in \mathbb{R}^{hd_v \times d_{\text{model}}}) \end{align*}
$$

最经典的配置中， $d_{model} = 512,\ d_k = d_v = d_{model} / h = 64,\ h = 8$

$d_v$ 可以不等于 $d_k,\ d_v$

# 图解过程

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175531838.png)

# 对过程的理解

- 计算过程中的 QKV 矩阵其实是同一个，都是 $X$。它表示 n 个 token，每个 token 由长度为 $d_{model}$ 的向量表示。
- 多头注意力是对输入 X 进行降维到 $d_{model}/h$
    - 这不是简单的将向量切割成 h 份。
    - 而是通过矩阵乘线性变换到低维空间，每个低维空间专注于某一个方面的表示。比如 ”猫“ 这个概念，它关联的概念有 “哺乳动物”、“宠物”等等。
- 图中的 $Z_i$ 就是 $X$ 经过 `Transformer` 之后的输出，每个 $Z_i$ 关注某个方面。
- 最后通过 $W^O$ 矩阵将 $Z_i$ 有机结合起来，并恢复到 $X$ 的原始尺寸。

# 计算过程矩阵维度变化

$$
\begin{align*}  
X &= (n, d_{model}) \\  
W_i^Q X => (d_{model}, d_k) * (n, d_{model}) &= (n, d_k) \\  
W_i^K X => (d_{model}, d_k) * (n, d_{model}) &= (n, d_k) \\  
QK^T => (n, d_k) * (d_k, n) &= (n,n) \\  
W_i^V X => (d_{model}, d_v) * (n, d_{model}) &= (n, d_v) \\  
softmax(\frac{QK^T}{\sqrt{d_k}}) \cdot V => (n,n) * (n, d_v) &= (n, d_v) \\  
concat(head_1,...head_n)W^O = (n, hd_v) * (hd_v, d_{model}) &= (n, d_{model})\quad \text{same as}\ X  
\end{align*}
$$

> 用一个公司中新进的一个员工来比喻“Self-Attention 自注意力机制”，这个新员工需要迅速地在全部成员之间做一遍工作岗位关联重要度的“Attention 注意力机制“的审查，以便自己能快速定位出自己在团队中的位置，找准自己的位置，接下来的业务与工作进展自然也会很流畅。
> 
> 其实，找准个人在团队中的定位，除了在业务流程上的考量外，还有很多==**其他的维度需要考量，比如职位的权重、性格匹配度、男女比例关系、前辈与新兵、人际关系**==等等等等。如果在这些不同的维度领域，都来一套“Attention 注意力机制”，这就叫“Multi-head Attention 多头注意力机制”了。如果说“Self-Attention 自注意力机制”是一个团队成功的基本必要条件，那么“Multi-head Attention 多头注意力机制”就是确保全团队最优协作的充分条件了。
> 
> 相信任何一个长时间在一起磨合的团队，都会有意无意地走完这个“Multi-head Attention 多头注意力机制”的过程。这个过程可能会很漫长，并伴随着公司中各种大大小小数不尽的事情，但每每经历过一些磨合之后，团队的协作能力就会进一步提高。而且这种磨合的重头戏往往不是只集中在业务流程上，而是在职位、性格、性别、前辈与新兵、人际关 []() 系等等方面的磨合上。因为业务流程是团队存在的必须的基础，而其他方面才是团队的升华。

# 参考

1. **[Q、K、V 与 Multi-Head Attention 多头注意力机制](https://zhuanlan.zhihu.com/p/669027091)**