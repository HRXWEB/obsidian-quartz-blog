---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:36:35 am
---

# 举例

```Bash
docker buildx build --platform linux/amd64,linux/arm64 -t 192.168.3.224:8083/test/cross_compile_nsd:latest -t 192.168.3.224:8083/test/cross_compile_nsd:v1.0 --push -f dockerfile/nsd_docker/nsd.dockerfile .
```

- `--push` 推动镜像
- `-t` 多次指定tag