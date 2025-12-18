---
title: 【深度解析】vLLM on TPU：统一 PyTorch & JAX 后端，LLM 推理性能再升级
draft: false
aliases: []
tags: []
created: 2025-10-24T12:49:21.2121+08:00
updated: 2025-12-11T15:33:49.4949+08:00
---

# 原文

[vLLM TPU：统一 PyTorch 与 JAX 的新一代 TPU 推理后端](https://mp.weixin.qq.com/s/f2c6pcOl8EMMkn5M7dhduw)

---

vLLM TPU 现在由 [tpu-inference](https://tpu.vllm.ai)  驱动——这是一个具有表现力且功能强大的新硬件插件，使 JAX 与 PyTorch 能够通过同一套算子下沉机制 (lowering path) 实现统一。

# 目标

1. 在开源中推动 TPU 硬件性能的极限。
2. 为 JAX 和 PyTorch 用户提供更多灵活性，**使得 PyTorch 的模型定义可在 TPU 上高效运行且无需额外改动，同时也为 JAX 提供原生支持。**
3. 保留 vLLM 的标准化：保持相同的用户体验、可观测性与接口。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251024125611724.png)

<center>图源水印</center>

# 性能飞跃

- 在 v6e-1 上，针对 Llama 3.1-8B 模型，吞吐量提升了 3.6 倍
- 在 v6e-8 上，针对 Llama 3.1-70B 模型提升了 2.1 倍

# 关键特性

## 统一的 PyTorch 与 JAX 后端

> [!NOTE] Note
> tpu-inference 通过 Torchax 支持 PyTorch，同时原生兼容 JAX，并在单一的 JAX -> XLA 下沉路径上完成统一

> [!quote] Quote
> vLLM TPU 现在将所有模型以 JAX 形式下沉。在无需更改模型代码（例如 llama.py）情况下，仅因为现在利用了 JAX 更成熟、高性能 primitives 生成然后由 XLA 编译的 HLO 图，就能大约获得 20% 的吞吐量提升。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251024130324560.png)

<center>图源水印</center>

> [!quote] Quote
> 现在，**vLLM TPU** 默认会优先运行在 **tpu-inference** 中经过 TPU 优化的模型代码；  
若该模型不存在相应实现，则会自动**回退（fallback）**至来自上游 **vLLM** 的 **PyTorch 模型代码**，并通过 **Torchax** 使用 **JAX** 路径进行下沉与编译。对大多数用户而言，这一切都是透明的实现细节。

Q：如果 Torchax 能够让 PyTorch 模型代码即刻在 TPU 上运行，而且仍然使用 JAX JIT 编译，为什么还要在 tpu-inference 中重写一些模型呢？难道这不是重复吗？  
A：vLLM 提供了一些经过重新实现的参考模型，旨在帮助开发者更快地上手 TPU 优化流程（详见代码仓库）。

## Ragged Paged Attention V3：开源环境下最灵活且高性能的 TPU 推理注意力算子

> [!NOTE] 基础
> - Ragged：通常用于描述一个多维数据结构的每一行的**长度不一致**
> 	- 传统 batching：要求一个批次中的所有输入序列长度**必须**相同，短序列会被填充，计算资源被浪费
> 	- Ragged Batching：将长度不一的序列组合到一个批次中进行处理，而不需要填充。只对实际的 token 进行计算，避免资源浪费
> - Pagged：通过类似操作系统“缺页”中断的形式，将逻辑上连续的 KV cache block 映射到非连续的 physical memory，维护一个逻辑 KV cache block 和 physical memory 映射关系表
> 	- 传统 self-attention：为每个序列预留一个长度的 buffer，用于存储 KV cache，对于较短的序列来说，浪费严重，造成严重的碎片化显存
> 	- Paged Attention：将 KV Cache 内存分成固定大小的“块”（Block），并允许这些块在显存中以**非连续**的方式存储。

Ragged Paged Attention 是对 “ragged” + “paged” 方案的具体实现，实现高效地处理这种**不规则的序列长度**和**不规则的 KV Cache 块排列**，并在一次批处理中计算所有序列。

更多 batching 技术介绍：[[introduction-to-LLM-batching-tech]]

V3 Update：

- 更多模型：
	- v2 只支持 head dim = 128 的模型规格
	- v3 支持任意模型配置、不同量化数据类型、任意张量并行 (TP) 策略
- 更高性能：
	- v2 执行时先调用 Attention kernel，然后再调用 Scatter Kernel 把 new KV cache 写入 cache block。二者之间要通过 global memory 同步数据，存在延迟问题
	- v3 将两个 kernel 融合，完全隐藏 scatter 延迟
- 部署灵活性：根据 decode 和 prefill 阶段的不同特性，调用具体的子核执行 attention 计算
	- Prefill-only 模式
	- Decode-only 模式
	- 混合批处理（mixed batch）模式
- 性能无妥协：在 **Trillium（v6e）** 上，其吞吐量较 RPA v2 **提升约 10%**

## 单程序多数据（SPMD）：vLLM TPU 的默认编程模型

> [!quote] Quote
> **vLLM TPU** 正式引入**单程序多数据（SPMD）** 作为默认编程模型。与此前沿用自 GPU 范式的多工作者模型（multi-worker model）不同，**SPMD 是 XLA 编译器的原生编程模式**。在该模型下，开发者只需针对一个统一的“大设备”编写程序，随后由 **XLA 编译器**自动完成**模型与张量的分片（partitioning）**，并智能插入通信操作，从而实现最优执行效率。
