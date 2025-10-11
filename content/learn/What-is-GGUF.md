---
title: 什么是 gguf
draft: 
aliases: []
tags: []
created: 2025-10-10T18:26:05.055+08:00
updated: 2025-10-11T15:40:22.2222+08:00
date:
url: https://www.shepbryan.com/blog/what-is-gguf
---

本文基本是上面所贴链接文章的备份，如侵权请[联系我](rxhuang1014@gmail.com)删除。

---

## 历史

GGUF 全称 GPT-Generated Unified Format，其前身是 GGML(GPT-Generated Model Language)

GGML 是一个专为 ML 设计的 Tensor 库，旨在有一个单文件（Single File Sharing）的格式并且易于在不同架构的 GPU 和 CPU 上 inference。但是后来在发展上遇到了灵活性不足，兼容性和难以维护的问题，逐渐被 GGUF 替代

## What is GGUF@[ggergnaov](https://github.com/ggerganov)

：用于高效存储和部署 LLM 的文件格式

## LLM 生态的问题和 GGUF 的贡献

1. Efficiency: GGUF 使 LLMs 更加紧凑、加载速度更快。解决本地部署在存储空间和RAM上的限制
2. Compatibility: GGUF 跨平台、跨设备
3. Local Deployment: GGUF 使之更容器
4. Customization: GGUF 让用户可以轻松微调和修改模型，包括：调整参数、添加自定义 token。

## 量化

GGUF 支持不同等级的量化。量化等级从 Q2～Q8，还有一些变体，类似 Q3_K_M、Q5_K_S。

数字越大，需要的内存越多，模型性能衰减较少。

## Key Points

1. Purpose: 借助高级压缩技术和流水线格式结构（streamlined format structure），优化 LLMs 的存储和部署
2. Compatibility:
    1. 跨平台
    2. 提供很多脚本将其他格式的模型转为 GGUF
3. Advantages:
    1. 体积小
    2. 加载快
    3. 跨设备跨平台
    4. 原生支持多个量化等级
4. Popular Models: LLAMA 系列，AI 社区也积极支持
5. Ecosystem:
    1. 越来越多的工具和库支持 GGUF
    2. 社区活跃，
    3. 持续不断的改进 format

## 参考

1. [https://medium.com/@NeroHin/%E5%B0%87-huggingface-%E6%A0%BC%E5%BC%8F%E6%A8%A1%E5%BC%8F%E8%BD%89%E6%8F%9B%E7%82%BA-gguf-%E4%BB%A5inx-text-bailong-instruct-7b-%E7%82%BA%E4%BE%8B-a2cfdd892cbc](https://medium.com/@NeroHin/%E5%B0%87-huggingface-%E6%A0%BC%E5%BC%8F%E6%A8%A1%E5%BC%8F%E8%BD%89%E6%8F%9B%E7%82%BA-gguf-%E4%BB%A5inx-text-bailong-instruct-7b-%E7%82%BA%E4%BE%8B-a2cfdd892cbc)
2. [https://huggingface.co/blog/zh/introduction-to-ggml](https://huggingface.co/blog/zh/introduction-to-ggml)
3. [https://www.shepbryan.com/blog/what-is-gguf](https://www.shepbryan.com/blog/what-is-gguf)