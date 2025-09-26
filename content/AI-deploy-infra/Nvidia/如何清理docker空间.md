---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 2:26:00 pm
---

# 不要的 docker 镜像

64GB 的空间一般做实验都只会有一两个镜像的存在，可以直接都删掉。

```Bash
# 1. 停止 Docker 服务
sudo systemctl stop docker

# 2. (可选但推荐) 备份当前的 Docker 数据目录
# sudo mv /var/lib/docker /var/lib/docker.bak

# 3. 删除 Docker 数据目录 (这将删除所有本地镜像、容器、卷等，如果它们实际存在但未被跟踪的话)
# sudo rm -rf /var/lib/docker

# 4. 重新启动 Docker 服务 (它会自动重新创建 /var/lib/docker 目录和一个干净的状态)
sudo systemctl start docker
```