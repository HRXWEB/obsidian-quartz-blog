---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 5:39:17 pm
---

> [!important] 前提： [[vLLM安装]]

# 断点调试

[https://www.bilibili.com/video/BV1xbypYtEu2?t=2860.2](https://www.bilibili.com/video/BV1xbypYtEu2?t=2860.2)

# 跑用例

## 离线用例

```Shell
conda activate vllm
python examples/offline_inference/basic.py
```

## server 用例

```Shell
[optional] export HF_HUB_OFFLINE=1
[optional] export CUDA_VISIBLE_DEVICES=1
vllm serve Qwen/Qwen2.5-1.5B-Instruct --port <port> --trust_remote_code
curl http://localhost:8000/v1/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "Qwen/Qwen2.5-1.5B-Instruct",
        "prompt": "San Francisco is a",
        "max_tokens": 7,
        "temperature": 0
    }'
```