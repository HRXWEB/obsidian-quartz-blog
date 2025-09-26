---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:35:47 am
---

### 步骤 1: 停止 Docker 服务

首先，你需要停止 Docker 服务以确保在数据迁移过程中没有新的数据写入，避免数据损坏。

```Bash
sudo systemctl stop docker
```

### 步骤 2: 创建新的 Docker 数据目录

在新的目标位置创建一个目录，用于存放 Docker 的所有数据。假设你的新目录是 `/mnt/new-data/docker`。

```Bash
sudo mkdir -p /mnt/new-data/docker
```

### 步骤 3: 使用 rsync 迁移数据

使用 `rsync` 命令将 `/var/lib/docker` 目录下的所有数据**同步**到新创建的目录。`rsync` 是一个非常可靠的工具，可以确保数据完整性，并保留文件权限等属性。

```Bash
sudo rsync -avzP /var/lib/docker/ /mnt/new-data/docker/
```

- `a`: 归档模式，保留文件权限、所有权、时间戳等。
- `P`: 显示进度，并支持断点续传（如果传输中断）。

**重要提示：** 请务必在源目录 `/var/lib/docker/` 和目标目录 `/mnt/new-data/docker/` 后都加上斜杠 `/`。这会确保 `rsync` 同步的是目录下的**内容**，而不是将整个 `docker` 目录同步到目标目录中。

### 步骤 4: 修改 Docker 配置文件

现在，你需要告诉 Docker 服务新的数据存储位置。编辑 `/etc/docker/daemon.json` 文件。如果该文件不存在，则创建它。

```Bash
sudo nano /etc/docker/daemon.json
```

在文件中添加或修改 `data-root` 字段，将其值设置为你的新目录路径。

```YAML
{
  "data-root": "/mnt/new-data/docker"
}
```

保存并关闭文件。

### 步骤 5: 启动 Docker 服务并验证

完成配置后，重新启动 Docker 服务。

```YAML
sudo systemctl daemon-reload
sudo systemctl start docker
```

重新启动后，Docker 将使用 `/mnt/new-data/docker` 作为新的数据根目录。你可以运行一些 Docker 命令来验证一切是否正常。

- **查看配置是否生效：** 运行 `docker info` 命令，检查 `Docker Root Dir` 字段是否已经更新为新路径。
- **验证镜像和容器：** 运行 `docker images` 和 `docker ps -a`，检查你的所有镜像和容器是否都还在。

### 步骤 6: 清理旧目录（可选）

在确认 Docker 已经在新位置正常运行后，你可以删除旧的 `/var/lib/docker` 目录来释放空间。

```YAML
sudo rm -rf /var/lib/docker
```

**在执行此步骤前，务必确认所有数据都已成功迁移，且 Docker 正在新目录上运行。** 否则，这会是一个不可逆的操作。

# 参考

1. [https://docs.docker.com/engine/daemon/#daemon-data-directory](https://docs.docker.com/engine/daemon/#daemon-data-directory)