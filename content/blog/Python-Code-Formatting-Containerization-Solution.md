---
title: Python代码格式化容器化方案
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-11T17:27:11.1111+08:00
---

开发工具链（包括格式化工具）容器化，是解决“环境一致性”问题的终极方案之一。

---

# 方案构成要素

- `**formatter**` **镜像**：一个包含`black`, `ruff`等工具的Docker镜像，作为环境中唯一的“事实来源”。
- **执行脚本 (**`**format.sh**`**)**：一个简单的Shell脚本，封装了 `docker run` 命令，方便开发者在本地调用。
- **Pre-commit 集成**：修改 `.pre-commit-config.yaml`，让它在提交时调用我们的执行脚本。
- **CI/CD 集成**：修改 `.gitlab-ci.yml`，直接使用我们的`formatter`镜像作为作业的运行环境。

# 第一步：创建格式化工具的 Docker 镜像

创建一个名为 `Dockerfile` 的文件。

```Docker
# Dockerfile
# 选择一个轻量的官方Python镜像作为基础
FROM python:3.10-slim

# 定义工具的版本，方便管理和查看
ARG BLACK_VERSION=24.4.2
ARG RUFF_VERSION=0.12.3

# 在构建镜像时一次性安装所有工具
# --no-cache-dir 减小镜像体积
RUN pip install --no-cache-dir \
    black==${BLACK_VERSION} \
    ruff==${RUFF_VERSION}# 设置工作目录，容器内的代码将被挂载到这里
WORKDIR /src

# （可选）可以设置一个默认的入口点，但我们在脚本中会覆盖它
# ENTRYPOINT ["black"]
ENTRYPOINT ["tail", "-f", "/dev/null"]
```

**构建并推送镜像：**

你需要将这个镜像构建好，并推送到一个团队可以访问的容器镜像仓库中（如 GitLab Container Registry, Docker Hub, Harbor 等）。

```Bash
# 构建镜像，并打上标签
docker build -t your-registry.com/your-org/python-formatter:1.0 .

# 推送镜像到仓库
docker push your-registry.com/your-org/python-formatter:1.0
```

---

# 第二步：编写便捷的执行脚本

在项目根目录创建一个名为 `format.sh` 的脚本。这个脚本是开发者与容器交互的桥梁。

```Bash
#!/bin/bash
# format.sh

# 定义要使用的镜像名称和标签
FORMATTER_IMAGE="your-registry.com/your-org/python-formatter:1.0"

# 检查Docker是否正在运行
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# 运行容器来执行命令
# --rm: 容器退出后自动删除，保持系统干净
# -v: 将当前目录挂载到容器的/src目录，让容器可以访问代码
# $@: 将所有传递给format.sh的参数，原封不动地传递给容器内的命令
docker run --rm \
  -v "$(pwd)":/src \
  ${FORMATTER_IMAGE} "$@"
```

**赋予脚本执行权限：**

```Bash
chmod +x format.sh
```

现在，任何开发者都可以在项目根目录下通过这个脚本来执行格式化，例如： 

```Bash
./format.sh black .
./format.sh ruff --fix .
```

---

# 第三步：集成到 Pre-commit

现在我们需要让 `git commit` 自动调用我们的 `format.sh` 脚本。这依然通过 `repo: local` 来实现，但 `entry` 会指向我们的脚本。

修改 `.pre-commit-config.yaml`：

```YAML
# .pre-commit-config.yaml

repos:
-   repo: local
    hooks:
    -   id: black-container
        name: black (in container)
        # entry 调用我们的脚本，并把 'black' 作为第一个参数传递进去
        entry: ./format.sh black
        language: script # 使用 script language
        types: [python]

    -   id: ruff-container
        name: ruff (in container)
        entry: ./format.sh ruff --fix --exit-non-zero-on-fix
        language: script
        types: [python]
```

**工作流程解析：**

1. 开发者运行 `git commit`。
2. `pre-commit` 被触发，找到 `black-container` 钩子。
3. `pre-commit` 执行 `entry` 中的命令：`./format.sh black`。
4. `format.sh` 脚本启动一个临时的Docker容器。
5. 容器内的 `black` 命令格式化了挂载进来的代码。
6. 容器执行完毕后自动销毁。

---

# 第四步：调整 CI/CD 流水线

这是最能体现容器化优势的地方。CI的配置会变得极其简单，因为它不再需要自己构建环境了。

修改 `.gitlab-ci.yml`，直接使用我们构建好的`formatter`镜像：

```YAML
# .gitlab-ci.yml (容器化方案)

stages:
  - lint-check

lint_job:
  stage: lint-check
  
  # 直接使用我们预先构建好的、包含所有工具的镜像！
  image: your-registry.com/your-org/formatter:1.0

  script:
    - echo "Running checks inside the pre-built formatter container..."
    # 镜像里已经有所有工具了，直接调用即可。
    # 不需要任何 pip install 或 before_script
    - black --check .
    - ruff check .
```

这个CI配置干净、快速、可靠，因为它跳过了所有环境准备的步骤，直接在一个“完美”的环境中运行检查。

# 新方案总结

至此，你已经建立了一个高度现代化、健壮且一致的开发工作流。

- **开发者入职**：只需 `git clone` 项目，确保本地安装了Docker和`pre-commit`，然后运行 `pre-commit install`。完成！
- **日常开发**：`git commit` 自动在容器中完成格式化，开发者无需关心工具版本。
- **CI/CD**：流水线直接拉取同一个镜像进行验证，保证了与本地行为的100%一致。
- **工具升级**：当需要升级`black`或`ruff`时，只需修改 `Dockerfile`，构建并推送一个新的镜像标签（如 `1.1`），然后在 `.gitlab-ci.yml` 和 `format.sh` 中更新镜像标签即可。所有环境的升级都在一个地方完成，非常优雅。