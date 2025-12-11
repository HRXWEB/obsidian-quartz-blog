---
title:
draft: true
aliases: []
tags: []
created: 2025-10-12T20:23:19.1919+08:00
updated: 2025-10-13T16:22:57.5757+08:00
---

[[Tokenizer-algo-BPE]]

# Overview

## 架构

### 原始 transformer 结构

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251012203555536.png)

### 最近几年的进展

- Activation functions: ReLU, SwiGLU [Shazeer 2020](https://arxiv.org/pdf/2002.05202.pdf)
- Positional encodings: sinusoidal, RoPE [Su+ 2021](https://arxiv.org/pdf/2104.09864.pdf)
- Normalization: LayerNorm, RMSNorm [Ba+ 2016](https://arxiv.org/pdf/1607.06450.pdf)[Zhang+ 2019](https://arxiv.org/abs/1910.07467)
- Placement of normalization: pre-norm versus post-norm [Xiong+ 2020](https://arxiv.org/pdf/2002.04745.pdf)
- MLP: dense, mixture of experts [Shazeer+ 2017](https://arxiv.org/pdf/1701.06538.pdf)
- Attention: full, sliding window, linear [Jiang+ 2023](https://arxiv.org/pdf/2310.06825.pdf)[Katharopoulos+ 2020](https://arxiv.org/abs/2006.16236)
- Lower-dimensional attention: group-query attention (GQA), multi-head latent attention (MLA) [Ainslie+ 2023](https://arxiv.org/pdf/2305.13245.pdf)[DeepSeek-AI+ 2024](https://arxiv.org/abs/2405.04434)
- State-space models: Hyena [Poli+ 2023](https://arxiv.org/abs/2302.10866)

## Training

- Optimizer (e.g., AdamW, Muon, SOAP) [Kingma+ 2014](https://arxiv.org/pdf/1412.6980.pdf)[Loshchilov+ 2017](https://arxiv.org/pdf/1711.05101.pdf)[Keller 2024](https://kellerjordan.github.io/posts/muon/)[Vyas+ 2024](https://arxiv.org/abs/2409.11321)
- Learning rate schedule (e.g., cosine, WSD) [Loshchilov+ 2016](https://arxiv.org/pdf/1608.03983.pdf)[Hu+ 2024](https://arxiv.org/pdf/2404.06395.pdf)
- Batch size (e..g, critical batch size) [McCandlish+ 2018](https://arxiv.org/pdf/1812.06162.pdf)
- Regularization (e.g., dropout, weight decay)
- Hyperparameters (number of heads, hidden dimension): grid search 

## Alignment

基础模型，如GPT，拥有的是填充下一个 token 的能力，想要让它实现不同的功能，比如翻译、coding、算数，需要进行对齐（alignment）：SFT、RLHF。

## Efficiency drives design decisions

当前的很多设计/做法都是基于效率的考量：

- **Data processing**: avoid wasting precious compute updating on bad / irrelevant data
- **Tokenization**: working with raw bytes is elegant, but compute-inefficient with today's model architectures.
- **Model architecture**: many changes motivated by reducing memory or FLOPs (e.g., sharing KV caches, sliding window attention)
- **Training**: we can get away with a single epoch!
- **Scaling laws**: use less compute on smaller models to do hyperparameter tuning
- **Alignment**: if tune model more to desired use cases, require smaller base models

# Tokenization

交互体验各种模型的 tokenizer 结果：[Tiktokenizer](https://tiktokenizer.vercel.app/?encoder=gpt2)

## Summary

- Tokenizer: strings <-> tokens (indices)
- Character-based, byte-based, word-based tokenization highly suboptimal
- BPE is an effective heuristic that looks at corpus statistics
- Tokenization is a necessary evil, maybe one day we'll just do it from bytes...