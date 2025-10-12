---
title: Ubuntu低版本系统安装高版本Python指南：PPA
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-12T16:24:56.5656+08:00
---

Ubuntu的APT仓库包含了大量软件包，包括多个版本的Python。然而，默认情况下，Ubuntu 20.04 LTS（长期支持版）会附带一个特定版本的Python作为系统默认版本。对于Ubuntu 20.04，这个默认版本是Python 3.8。

虽然官方仓库可能不会直接包含所有最新的Python版本，但你可以通过其他方式安装更高版本的Python：

1. **使用PPA（个人包档案）**：一些第三方PPA提供了更新版本的Python，可以方便地安装。
2. **从源代码编译**：可以从Python官方网站下载所需版本的源代码，并在本地编译安装。
3. **使用环境管理工具**：如`pyenv`，它允许在同一台机器上安装和管理多个Python版本。

# 使用 PPA

```Shell
# 安装 add-apt-repository
sudo apt install software-properties-common -y

# 添加 PPA 并安装
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.X python3.X-dev -y
# python3.X 是 Python 3.X 的运行时版本。安装这个包后，将获得Python解释器以及标准库
# python3.X-dev 会安装一些额外的文件，主要是头文件（.h文件）和开发用的静态库，
```

# 参考

1. [https://linuxcapable.com/install-python-3-12-on-ubuntu-linux/](https://linuxcapable.com/install-python-3-12-on-ubuntu-linux/)