---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!important] **用途核心：** 在 `docker build` 过程中，允许构建步骤（通常是 `RUN` 指令）安全地使用你本地宿主机的 SSH agent 中加载的 SSH 私钥，而**不需要将私钥本身复制到镜像中**。

# **为什么需要它？**

当构建过程需要通过 SSH 克隆私有 Git 仓库，或者从需要 SSH 认证的服务器下载依赖或文件时，你不想把 SSH 私钥文件（如 `id_rsa`）`COPY` 到镜像中，因为这会造成严重的安全风险。SSH Agent 转发允许构建容器“借用”宿主机的 SSH 认证能力。

# 如何使用？

1. 确保 SSH Agent 正在运行并加载密钥，有如下两种做法
    - 只在当前终端起作用的做法（设置的两个变量只会在当前终端起作用， ssh-agent 本身会被pid1回收，作为守护进程）
        
        ```Bash
        eval $(ssh-agent -s)  # 启动 agent (如果尚未运行)，此时会设置两个变量 $SSH_AUTH_SOCK 和 $SSH_AGENT_PID
        ssh-add ~/.ssh/id_rsa # 添加你的私钥 (如果需要密码，会提示输入)
        ssh-add -l            # 验证密钥是否已加载
        ```
        
    - **在每个新开终端都起作用的做法（推荐）**
        
        ```Shell
        # --- SSH Agent Management ---
        
        SUITABLE_AGENT_PID=""
        
        # First, look for a non-zombie PPID=1 agent
        for pid in $(pgrep -u "$USER" -f 'ssh-agent'); do
            # Suppress errors for non-existent PIDs that might have terminated
            ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d '[:space:]')
            status=$(awk '{print $3}' "/proc/$pid/stat" 2>/dev/null) # Get process status
        
            if [ -n "$ppid" ] && [ "$ppid" = "1" ] && [ "$status" != "Z" ]; then
                SUITABLE_AGENT_PID="$pid"
                break # Found our target, exit loop
            fi
        done
        
        # 定义 ssh-agent 环境变量文件的路径
        AGENT_ENV_FILE="$HOME/.ssh/ssh-agent-env"
        
        # 2. 根据查找结果执行不同操作
        if [ -n "$SUITABLE_AGENT_PID" ]; then
            # 找到了 PPID 为 1 的 ssh-agent
            echo "Found orphaned ssh-agent (PID: $SUITABLE_AGENT_PID)."
        
            # 尝试加载环境变量文件，如果存在的话
            if [ -f "$AGENT_ENV_FILE" ]; then
                echo "Sourcing existing agent environment file: $AGENT_ENV_FILE"
                source "$AGENT_ENV_FILE" > /dev/null
            fi
        
            # 如果此时 SSH_AUTH_SOCK 仍然为空，但我们找到了一个孤儿 agent，
            # 且 ssh-add 无法连接（意味着当前会话无法使用该孤儿 agent），
            # 那么我们仍然需要启动一个新的。
            if [ -z "$SSH_AUTH_SOCK" ] || ! ssh-add -l > /dev/null 2>&1; then
                echo "Current shell not connected to the orphaned agent, or agent not functional. Starting a new one."
                eval "$(ssh-agent -s)"
                echo "SSH_AUTH_SOCK set for new agent: $SSH_AUTH_SOCK"
                # 将新启动的 agent 变量写入文件，覆盖旧的（如果有）
                ssh-agent > "$AGENT_ENV_FILE"
                source "$AGENT_ENV_FILE" > /dev/null
            fi
        
        else
            # 没找到 PPID 为 1 的 ssh-agent，或者其他活跃 agent
            echo "No suitable ssh-agent (PPID=1) found, starting a new one..."
            eval "$(ssh-agent -s)"
            echo "SSH_AUTH_SOCK set for new agent: $SSH_AUTH_SOCK" # 调试信息
            # 将新启动的 agent 变量写入文件
            ssh-agent > "$AGENT_ENV_FILE"
            source "$AGENT_ENV_FILE" > /dev/null
        fi
        
        # 最后，检查当前连接的 agent 中是否有密钥，如果没有则添加默认密钥
        # 注意：这会在每次新的 bash 会话启动时检查。如果密钥有密码，每次都会提示输入。
        # 如果你不喜欢这种行为，可以注释掉下面两行，手动运行 ssh-add。
        if ! ssh-add -l > /dev/null 2>&1; then
            echo "Adding default SSH key to the agent..."
            ssh-add
        fi
        # --- End SSH Agent Management ---
        ```
        
2. 启用 buildkit

    通常，在较新的 Docker 版本中，BuildKit 是默认的构建器。你可以通过设置环境变量来显式启用：

    ```Bash
    export DOCKER_BUILDKIT=1
    ```

    也可以在 Docker 守护进程的配置文件 (`/etc/docker/daemon.json`) 中将其设置为默认：

    ```JSON
    {
      "features": {
        "buildkit": true
      }
    }
    ```
    
3. 在 `docker build` 命令中使用 `--ssh` 标志
    
    - 默认情况下，它会尝试转发默认的 SSH agent socket (`$SSH_AUTH_SOCK`)。
    - 你也可以指定一个特定的 SSH agent socket 或 SSH key 文件路径 (但不推荐直接暴露 key 文件，优先使用 agent)。
    
    ```Bash
    # 默认转发
    docker build --ssh default -t my-app .
    
    # 或者指定 agent socket (如果 SSH_AUTH_SOCK 环境变量设置正确，通常 "default" 即可)
    # docker build --ssh default=$SSH_AUTH_SOCK -t my-app .
    ```
    
4. 在 `Dockerfile` 中挂载 SSH Agent Socket

    在需要 SSH 访问的 `RUN` 指令中，使用 `--mount=type=ssh` 来挂载 SSH agent socket。

    ```Docker
    # syntax=docker/dockerfile:1
    
    FROM alpine/git # 或者任何包含 git 和 ssh 客户端的镜像
    
    # 安装 SSH 客户端 (如果基础镜像没有)
    # RUN apk add --no-cache openssh-client git
    
    WORKDIR /app
    
    # 挂载 SSH agent socket
    # 这使得容器内的 git 命令可以使用宿主机的 SSH 认证
    RUN --mount=type=ssh \
        echo "Cloning private repository..." && \
        # 关闭严格的主机密钥检查，以便首次连接时不会失败 (在受信任环境中)
        # 或者确保 known_hosts 文件配置正确
        mkdir -p -m 0700 ~/.ssh && ssh-keyscan git.example.com >> ~/.ssh/known_hosts && \
        git clone git@git.example.com:myteam/my-private-repo.git .
        
    # 以私有的gitlab服务器为例：
    # novauto的私有gitlab服务器 ip 是 192.168.3.224
    RUN --mount=type=ssh \
        echo "Cloning private repository from 192.168.3.224..." && \
        # 2. 创建 .ssh 目录并设置正确权限
        mkdir -p -m 0700 ~/.ssh && \
        # 3. 扫描私有Git服务器的SSH公钥并添加到known_hosts
        # 这里扫描的是你的SSH服务器地址，也就是IP地址
        ssh-keyscan 192.168.3.224 >> ~/.ssh/known_hosts && \
        # 4. 克隆私有仓库
        git clone git@192.168.3.224:liuhao/detic.git .
    
    
    # 注意：SSH agent socket 的挂载只在当前 RUN 指令中有效
    # SSH 私钥本身绝不会进入镜像
    
    CMD ["ls", "-la"]
    ```

# **用在什么场景？**

- **从私有 Git 仓库克隆代码或拉取子模块：**
    - 这是最常见的场景。你的项目可能依赖于存储在私有 GitHub, GitLab, Bitbucket 或其他自托管 Git 服务器上的代码。
- **通过 SCP/SFTP 从需要 SSH 认证的服务器下载文件：**
    - 在构建过程中，可能需要从一个受保护的服务器获取特定的配置文件、依赖包或数据。
- **在构建过程中 SSH 到其他服务器执行命令：**
    - 虽然不常见，但如果构建脚本需要连接到另一台服务器执行某些预备操作，也可以使用 SSH agent 转发。

---

> [!important] **关键优势：** SSH 私钥永远不会离开你的宿主机或进入 Docker 镜像的任何部分。构建过程只是临时借用了宿主机的 SSH agent 进行认证。