---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 现象

dind 的配置是：

```YAML
# 定义一个隐藏的模板，用于所有需要 Docker-in-Docker (dind) 的 jobs
.dind-template: &dind
  tags:
    - Algo_Docker67
  image: docker:latest
  services:
    - name: docker:dind
      alias: docker
      # command 是 dind 服务容器的启动命令
      # 我们在这里为 Docker 守护进程添加入参，以信任你的私有 Harbor 仓库
      command: ["--insecure-registry=192.168.3.224:8083"] # <-- 新增：配置 dind 服务以信任你的 Harbor
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
    DOCKER_DRIVER: overlay2
    # 你的 Harbor 仓库地址 (IP+端口)
    HARBOR_REGISTRY: "192.168.3.224:8083" # <-- 更新：你的 Harbor 仓库地址
    # 你的项目在 Harbor 中的路径
    HARBOR_PROJECT: "test" # <-- 更新：你的 Harbor 项目名称
```

后续触发了使用这个 dind 配置的 jobs 后报错

```Bash
ERROR: error during connect: Head "http://docker:2375/_ping": dial tcp: lookup docker on 114.114.114.114:53: no such host
ERROR: Job failed: exit code 1
```

# 原因

如果要使用 Docker-in-Docker，有两个关键的要求：

## 1. Runner 执行器 (Executor) 配置

必须使用能够创建容器的执行器。最常见的两种是：

- **Docker 执行器**: 这是最经典和直接的配置。Runner 会在宿主机上创建新的容器来执行作业。
- **Kubernetes 执行器**: 在 Kubernetes 集群中，Runner 会为每个作业动态创建 Pod。DinD 同样适用于此环境。

**不能**使用 `shell`, `virtualbox`, 或 `ssh` 这类执行器来实现标准的 DinD 服务模式。

## 2. **关键要求：特权模式 (Privileged Mode)**

==**这是使用 DinD 最核心、最不可或缺的要求。**==Docker-in-Docker 的原理是在一个 Docker 容器（作业容器）内部再运行一个独立的 Docker 守护进程。为了让这个“内部的”Docker 守护进程拥有管理和创建容器的权限（例如，操作网络、挂载文件系统），承载它的“外部”作业容器必须以 **特权模式** 启动。

---

经过分析后发现，gitlab-runner 注册的 Algo_Docker67 runner 没有开启 privileged

# 解决方法

## 针对 registered runner

编辑 gitlab-runner 的配置文件 `/etc/gitlab-runner/config.toml` 或者 `~/.gitlab-runner/config.toml`

```TOML
# /etc/gitlab-runner/config.toml

concurrent = 4
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "dind-runner"
  url = "https://gitlab.com/"
  token = "YOUR_RUNNER_TOKEN"
  executor = "docker"
  [runners.docker]
    tls_verify = false
    image = "docker:24.0" # 一个默认的镜像

    # --- 这是最关键的设置 ---
    privileged = true 
    # ------------------------

    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
```

## 针对还未 register 的 runner

register 命令中传入 `--docker-privileged` 参数

```TOML
sudo gitlab-runner register --docker-privileged --url http://192.168.3.224:8081/ --registration-token $REGISTRATION_TOKEN
```

# 参考资料

1. 描述了 `--docker-privileged` 参数：[https://datawookie.dev/blog/2021/03/install-gitlab-runner-with-docker/](https://datawookie.dev/blog/2021/03/install-gitlab-runner-with-docker/)
2. 评论区给出了上面这个资料的链接：[https://stackoverflow.com/a/78260315/22417742](https://stackoverflow.com/a/78260315/22417742)
3. [https://hub.docker.com/_/docker](https://hub.docker.com/_/docker)：

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112716131.png)
