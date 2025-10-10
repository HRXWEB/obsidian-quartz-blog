---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# 编译

```Shell
# origin_llama 是官方的仓库，为了和 nova_llama 区分开
cd ~/Archive/nova/repos/origin_llama.cpp
# How to build：http://192.168.3.224:8081/nsd/openvla/llama.cpp/-/blob/master/docs/build.md
export DYLD_LIBRARY_PATH=`pwd`/cmake-build-release/install/lib
```

# 下载模型、转换、量化

```Shell
mkdir -p models/hf_models
# download
huggingface-cli download meta-llama/Meta-Llama-2-7B --include "original/*" --local-dir Meta-Llama-2-7B
# convert
cp ~/.cache/huggingface/hub/models--meta-llama--Llama-2-7b-hf/ ./models/hf_models
## 以下两种量化具体看看到底是哪一个，现在不确定是哪一个，llama2 应该用 legacy 这种形式：https://github.com/ggerganov/llama.cpp/discussions/7990
# quantize
python convert_hf_to_gguf.py --outfile llama2-7b-fp16.gguf --outtype f16 ./models/hf_models/llama-2-7b/
# quantize
python examples/convert_legacy_llama.py --outfile llama2-7b-fp16.gguf --outtype f16 ./models/hf_models/llama-2-7b/
```

# 推理

```Shell
cd ./cmake-build-release/install/bin
./llama-cli -m ../../../models/hf_models/llama-2-7b_hf/llama2-7b-Q4_K_M.gguf -p "I believe the meaning of life is" -n 128
```