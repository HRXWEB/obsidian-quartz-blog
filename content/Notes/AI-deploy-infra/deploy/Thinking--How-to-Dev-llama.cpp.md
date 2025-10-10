---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

## 有可能的实现

1. 既然有 CANN 作为backend，开发开发 NRT backend 嘛？
    
    1. ggml 项目和 [gguf](https://huggingface.co/docs/hub/gguf) 的关系

2. TMAC 技术要掌握
3. 模型很有可能会进行修改，如何评估模型，并且尽可能的流程化。在微调的情况下，perplexity很有可能会上升。
4. 通过RPC实现分布式推理？[https://github.com/users/ggerganov/projects/10](https://github.com/users/ggerganov/projects/10)

## 相关的技术

1. llama2 模型结构
    1. [https://github.com/ggerganov/llama.cpp/wiki/GGML-Tips-%26-Tricks](https://github.com/ggerganov/llama.cpp/wiki/GGML-Tips-%26-Tricks)
2. T-MAC
    1. [https://www.arxiv.org/pdf/2407.00088](https://www.arxiv.org/pdf/2407.00088)
    2. [https://github.com/microsoft/T-MAC](https://github.com/microsoft/T-MAC)
    3. [https://finance.sina.cn/tech/2024-08-13/detail-incipmaa8358517.d.html?fromtech=1&oid=%E8%B0%B7%E6%AD%8C%E5%A4%96%E6%8E%A8%E6%94%B6%E5%BD%95%E3%80%90%E7%94%B5%E6%8A%A5e10838%E3%80%91google%E6%94%B6%E5%BD%95%E4%BC%98%E5%8C%96.dsg.0614&vt=4](https://finance.sina.cn/tech/2024-08-13/detail-incipmaa8358517.d.html?fromtech=1&oid=%E8%B0%B7%E6%AD%8C%E5%A4%96%E6%8E%A8%E6%94%B6%E5%BD%95%E3%80%90%E7%94%B5%E6%8A%A5e10838%E3%80%91google%E6%94%B6%E5%BD%95%E4%BC%98%E5%8C%96.dsg.0614&vt=4)
3. speculative decode [https://github.com/ggerganov/llama.cpp/commit/9ca2e677626fce759d5d95c407c03677b9c87a26](https://github.com/ggerganov/llama.cpp/commit/9ca2e677626fce759d5d95c407c03677b9c87a26)
4. cgraph 维护 node， backendcontext 负责推理 node，生产 tensor，以 CANN 为例

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926180656252.png)

5. 量化技术
6. Qwen 也可以用 llama.cpp 部署
    1. [https://qwen.readthedocs.io/zh-cn/stable/getting_started/quickstart.html](https://qwen.readthedocs.io/zh-cn/stable/getting_started/quickstart.html)