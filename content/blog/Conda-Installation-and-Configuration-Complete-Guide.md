---
title: Conda安装与配置完整指南：Miniconda、Anaconda、Miniforge对比
draft: 
aliases: []
tags: []
URL: https://docs.conda.io/projects/conda/en/latest/user-guide/index.html
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-12T17:04:53.5353+08:00
---

# 安装

> [!info] Installing on macOS — conda 25.3.2.dev65 documentation  
> If you use the .  
> [https://docs.conda.io/projects/conda/en/latest/user-guide/install/macos.html](https://docs.conda.io/projects/conda/en/latest/user-guide/install/macos.html)  

> [!info] Installing on Linux — conda 25.3.2.dev60 documentation  
> conda-installer-name will be one of "Miniconda3", "Anaconda", or "Miniforge3".  
> [https://docs.conda.io/projects/conda/en/latest/user-guide/install/linux.html](https://docs.conda.io/projects/conda/en/latest/user-guide/install/linux.html)  

conda 分成了三个版本： Miniconda、Anaconda、Miniforge。它们的区别如下：

| 特点        | Anaconda                 | Miniconda                | Miniforge                 |
| --------- | ------------------------ | ------------------------ | ------------------------- |
| **体积**    | 很大 (GB级别)                | 小 (MB级别)                 | 小 (MB级别)                  |
| **预装包**   | 包含数百个常用数据科学包             | 仅包含 `conda` 和 Python     | 仅包含 `conda` 和 Python      |
| **默认通道**  | Anaconda Repository (官方) | Anaconda Repository (官方) | `conda-forge` (社区驱动)      |
| **图形界面**  | 有 (Anaconda Navigator)   | 无                        | 无                         |
| **目标用户**  | 初学者、需要一站式解决方案的用户         | 希望自定义环境、节省空间的高级用户        | 注重开源、寻求最新包、特定架构（如 ARM）的用户 |
| **许可限制**  | 某些商业/研究用途可能存在            | 默认通道同 Anaconda，可能存在      | 无 (基于 `conda-forge` 的开源包) |
| **包管理速度** | 较慢                       | 较慢                       | 较快 (常结合 `mamba` 使用)       |

- mamba: 一个更快的 Conda 替代品，可以显著加速包的安装和环境解析。

## Unix-like Platforms Install

```bash
mkdir /path/to/miniforge3

wget "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
# or
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"

bash Miniforge3-$(uname)-$(uname -m).sh -b -u -p /path/to/miniforge3
```

# 安装后配置

## 在每个 shell 都（不）初始化

```bash
source ~/miniconda3/bin/activate、
# 都初始化
conda intit --all
# 设置过了都初始化，反悔了，都不初始化
conda init --reverse --all
```

## 配置镜像源 `~/.condarc`

```plaintext
auto_activate_base: false
show_channel_urls: true
nodefaults: true
channel_priority: strict
channel_alias: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
```

# conda 环境

[[Environment-Configuration-Complete-Guide-From-PATH-to-Conda-Virtual-Environments-In-Depth-Analysis]]