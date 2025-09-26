---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 5:24:04 pm
---

Perplexity 是一个统计学概念，常用于自然语言处理领域，特别是评估语言模型的表现。简单来说，perplexity 衡量了模型对新数据的预测能力。它的值越低（困惑度越低），说明模型对新数据的预测效果越好。

需要注意的是，不同模型之间的 perplexity 值不能直接比较，尤其是当它们使用的分词器（tokenizer）不同时。此外，微调（finetuning）通常会导致 perplexity 值升高，尽管人类评分的质量可能会增加。这是因为微调后的模型更专注于特定任务，因此在通用性的测试上表现不如原始模型好。

## 数学解释

> [!info] Perplexity of fixed-length models  
> We’re on a journey to advance and democratize artificial intelligence through open source and open science.  
> [https://huggingface.co/docs/transformers/perplexity](https://huggingface.co/docs/transformers/perplexity)