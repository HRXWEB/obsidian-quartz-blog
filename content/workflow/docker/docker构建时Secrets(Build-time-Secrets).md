---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:35:36 am
---

> [!important] **用途核心：** 在 `docker build` 过程中，安全地向构建步骤（通常是 `RUN` 指令）提供敏感信息（如密码、API 密钥、私有证书等），而这些信息**不会**被缓存到任何镜像层中，也不会出现在最终的镜像里。

# **为什么需要它？**

在 BuildKit 之前，如果在 `Dockerfile` 的 `RUN` 指令中直接使用敏感信息，或者通过 `ARG` 传入然后使用，这些信息很容易会保留在镜像的某一层中，即使后续删除了文件，也可能通过查看镜像历史记录被恢复。构建时 Secrets 解决了这个问题。

# **怎么用？**

1. **启用 BuildKit：** 确保你的 Docker 版本支持 BuildKit，并且它已被启用。通常，在较新的 Docker 版本中，BuildKit 是默认的构建器。你可以通过设置环境变量来显式启用：
    
    ```Bash
    export DOCKER_BUILDKIT=1
    ```

    或者在 `docker build` 命令中指定：

    ```Bash
    DOCKER_BUILDKIT=1 docker build ...
    ```

    你也可以在 Docker 守护进程的配置文件 (`/etc/docker/daemon.json`) 中将其设置为默认：

    ```JSON
    {
      "features": {
        "buildkit": true
      }
    }
    ```
    
2. **准备 Secret 文件：** 将你的敏感信息存储在一个本地文件中。例如，创建一个名为 `mysecret.txt` 的文件，内容是你的 API 密钥。
    
    ```Plain
    this_is_my_super_secret_api_key
    ```
    
3. **[在](https://docs.docker.com/reference/cli/docker/buildx/build/#secret)** `**[docker build](https://docs.docker.com/reference/cli/docker/buildx/build/#secret)**` **[命令中指定 Secret](https://docs.docker.com/reference/cli/docker/buildx/build/#secret)：** 使用 `--secret` 标志来传递 Secret 文件。
    
    - `id`: 在 `Dockerfile` 中引用的 Secret 的标识符。
    - `src` (或 `source`): 本地 Secret 文件的路径。
    
    ```Bash
    docker build --secret id=myapikey,src=mysecret.txt -t my-app .
    ```

    如果你的 Secret 内容直接在环境变量中，可以这样：

    ```Bash
    MY_ENV_SECRET="some_secret_value"
    docker build --secret id=myenvsecret,env=MY_ENV_SECRET -t my-app .
    ```
    
4. **在** `**Dockerfile**` **中挂载和使用 Secret：** 在需要使用 Secret 的 `RUN` 指令中，使用 `--mount=type=secret` 来挂载它。Secret 会被挂载到指定的 `target` 路径（默认为 `/run/secrets/<id>`)。
    
    ```Docker
    # syntax=docker/dockerfile:1 # 确保使用支持 BuildKit 的 Dockerfile 语法版本
    
    FROM alpine
    
    # 挂载名为 myapikey 的 secret 到 /run/secrets/myapikey (默认路径)
    # 你也可以通过 target=/path/to/secret 指定自定义挂载路径
    RUN --mount=type=secret,id=myapikey \
        apk add --no-cache curl && \
        echo "Fetching data with API key..." && \
        # 从挂载点读取 secret 内容
        SECRET_VALUE=$(cat /run/secrets/myapikey) && \
        # 举例：使用 secret（这里只是打印，实际应用中会用于 API 调用等）
        curl -H "Authorization: Bearer $SECRET_VALUE" https://api.example.com/data && \
        echo "Data fetched."
    
    # 挂载名为 myenvsecret，挂载方式是环境变量
    RUN --mount=type=secret,id=myenvsecret,env=MY_ENV_SECRET \
        echo "MY_ENV_SECRET: $MY_ENV_SECRET"
    
    # 注意：/run/secrets/myapikey 这个路径和它的内容在这一层之后就不可用了
    # 它不会被包含在最终的镜像中
    
    CMD ["echo", "Build complete. Secret was used during build but not stored in image."]
    ```

**用在什么场景？**

- **访问私有包仓库/软件源：**
    - 在构建过程中需要从私有的 npm registry、Maven repository、PyPI server 或 apt/yum repository 下载依赖包时，可以使用 Secret 传递认证凭据（如 token、用户名密码）。
    - **例子 (**`**Dockerfile**` **for npm):**
        
        ```Docker
        # syntax=docker/dockerfile:1
        FROM node:18-alpine
        WORKDIR /app
        # 假设 .npmrc 文件内容需要 token
        RUN --mount=type=secret,id=npmtoken \
            echo "//registry.npmjs.org/:_authToken=$(cat /run/secrets/npmtoken)" > .npmrc && \
            npm install && \
            # 构建完成后，.npmrc 文件（包含 token）不会保留在镜像中# 如果需要，可以显式删除，但 secret 挂载本身不会留下痕迹
            rm -f .npmrc
        COPY . .
        CMD ["node", "index.js"]
        ```

        Dockerfile构建命令:  `docker build --secret id=npmtoken,src=./.npmrc_token_file -t my-node-app .`

- **注入 API 密钥或凭证进行构建时操作：**
    - 在构建过程中需要调用云服务 API（如 AWS, Azure, GCP）来获取资源、配置或执行特定任务。
    - 需要连接到数据库执行迁移或初始化操作。
    - 下载需要认证的特定构建工具或文件。
- **编译时需要许可证密钥：**
    - 某些商业软件或库在编译时需要提供许可证密钥。
- **避免在** `**ARG**` **中传递敏感信息：**
    - 虽然 `ARG` 可以传递变量，但如果 `ARG` 的值在 `Dockerfile` 中被使用并写入文件系统（即使后来删除），也可能泄露。`--secret` 更安全。

---

> [!important] **关键优势：** 敏感数据只在构建该层的特定 `RUN` 指令执行期间可用，并且是以只读方式挂载在内存文件系统中，不会写入任何中间镜像层或最终镜像。

---

[[docker-ssh-agent转发]] 只是这种挂载方式的一个特殊的例子，它也是和密钥认证相关，只是docker 使用 `RUN --mount=type=secret` 的挂载方式做了一些封装，让 docker 可以使用宿主机的的 ssh 能力。