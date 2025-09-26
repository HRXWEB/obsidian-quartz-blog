---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 6:07:36 pm
---

# 配置

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926180726268.png)

# 安装
[]()
## 只开发 python 代码的安装方式

```Shell
conda create -n vllm python=3.12 -y
conda activate vllm
git clone https://github.com/vllm-project/vllm.git
cd vllm
VLLM_USE_PRECOMPILED=1 pip install --editable .
```

### 问题

- [https://github.com/vllm-project/vllm/issues/10300](https://github.com/vllm-project/vllm/issues/10300)
    
    ```Shell
    export LD_LIBRARY_PATH=/path/to/anaconda3/envs/vllm/lib/python3.12/site-packages/nvidia/nvjitlink/lib:$LD_LIBRARY_PATH
    ```

## 开发 C++ 和 CUDA 代码的安装方式

```Shell
conda create -n vllm python=3.12 -y
conda activate vllm
git clone https://github.com/vllm-project/vllm.git
cd vllm
pip install --editable .
```