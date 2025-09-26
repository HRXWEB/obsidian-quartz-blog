---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 2:25:40 pm
---

```Shell
# 1. 下载并安装 CUDA GPG key
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all_deb

# 2. 更新 apt 索引
sudo apt update

# 3. 再次尝试搜索
apt search cuda-toolkit
```