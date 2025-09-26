---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 5:30:31 pm
---

# Installation

在 R1 上安装发现一定要在 conda 环境中安装，不能在 venv 环境。

另外如果系统 cmake 版本不满足要求的话，可以 `conda install cmake`

```Bash
brew install cmake zstd libomp
# Why export the two env varibales below, please refer to https://github.com/microsoft/T-MAC/issues/26\#issuecomment-2564980266
export LDFLAGS="-L/opt/homebrew/opt/libomp/lib"
export CPPFLAGS="-I/opt/homebrew/opt/libomp/include"
git clone --recursive https://github.com/microsoft/T-MAC.git
# in virtualenv
pip install -e . -v
source build/t-mac-envs.sh
```

# Usage

```Bash
cd T-MAC
mkdir models
pip install 3rdparty/llama.cpp/gguf-py
huggingface-cli download 1bitLLM/bitnet_b1_58-3B --local-dir ./models
python tools/run_pipeline.py -o `pwd`/models -q int_n
```