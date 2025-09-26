---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 5:30:52 pm
---

# 简单使用

# 深入了解 Usage 过程

其实就一行命令就跑起来了：

```Bash
python tools/run_pipeline.py -o `pwd`/models -q int_n
```

见闻知意，pipeline 是一系列有顺序的处理过程，这些过程包括：

- **compile kernel**：利用 TVM 生成 GEMM 计算 kernel，包含 `kernels.h`, `kernels.cc`, `kcfg.ini`
- **t-mac cmake configure**：生成 cmake 相关配置
- **t-mac cmake build**：编译安装 `kernels.h`, `kernels.cc`, `kcfg.ini` 并且生成 `TMACConfig.cmake` 方便 `ggml` 找到
- **converf hf to gguf**：将 `huggingface` 模型转成 `[[What is GGUF]]`[[What-is-GGUF]]
- **llama.cpp cmake configure**：生成 cmake 相关配置，打开 t-mac 选项，此时 ggml 计算引擎就可以支持 t-mac 后端
- **llama.cpp cmake build**：编译 `llama-cli`
- **run inference**：执行推理

## 。。。

## llama.cpp cmake configure

关键在于：

```Plain
add_library(ggml
            ../include/ggml.h
            ../include/ggml-alloc.h
            ../include/ggml-backend.h
            ggml.c
            ggml-alloc.c
            ggml-backend.cpp
            ggml-quants.c
            ggml-quants.h
            ${GGML_SOURCES_CUDA}      ${GGML_HEADERS_CUDA}
            ${GGML_SOURCES_METAL}     ${GGML_HEADERS_METAL}
            ${GGML_SOURCES_RPC}       ${GGML_HEADERS_RPC}
            ${GGML_SOURCES_EXTRA}     ${GGML_HEADERS_EXTRA}
            ${GGML_SOURCES_SYCL}      ${GGML_HEADERS_SYCL}
            ${GGML_SOURCES_KOMPUTE}   ${GGML_HEADERS_KOMPUTE}
            ${GGML_SOURCES_VULKAN}    ${GGML_HEADERS_VULKAN}
            ${GGML_SOURCES_ROCM}      ${GGML_HEADERS_ROCM}
            ${GGML_SOURCES_BLAS}      ${GGML_HEADERS_BLAS}
            ${GGML_SOURCES_LLAMAFILE} ${GGML_HEADERS_LLAMAFILE}
            ${GGML_SOURCES_CANN}      ${GGML_HEADERS_CANN}
            ${GGML_SOURCES_TMAC}      ${GGML_HEADERS_TMAC}
            ggml-aarch64.c            ggml-aarch64.h
            )
```

`**${GGML_SOURCES_TMAC}**` 和 `**${GGML_HEADERS_TMAC}**` 增加了 t-mac 后端，二者分别是 `compile kernel` 阶段生成的： `kernels.cc` 和 `kernels.h`