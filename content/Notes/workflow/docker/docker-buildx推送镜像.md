---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 举例

```Bash
docker buildx build --platform linux/amd64,linux/arm64 -t 192.168.3.224:8083/test/cross_compile_nsd:latest -t 192.168.3.224:8083/test/cross_compile_nsd:v1.0 --push -f dockerfile/nsd_docker/nsd.dockerfile .
```

- `--push` 推动镜像
- `-t` 多次指定tag