---
title: 初识 PagedAttention
draft: true
aliases: []
tags: []
created: 2025-10-23T18:01:15.1515+08:00
updated: 2025-10-23T18:17:45.4545+08:00
---

> [!NOTE] 传统方法
> 为每个请求预留连续内存块，即使只生成一个 token 也会预留全部空间，导致大量浪费。

# 核心原理

PagedAttention 引入了类似于**操作系统内存管理**的机制：

1. **分块 (Blocking):** 将每个序列的 KV Cache 划分为固定大小的**逻辑块 (Logical Blocks)**。
2. **物理块 (Physical Blocks):** 在 GPU 显存中，KV Cache 的实际存储空间被划分为**物理块 (Physical Blocks)**。
3. **映射表 (Page Table):** 像操作系统一样，PagedAttention 为每个序列维护一个**页表**，将序列的**逻辑块**映射到 GPU 内存中**非连续的物理块**上。

# 优势

- **高效共享**：在使用 Beam Search 或者相同的 Prompt 进行多次推理时，可以在序列的分岔点之前共享的 KV Cache 块直接映射到相同的物理块上，避免数据拷贝。类似于前缀树 Trie
- **显存利用率**：显存碎片少，因此能够同时处理更多的请求，提高吞吐量。

# 带来的影响

- **内核修改：** 为了让注意力机制能够处理非连续存储的数据，GPU 的注意力计算 Kernel（如 FlashAttention 或其他优化的注意力 Kernel）需要被修改。
- **通过表间接访问：** 在计算新的 Query $Q_{new}$​ 与所有历史 $K$ 向量的 Attention Score 时，Kernel 不会直接访问一个连续的 $K$ 内存区域，而是：
    1. 查阅序列的**块表**，获取所有历史 $K$ 向量所在的**物理块地址**。
    2. 根据这些非连续的物理地址，高效地加载对应的 $K$ 和 $V$ 数据块到 SRAM 中进行计算。