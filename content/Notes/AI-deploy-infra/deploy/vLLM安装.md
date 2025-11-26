---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# 配置

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926180726268.png)

# 安装

[]()

## 只开发 python 代码的安装方式

```shellscript
conda create -n vllm python=3.12 -y
conda activate vllm
git clone https://github.com/vllm-project/vllm.git
cd vllm
VLLM_USE_PRECOMPILED=1 pip install --editable .
```

### 问题

- [https://github.com/vllm-project/vllm/issues/10300](https://github.com/vllm-project/vllm/issues/10300)
    
    ```shellscript
    export LD_LIBRARY_PATH=/path/to/anaconda3/envs/vllm/lib/python3.12/site-packages/nvidia/nvjitlink/lib:$LD_LIBRARY_PATH
    ```

## 开发 C++ 和 CUDA 代码的安装方式

```shellscript
conda create -n vllm python=3.12 -y
conda activate vllm
git clone https://github.com/vllm-project/vllm.git
cd vllm
pip install --editable .
```