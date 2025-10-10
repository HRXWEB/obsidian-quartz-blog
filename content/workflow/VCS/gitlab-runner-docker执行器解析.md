---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```TOML
$ sudo gitlab-runner register --help | grep "docker.*cpus"
Runtime platform                                    arch=amd64 os=linux pid=1976437 revision=3153ccc6 version=17.7.0
   --docker-cpuset-cpus value                                                                 String value containing the cgroups CpusetCpus to use [$DOCKER_CPUSET_CPUS]
   --docker-cpuset-mems value                                                                 String value containing the cgroups CpusetMems to use [$DOCKER_CPUSET_MEMS]
   --docker-cpus value                                                                        Number of CPUs [$DOCKER_CPUS]
   --docker-service-cpuset-cpus value                                                         String value containing the cgroups CpusetCpus to use for service [$DOCKER_SERVICE_CPUSET_CPUS]
   --docker-service-cpus value                                                                Number of CPUs for service [$DOCKER_SERVICE_CPUS]
```

可以看到 cpus 分为 ==`**--docker-cpus**`== ==**和**== ==`**--docker-service-cpus**`==

这个设计是为什么呢？

---

# 原因

在 Docker 执行器的工作模式下，一个 Job 通常会启动两种不同角色的容器：

1. **作业容器 (Job Container)**: 这是由 `.gitlab-ci.yml` 中的 `image:` 定义的容器。它的主要任务是执行 `script:`里的命令，是 CI/CD 流程中的“主角”和“工作者”。它可能会进行编译、打包、测试等消耗大量 CPU 的计算密集型任务。
2. **服务容器 (Service Container)**: 这是由 `.gitlab-ci.yml` 中的 `services:` 列表定义的容器。例如 `docker:dind`、`postgres:latest` 或 `redis`。它的主要任务是为作业容器提供其所依赖的“背景服务”或“基础设施”，比如提供数据库、缓存或者一个 Docker 环境。通常情况下，这些服务在 Job 运行期间处于“待命”状态，其自身的 CPU 消耗相对稳定且较低（除非作业容器正在对其进行高强度的压测）。

# 为什么要区分？

区分 `docker-cpus` 和 `docker-service-cpus` 的主要原因，就是为了实现**更精细化和更高效的资源分配**。

1. **资源需求不对等**: 作业容器和背景服务容器的资源消耗模式完全不同。作业容器的 CPU 使用可能是短暂的、脉冲式的、峰值很高的（比如在编译 C++ 项目时）；而一个数据库服务容器的 CPU 使用则相对平缓，只在响应查询时才有消耗。如果不加区分，用同一个标准来限制它们，就会产生问题：
    - 如果标准设得很高（为了满足作业容器），那么服务容器就会被分配过多它根本用不上的 CPU 资源，造成宿主机资源浪费。
    - 如果标准设得很低（为了节约服务容器的资源），那么作业容器在执行计算密集型任务时会因为 CPU 资源不足而变得极其缓慢，甚至超时失败。
2. **提高 Runner 并发和稳定性**: 通过分别设置，系统管理员可以对资源进行更合理的规划。例如，在一台有 16 核 CPU 的宿主机上，管理员可以做出这样的决策：
    - 为每个**作业容器**分配较多的 CPU，比如 `-docker-cpus="4"`（允许它最多使用 4 个 CPU 核心）。
    - 为每个**服务容器**分配较少的 CPU，比如 `-docker-service-cpus="1"`（限制它最多使用 1 个 CPU 核心）。
    - 这样一来，一个包含 1 个作业容器和 2 个服务容器的 Job，总共会消耗 `4 + 1 + 1 = 6` 个 CPU 核心。这使得管理员可以更准确地计算出 Runner 的 `concurrent` 值，让多个 Job 在同一台宿主机上运行时，既能保证作业容器有足够的计算能力，又能防止所有容器（尤其是那些“次要的”服务容器）无节制地抢占 CPU 资源，从而避免系统过载，提高整体的稳定性和吞吐量。