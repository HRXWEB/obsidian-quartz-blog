---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# 管理脚本

[cuda_switcher.sh](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/cuda_switcher.sh)

> [!important] 现在默认是安装了 12.6 和 12.9 版本的 cuda 之间的切换，如何修改请参考章节 “\#如何更新版本”

# 如何使用

1. 将其放到 $HOME 目录下，在 `.bashrc` 或者 `.zshrc` 中加入这几行：
    
    ```Bash
    # Source the CUDA switcher script
    if [ -f ~/.cuda_switcher.sh ]; then
        . ~/.cuda_switcher.sh
    fi
    ```
    
2. logout 之后再 login，通过如下命令检查版本：
    
    ```Bash
    nvcc --version
    readlink -f /usr/local/cuda
    readlink -f /usr/local/cuda-12
    ```

# 如何更新版本

1. 更新脚本

    在提供的脚本中，示例为：

    ```Bash
    declare -a CUDA_CONFIGS=(
      "0:12.6:/usr/local/cuda-12.6"
      "1:12.9:/usr/local/cuda-12.9"
    )
    ```

    安装了新版本或者不同的版本，可以改为：

    ```Bash
    declare -a CUDA_CONFIGS=(
      "0:12.6:/usr/local/cuda-12.6"
      "1:12.9:/usr/local/cuda-12.9"
      "2:12.10:/usr/local/cuda-12.10" # 新增这一行
    )
    ```
    
2. 重新加载
    
    ```Bash
    source ~/.cuda_switcher.sh
    ```
    
3. 注册新的 cuda 版本到 update-alternatives 系统中
    
    ```Bash
    register_cuda_alternatives
    ```
    
4. 使用新版本（示例）：
    
    ```Bash
    switch_cuda 2
    ```