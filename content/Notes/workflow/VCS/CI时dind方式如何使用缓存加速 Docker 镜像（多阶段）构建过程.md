---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 为什么没有缓存？

GitLab CI 中 Docker-in-Docker (dind) 的工作模式：

1. **隔离的环境**：当你的 CI Job 启动时，GitLab Runner 会创建两个独立的容器：
    - **Job 容器**：基于你指定的 `image: docker:latest`，运行你的 `script` 命令。这是 Docker 的**客户端**。
    - **Service 容器**：基于 `docker:dind` 镜像，它在后台运行一个独立的 Docker 守护进程。这是 Docker 的**服务端**。
2. **独立的存储**： Job 容器通过网络 (`DOCKER_HOST: tcp://docker:2375`) 连接到 `dind` 服务容器。你执行的`docker build`、`docker pull`等所有命令，实际上都是由这个 `dind` 服务容器来处理的。所有拉取下来的镜像层（image layers），都存储在 `dind` 服务容器**内部的文件系统里**（通常是 `/var/lib/docker` 目录）。
3. **Job 结束后销毁**：GitLab CI 的核心原则之一是**环境隔离和可重复性**。当你的 Job（无论成功或失败）结束后，Job 容器和它关联的 `dind` 服务容器都会被**彻底销毁**。

**结论就是：** `dind` 服务容器以及它内部缓存的所有 Docker 镜像层，都是**临时的**。下次 Pipeline 运行时，会创建一个全新的、干净的 `dind` 服务容器，它没有任何历史缓存，因此必须从头开始重新拉取所有基础镜像。

# 如何实现缓存

> [!important] 思路就是借助 docker 的 `--cache-from` 参数。

举例：

```bash
export HARBOR_IMAGE=xxxx:latest
# || true 避免没有镜像的时候出错
docker pull $HARBOR_IMAGE || true
docker build --cache-from $HARBOR_IMAGE -f xx -t $HARBOR_IMAGE .
```

多阶段构建举例：

```bash
# 将 builder 镜像拉下来，用作多阶段构建中第一阶段的缓存使用
docker pull $HARBOR:builder || true
# 进行第一阶段构建，产出 builder 镜像，用作下一次的缓存
docker build --target builder --cache-from $HARBOR:builder -t $HARBOR:builder -f _ci/Dockerfile .
# 将 latest 镜像拉下来，用作第二阶段的构建的缓存，根据 Dockerfile 实际情况判断是否需要这一步优化
docker pull $HARBOR:latest || true
# 开始实际的构建
docker build --cache-from $HARBOR:builder --cache-from $HARBOR:latest -f _ci/Dockerfile -t $HARBOR:$CI_COMMIT_SHORT_SHA .
docker push $HAROR:$CI_COMMIT_SHORT_SHA
# 上传这一次生成的 builder 镜像
docker push $HARBOR:builder
```

# 参考

1. [https://blog.csdn.net/xs20691718/article/details/122719409](https://blog.csdn.net/xs20691718/article/details/122719409)