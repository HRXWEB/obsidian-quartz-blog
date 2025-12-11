---
title: 简单理解 CUDA graph
draft: 
aliases: []
tags: []
created: 2025-10-31T10:14:04.044+08:00
updated: 2025-10-31T10:47:01.011+08:00
---

# 概念&&作用

**概念**：NVIDIA CUDA 提供的一项优化技术：

- **捕获**：它允许将一系列 GPU 操作（如内存拷贝、内核执行）**一次性记录**下来，形成一个“图”。
- **回放**：这个图随后可以被重复高效地“回放”（replay）。

**作用**：减少了 CPU 和 GPU 之间反复通信的开销（即 **CPU Overhead**），显著提升了推理速度，特别是在生成单个 token (Decode Phase) 这种重复性高的任务中。

| **模式**                   | **传统 Eager Mode (即时执行)**                                                                                            | **CUDA Graph Mode (图模式)**                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **操作次数 (Kernel Launch)** | $N$ 个 GPU 操作 $\rightarrow$ $N$ 次 CPU-GPU 通信。                                                                        | $N$ 个 GPU 操作 $\rightarrow$ **1 次**CPU-GPU 通信 (捕获)。                                 |
| **执行流程**                 | **CPU：** 启动 $K_1$ $\rightarrow$ **GPU：** 执行 $K_1$$\rightarrow$ **CPU：** 启动 $K_2$ $\rightarrow$**GPU：** 执行 $K_2$ ... | **CPU：** 启动 **图回放 (Replay)**$\rightarrow$ **GPU：** 自动执行图中的所有 $K_1, K_2, ..., K_N$。 |
| **减少的开销**                | **每次**操作都有独立的 CPU Overhead。                                                                                         | **CPU Overhead 几乎被消除**，仅剩一次 Replay 的极低开销。                                          |

## CUDA Graph v.s. Piecewise Graph in LLM

LLM 前向计算时，主要的计算步骤可以分成 attention 和 非 attention 计算

|**特性**|**全图（Full Graph）**|**分段图（Piecewise Graph）**|
|---|---|---|
|**CUDA Graph 捕获范围**|捕获**整个**前向传播过程，包括所有层和 **Attention** 操作。|**分段捕获**，通常会**排除 Attention** 操作，只捕获 Attention 层前后的一系列普通运算。Attention 自身在图外以“Eager Mode”（即时执行）运行。|
|**优点**|理论上开销最小，速度最快。|兼容性高，因为它避开了那些不易或不支持 CUDA Graph 的操作（特别是 Attention）。|
|**缺点**|**兼容性差**，要求 Attention 后端必须支持 CUDA Graph。|性能提升不如全图极致，因为 Attention 运行在开销更大的 Eager 模式。|

[vLLM](https://docs.vllm.ai/en/latest/design/cuda_graphs.html) 的 cuda graph mode 是可配置的。

有时会排除 Attention 操作，原因是采用的 Attention Backend，如 FlashAttention (FA2, FA3) 和 FlashInfer 等不支持 CUDA graph 的捕获和回放，尤其是那些包含动态逻辑变化的优化（比如 FA2 中的 [[LLaMA2-Large-Language-Model-Architecture-Analysis|GQA]] 优化）