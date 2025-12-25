---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

```shellscript
# 1. 下载并安装 CUDA GPG key
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all_deb

# 2. 更新 apt 索引
sudo apt update

# 3. 再次尝试搜索
apt search cuda-toolkit
```