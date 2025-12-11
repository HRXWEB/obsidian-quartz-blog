---
title: 什么是检索增强生成
draft: true
aliases: []
tags: []
created: 2025-10-20T14:29:22.2222+08:00
updated: 2025-10-20T14:47:54.5454+08:00
---

RAG is Retrieval-augmented generator

# 开放域问答系统

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251020143128747.png)

<center>图源：[How to Build an Open-Domain Question Answering System? \| Lil'Log](https://lilianweng.github.io/posts/2020-10-29-odqa/)</center>

# 问题

## RAG 在实践中有哪些困难

- 数据质量和多样性问题：
	- 异构数据（PDF、HTML、docx）处理难度大
	- 知识离散化，相同主题分散于不同的文档
- 检索效果的瓶颈：
	- 低召回率和精度
	- 如果用户意图不明确，检索到的信息就不明确
	- 结合长文档多处信息，涉及多跳推理，效果不好
- 计算资源和效率：
	- 检索耗时
	- 检索和生成要设计和优化，实现高效率

## 现在的RAG还需要传统的倒排索引么

> [!NOTE] 前置知识
> - **倒排索引**：基于关键词匹配。擅长快速定位特定词汇或短语，高召回率和效率
> - **向量索引**：基于语义相似度。能够理解文档内容的深层含义

可以组合使用：基于倒排索引的稀疏索引 + 基于向量的稠密索引。

## 如何处理上下文的冲突

- 检索阶段：
	- 更细致切分：避免矛盾信息位于同一 chunk
	- 元数据管理：增加时间戳、来源、权威性等作为权重
	- 引入知识图谱：将知识结构化，避免矛盾信息处于同一级
- 重排阶段：
	- 基于相关性、信息一致性等信息排序，过滤低排名信息
- Generator：
	- 明确指定 LLM 识别矛盾信息并指出信源，其后采用更可靠的信源