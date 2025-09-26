---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:30 pm
updated: Friday, September 26th 2025, 5:26:27 pm
---

# One Line Description

索引操作

# 描述

`Gather` 操作符非常灵活，其索引方式主要由 `indices` 张量的形状和 `axis` 属性共同决定。

**核心输入：**

- `data`: 被索引的源数据张量。
- `indices`: 包含索引值的张量，类型通常为整数（`int32` 或 `int64`）。
- `axis`: 指定沿着哪个轴进行索引，默认为 0。

## 支持的索引类型

**a) 单个元素索引 (标量** `**indices**`**)**

这是最简单的形式，`indices` 是一个标量（0维张量），表示只取一个切片。

- **例子**：从一个形状为 `(3, 4)` 的2D张量中，沿着 `axis=0`（行）取出索引为 `1` 的那一行。
    - `data` shape: `(3, 4)`
    - `indices`: `1` (标量)
    - `axis`: `0`
    - `**output**` **shape**: `(4,)` (原来的第0维被“压”掉了)

**b) 一维列表索引 (1D** `**indices**`**)**

`indices` 是一个一维向量，可以同时取出多个切片。

- **例子**：从一个形状为 `(5, 10, 20)` 的3D张量中，沿着 `axis=1` 取出索引为 `2` 和 `4` 的两个切片。
    - `data` shape: `(5, 10, 20)`
    - `indices`: `[2, 4]` (1D张量)
    - `axis`: `1`
    - `**output**` **shape**: `(5, 2, 20)` (原来的第1维大小10，被索引的2个元素替代了，所以变为2)

**c) 多维张量索引**

这是 `Gather` 最强大的功能。`indices` 可以是任意维度的张量，输出的形状会相应地改变。输出形状的计算规则是： `output_shape = data_shape[:axis] + indices_shape + data_shape[axis+1:]`

- **例子**：这个功能常用于批量处理词嵌入（Word Embedding）。
    - 假设我们有一个词汇表 `data`，形状为 `(50000, 128)` (5万个词，每个词128维)。
    - 我们有一个批次的句子 `indices`，形状为 `(16, 10)` (16个句子，每个句子10个词的ID)。
    - `axis`: `0`
    - 我们想为这批句子中的每个词都查到对应的词向量。
    - `**output**` **shape**: `(16, 10, 128)`。`data_shape[:0]` 为空，`indices_shape` 是 `(16, 10)`，`data_shape[1:]`是 `(128)`。

**d) 批量索引 (使用** `**batch_dims**` **属性)**

这是一个更高级的属性，用于更复杂的批量索引。`batch_dims` 指定 `data` 和 `indices` 的前N个维度是“批次维度”，`Gather` 操作会在这些维度上独立进行。

- **例子**：
    - `data` shape: `(4, 5, 6)`
    - `indices` shape: `(4, 2)` (注意，第一个维度都是4)
    - `axis`: `1`
    - `batch_dims`: `1`
    - **操作解释**：这相当于把 `data` 和 `indices` 都看作是有4个批次。对第0个批次，用 `indices[0]` 去索引 `data[0]`；对第1个批次，用 `indices[1]` 去索引 `data[1]`，依此类推。
    - `**output**` **shape**: `(4, 2, 6)`