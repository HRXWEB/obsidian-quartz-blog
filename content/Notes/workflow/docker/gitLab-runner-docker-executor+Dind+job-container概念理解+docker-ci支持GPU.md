---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 最终配置

```toml
# /etc/gitlab-runner/config.toml

[[runners]]
  # ... 其他配置，如 name, url, token ...
  executor = "docker"
  tags = "Algo_Docker67, other_tags" # 确保标签匹配
  [runners.docker]
    # ... 其他 docker 配置 ...

    # 参数一：注入 GPU 设备
    # 指示 Runner Executor 在调用宿主机 Docker Daemon 创建容器时，
    # 自动添加 --gpus all 标志。
    # 这会将第 1 层的 GPU 设备映射到第 3 层的容器中。
    gpus = "all"
    service_gpus = "all"

    # 参数二：赋予特权模式
    # 指示 Runner Executor 在创建容器时添加 --privileged 标志。
    # 对于第 3 层的 docker:dind 服务容器，这是必须的。
    # 它需要此权限来管理自己的网络栈、存储以及正确处理被映射进来的 GPU 设备，
    # 并将其再次暴露给第 4 层的容器。
    privileged = true
```

```yaml
# .gitlab-ci.yml
stages:
    - test
  
dind_gpu_test_job:
  stage: test
  tags:
    - Algo_Docker67
  image: docker:latest
  services:
    - name: ghcr.io/extrality/nvidia-dind:latest
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
    HTTP_PROXY: "http://192.168.3.242:2888"
    HTTPS_PROXY: "http://192.168.3.242:2888"
    NO_PROXY: "localhost,127.0.0.1,docker,192.168.0.0/16"
  script:
    - echo "Waiting for the DinD service to start..."
    - until docker info; do sleep 1; done
    - echo "DinD service is ready."

    - echo "Logging in to Harbor at $HARBOR_REGISTRY..."
    - echo $ROBOT_PAT | docker login $HARBOR_REGISTRY -u $ROBOT_USER --password-stdin
    - echo "Login successful"
    
    - echo "Now, attempting to run a new container WITH GPU access via DinD..."
    
    # 核心测试步骤：
    # 让 DinD 服务去启动一个带有 --gpus all 标志的 CUDA 容器
    # 如果 DinD 服务（在 Runner 层面）被成功赋予了 GPU 权限，这一步就能成功
    - docker run --rm --gpus all 192.168.3.224:8083/test/nvcr.io/nvidia/cuda:12.1.1-runtime-ubuntu22.04 nvidia-smi
    
    - echo "DinD GPU test finished."
    - echo "If the command above printed the GPU table, the DinD GPU pass-through is successful!"
```

---

如下一个典型的实例：

```yaml
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
    HTTP_PROXY: "http://192.168.3.242:2888"
    HTTPS_PROXY: "http://192.168.3.242:2888"
    NO_PROXY: "localhost,127.0.0.1,docker,192.168.0.0/16"
```

在这个 job 中，多个地方涉及到 docker image/container 相关的概念：

- 带有 Algo_Docker67 tag 的 gitlab runner 指定的 `executor` 是 `docker`
- services 是由 `docker:dind` 提供
- ci job 是在 `docker:latest` 镜像容器中执行

---

涉及到了好几层 Docker这几层的关系，可以用一个“套娃”的比喻来理解：

# GitLab CI 中 DinD 架构的四层技术解析

## 第 1 层: Runner 宿主机 (Host System)

- **身份**: 安装并运行 GitLab Runner 进程的物理机或虚拟机。
- **定义来源**: 基础设施层面。这是所有计算资源的物理来源，包括 CPU、内存、存储以及本例中最重要的 **NVIDIA 物理 GPU 设备**。
- **核心职责**:
    1. 提供基础操作系统环境。
    2. 运行 GitLab Runner 守护进程。
    3. 托管宿主机自身的 Docker Daemon (通常监听 `/var/run/docker.sock`)。
    4. 安装 NVIDIA 驱动和 `nvidia-container-toolkit`，使宿主机的 Docker Daemon 具备 GPU 容器化能力。
- **层级关系**: 位于最底层，是所有后续层级的执行环境和资源提供者。

## 第 2 层: GitLab Runner Docker 执行器 (Executor)

- **身份**: GitLab Runner 进程的一种特定工作模式，在你的场景中，由 `config.toml` 中 `executor = "docker"` 和 `tags = "Algo_Docker67"` 所定义。
- **定义来源**: GitLab Runner 的 `config.toml` 配置文件。
- **核心职责**:
    1. 轮询 GitLab 服务器获取 Job。
    2. 当接收到匹配 `Algo_Docker67` 标签的 Job 时，它作为**宿主机 Docker Daemon 的客户端**，负责创建和管理第 3 层容器的生命周期。
    3. 根据 `config.toml` 中的 `[runners.docker]` 配置，将宿主机资源**映射**给它所创建的容器。例如，`gpus = "all"` 会将 GPU 设备映射进去，`volumes` 会挂载卷，`privileged = true` 则会赋予容器特权。
- **层级关系**: 运行于第 1 层之上。它是第 3 层容器的**直接创建者和管理者**。它是资源从宿主机向 CI 环境传递的**关键关口**。

## 第 3 层: 作业容器 (Job Container) 与 服务容器 (Service Container)

这一层由两个由第 2 层创建的、生命周期相同的**兄弟容器 (sibling containers)** 组成。它们运行在由 Runner Executor 创建的同一个 Docker 网络中。

- **身份 A: 作业容器 (Job Container)**
    - **定义来源**: `.gitlab-ci.yml` 中的 `image: docker:latest`。
    - **核心职责**:
        1. 执行 `.gitlab-ci.yml` 中 `script:` 块内定义的命令序列。
        2. 它内部包含 **Docker 客户端 (CLI)**。
        3. 根据 `DOCKER_HOST` 环境变量 (`tcp://docker:2375`)，将其 Docker CLI 命令通过网络发送给 `docker:dind` 服务容器。
- **身份 B: 服务容器 (Service Container)**
    - **定义来源**: `.gitlab-ci.yml` 中的 `services: - name: docker:dind`。
    - **核心职责**:
        1. 运行一个独立的、与宿主机隔离的 **Docker 守护进程 (Daemon)**。
        2. 监听一个 TCP 端口 (`2375`)，接收并处理来自作业容器的 Docker API 请求。
        3. 根据 `command` 参数 (`-insecure-registry=...`) 进行初始化配置。
        4. 它负责**实际执行** Docker 命令，如 `docker build`, `docker run`，并创建第 4 层的容器。
- **层级关系**:
    - 两者均由第 2 层 (Runner Executor) 创建。
    - 第 2 层必须将 GPU 访问权限和特权模式传递给**服务容器 (`docker:dind`)**，因为它才是真正需要管理硬件设备的 Docker Daemon。
    - 作业容器通过网络与服务容器通信，形成 C/S (Client/Server) 架构。

## 第 4 层: DinD 管理的容器 (Dynamically Created Container)

- **身份**: 在 Job 执行期间，由 `script:` 中的 `docker run` 命令动态创建的容器。例如 `docker run --gpus all ...` 所启动的容器。
- **定义来源**: 作业容器（第 3 层）中执行的 `script:` 命令。
- **核心职责**: 运行最终的业务负载，例如AI训练、数据处理、单元测试等。这是**实际使用 GPU** 的环境。
- **层级关系**:
    - 它是**第 3 层服务容器 (`docker:dind`) 的子容器**。
    - 它的创建、资源分配和生命周期完全由第 3 层的 `docker:dind` 守护进程管理。
    - 它能否获得 GPU，完全取决于它的父进程（`docker:dind` 守护进程）是否拥有 GPU 的访问和分配权限。

## 总结与流程梳理

1. **资源流**: `物理 GPU (L1)` -> `Runner Executor 配置映射 (L2)` -> `docker:dind 服务容器获得设备访问权 (L3)` -> `dind 守护进程将 GPU 分配给子容器 (L4)`
2. **控制流**: `用户在 .gitlab-ci.yml 中定义 docker run (L3/Job)` -> `Job 容器中的 Docker Client 发送 API 请求 (L3/Job)` -> `dind 服务容器的 Docker Daemon 接收请求 (L3/Service)` -> `dind Daemon 创建并运行最终的容器 (L4)`

# 如何将 gpu 控制权传递给 DinD 管理的容器（第4层）

通过上述四层技术解析，可知解决方案必须作用于 **第 2 层**：修改 `config.toml`，使得 Runner Executor 在创建第 3 层的 `docker:dind` 服务容器时，就通过 `gpus` 和 `privileged` 参数将 GPU 的控制权赋予它。

> [!important] 核心思想是：**权限和资源必须自上而下、逐层传递。我们不能在第 4 层直接请求一个它父层没有的资源。因此，解决方案的关键在于配置第 2 层，使其能将第 1 层的物理资源正确地注入到第 3 层。**

## 步骤 1: 确保第 1 层 (宿主机) 环境就绪

在配置 GitLab Runner 之前，必须确认标签为 `Algo_Docker67` 的那台 Runner 宿主机已经具备 GPU 容器化能力。

1. **安装驱动和工具包**:
    - 已正确安装最新的 NVIDIA 显卡驱动。
    - 已正确安装 **NVIDIA Container Toolkit**。这是让 Docker 引擎能够识别并操作 `–-gpus` 参数的核心组件。
2. **执行环境验证**: 在宿主机（第 1 层）的终端上运行以下命令，验证 Docker 环境是否能成功创建 GPU 容器。Bash

    `docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi`

    如果此命令成功输出 `nvidia-smi` 的 GPU 列表信息，则证明第 1 层环境配置正确，可以为第 2 层提供必要的资源。

## 步骤 2: 配置第 2 层 (GitLab Runner Docker 执行器)

这是整个解决方案中最关键的一步。你需要修改 `Algo_Docker67` 这台机器上的 GitLab Runner 配置文件 `config.toml`，来指示 Docker 执行器在创建容器时注入 GPU 能力。

1. **编辑配置文件**: 打开 `config.toml` (通常位于 `/etc/gitlab-runner/config.toml`)。
2. **定位并修改 Runner 配置**: 找到 `[[runners]]` 配置块中 `tags` 包含 `"Algo_Docker67"` 的那一段，并在其 `[runners.docker]` 部分添加或修改以下两个关键参数：
    
    ```toml
    # /etc/gitlab-runner/config.toml
    
    [[runners]]
      # ... 其他配置，如 name, url, token ...
      executor = "docker"
      tags = "Algo_Docker67, other_tags" # 确保标签匹配
      [runners.docker]
        # ... 其他 docker 配置 ...
    
        # 参数一：注入 GPU 设备
        # 指示 Runner Executor 在调用宿主机 Docker Daemon 创建容器时，
        # 自动添加 --gpus all 标志。
        # 这会将第 1 层的 GPU 设备映射到第 3 层的容器中。
        gpus = "all"
        service_gpus = "all"
    
        # 参数二：赋予特权模式
        # 指示 Runner Executor 在创建容器时添加 --privileged 标志。
        # 对于第 3 层的 docker:dind 服务容器，这是必须的。
        # 它需要此权限来管理自己的网络栈、存储以及正确处理被映射进来的 GPU 设备，
        # 并将其再次暴露给第 4 层的容器。
        privileged = true
    ```

    gpus 和 service_gpus 参数参考官方文档：[https://docs.gitlab.com/runner/configuration/gpus/#docker-executor](https://docs.gitlab.com/runner/configuration/gpus/#docker-executor)

3. **重启 Runner 服务**: 保存配置文件后，必须重启 GitLab Runner 服务以加载新配置。Bash

    `sudo systemctl restart gitlab-runner`

如果是从一开始创建的 runner，可以直接运行命令

```toml
# --docker-privileged 开启特权
# --docker-gpus all 设定 gpus = "all"
# ⚠️注意，因为安装的 gitlab-runner 版本太低了，没有 --docker-service-gpus 选项，可以确定 17.11 版本后有支持。
sudo gitlab-runner register --docker-privileged --docker-gpus all --url http://192.168.3.224:8081/ --registration-token $REGISTRATION_TOKEN
```

## 步骤 3: 在第 3/4 层 (CI 脚本) 中消费 GPU 资源

经过步骤 2 的配置，Runner 现在已经具备了创建带 GPU 权限的 DinD 环境的能力。你的 `.gitlab-ci.yml` 脚本几乎不需要更改，因为它现在是在一个已经具备了相应能力的环境中运行。

你的 CI 脚本可以保持原样，当它执行时，整个流程会像这样工作：

1. GitLab CI 调度一个 Job 到 `Algo_Docker67` Runner 上。
2. **第 2 层 (Runner Executor)** 读取 Job 配置，准备创建**第 3 层**的容器。
    - 它创建 `docker:dind` 服务容器。根据 `config.toml`，此容器会被自动赋予 `-gpus all` 和 `-privileged`标志。因此，这个容器内的 Docker Daemon 现在可以访问和管理物理 GPU。
    - 它创建 `docker:latest` 作业容器。
3. **第 3 层 (作业容器)** 中的 `script:` 开始执行。
4. 当执行到 `docker run --gpus all ...` 命令时：
    - 作业容器中的 Docker 客户端将此命令发送到 `docker:dind` 服务容器的 Docker Daemon。
    - `docker:dind` 的 Daemon 接收到请求。**因为它自身已经被授予了 GPU 权限**，所以它能够理解并成功处理 `-gpus all` 参数。
    - 它成功创建**第 4 层**的容器，并将 GPU 设备从自己（第 3 层）的环境中映射进去。
5. **第 4 层 (DinD 管理的容器)** 成功启动，内部的 `nvidia-smi` 命令可以找到 GPU 设备并正确执行。

# ⁉️问题 dind:latest 不支持 GPU

报错节选：

```plaintext
Status: Downloaded newer image for 192.168.3.224:8083/test/nvcr.io/nvidia/cuda:12.1.1-runtime-ubuntu22.04
docker: Error response from daemon: could not select device driver "" with capabilities: [[gpu]]
Run 'docker run --help' for more information
ERROR: Job failed: exit code 125
```

社区反馈：

[https://forum.gitlab.com/t/run-docker-container-with-the-gpu-option-in-jobs-fails/118137/2](https://forum.gitlab.com/t/run-docker-container-with-the-gpu-option-in-jobs-fails/118137/2)

[https://gitlab.com/gitlab-org/gitlab-runner/-/issues/36830](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/36830)

解决方案：

[https://gitlab.com/gitlab-org/gitlab-runner/-/issues/36830#note_2291177787](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/36830#note_2291177787)

即，替换默认的 `dind:latest` 使用支持 Nvidia GPU 的 `ghcr.io/extrality/nvidia-dind:latest`

最终可用于测试的的 .yml 如下：

```yaml
stages:
    - test
  
dind_gpu_test_job:
  stage: test
  tags:
    - Algo_Docker67
  image: docker:latest
  services:
    - name: ghcr.io/extrality/nvidia-dind:latest
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
    HTTP_PROXY: "http://192.168.3.242:2888"
    HTTPS_PROXY: "http://192.168.3.242:2888"
    NO_PROXY: "localhost,127.0.0.1,docker,192.168.0.0/16"
  script:
    - echo "Waiting for the DinD service to start..."
    - until docker info; do sleep 1; done
    - echo "DinD service is ready."

    - echo "Logging in to Harbor at $HARBOR_REGISTRY..."
    - echo $ROBOT_PAT | docker login $HARBOR_REGISTRY -u $ROBOT_USER --password-stdin
    - echo "Login successful"
    
    - echo "Now, attempting to run a new container WITH GPU access via DinD..."
    
    # 核心测试步骤：
    # 让 DinD 服务去启动一个带有 --gpus all 标志的 CUDA 容器
    # 如果 DinD 服务（在 Runner 层面）被成功赋予了 GPU 权限，这一步就能成功
    - docker run --rm --gpus all 192.168.3.224:8083/test/nvcr.io/nvidia/cuda:12.1.1-runtime-ubuntu22.04 nvidia-smi
    
    - echo "DinD GPU test finished."
    - echo "If the command above printed the GPU table, the DinD GPU pass-through is successful!"
```

# ⁉️问题 nvidia-container-cli: initialization error: load library failed: libnvidia-ml.so.1: cannot open shared object file: no such file or directory: unknown

具体报错：

```plaintext
docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: error running prestart hook #0: exit status 1, stdout: , stderr: Auto-detected mode as 'legacy'
nvidia-container-cli: initialization error: load library failed: libnvidia-ml.so.1: cannot open shared object file: no such file or directory: unknown
Run 'docker run --help' for more information
```

社区类似问题：

~~[https://github.com/NVIDIA/nvidia-container-toolkit/issues/305#issuecomment-1915281010](https://github.com/NVIDIA/nvidia-container-toolkit/issues/305#issuecomment-1915281010)~~

上述问题里面提供的一系列解决方案并不能解决问题。

后续怀疑是 gitlab-runner 早期版本不支持 `service_gpus` 参数。升级了服务器的 gitlab-runner 版本到：

```bash
$ gitlab-runner -v
Version:      18.2.0
Git revision: c24769e8
Git branch:   18-2-stable
GO version:   go1.24.4 X:cacheprog
Built:        2025-07-17T15:
```

并且还有一个证据是近期 ( February 24, 2025 ) 刚提供的 `Support GPU` 特性支持  
[https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/5380](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/5380)

---

# 完结撒花🎉