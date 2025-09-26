---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:11:39 am
---

# 现象

daemon 没有启动。

# 原因

可能是 services 字段有配置，但是 extends，anchor 等操作把它给覆写了。

```YAML
  services:
    - name: docker:dind
      alias: docker
      # command 是 dind 服务容器的启动命令
      # 我们在这里为 Docker 守护进程添加入参，以信任你的私有 Harbor 仓库
      command: ["--insecure-registry=192.168.3.224:8083"] # <-- 新增：配置 dind 服务以信任你的 Harbor
```