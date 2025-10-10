---
title: 
draft: 
aliases: []
tags: []
URL: https://github.com/vllm-project/vllm
URL-2: https://docs.vllm.ai/en/latest/index.html
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# 特点

## 快速

- top级别的服务吞吐量
- 使用 PagedAttention 做高效 KV Cache 内存管理，提高显存利用率。PagedAttention 类似于虚拟内存，==连续的逻辑== KV Cache block 映射到 ==非连续的物理== KV Cache block
    - [https://www.bilibili.com/video/BV1kx4y1x7bu/?spm_id_from=333.1007.top_right_bar_window_history.content.click&vd_source=a7368c6184a1b162acff7bf0efed19b2](https://www.bilibili.com/video/BV1kx4y1x7bu/?spm_id_from=333.1007.top_right_bar_window_history.content.click&vd_source=a7368c6184a1b162acff7bf0efed19b2)
    - [https://blog.vllm.ai/2023/06/20/vllm.html](https://blog.vllm.ai/2023/06/20/vllm.html)
- Continuous Batching：动态 batching，推理完的 sequence 显存立马释放
    - [https://www.bilibili.com/video/BV169sxeFEEr?spm_id_from=333.788.videopod.episodes&vd_source=a7368c6184a1b162acff7bf0efed19b2&p=4](https://www.bilibili.com/video/BV169sxeFEEr?spm_id_from=333.788.videopod.episodes&vd_source=a7368c6184a1b162acff7bf0efed19b2&p=4)
    - [https://www.anyscale.com/blog/continuous-batching-llm-inference](https://www.anyscale.com/blog/continuous-batching-llm-inference)
- _**利用 CUDA/HIP graph 做快速模型推理**_
- 量化：GPTQ、AWQ、INT4、INT8，FP8
- 优化 cuda kernel，利用 FlashAttention 和 FlashInfer
- _**Speculative decoding**_
- chunked prefill：对句子进行切片，提供并行度，加速推理。

## 灵活易用：

- 无缝集成 hugging face models
- 通过不同的 decode 算法提供高吞吐量服务：parallel sampling, beam search and more
- 分布式推理：TP（Tensor Parallelism）、PP（Pipeline Parallelism）
- 流式输出（Streaming Output）
- 兼容 openai api
- 多种硬件平台：Nvidia GPUs、AMD CPUs + GPUs、Intel CPUs、TPU and more
- _**Prefix caching support**_
- _**Multi-lora suppor**_

---

# 学习笔记

[[vLLM核心优化技术]]

[[TBD—大模型推理服务框架vLLM]]

# 实操&开发

[[vLLM安装]]

[[vLLM-QuickStart]]

[[vLLM粗读]]

# 讨论会

[[vLLM-Beijing-Meetup]]