---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 6:05:42 pm
---

> [!info] MNN介绍 — MNN-Doc 2.1.1 documentation  
> MNN是一个轻量级的深度神经网络引擎，支持深度学习的推理与训练。适用于服务器/个人电脑/手机/嵌入式各类设备。目前，MNN已经在阿里巴巴的手机淘宝、手机天猫、优酷等30多个App中使用，覆盖直播、短视频、搜索推荐、商品图像搜索、互动营销、权益发放、安全风控等场景。  
> [https://mnn-docs.readthedocs.io/en/latest/intro/about.html?highlight=express](https://mnn-docs.readthedocs.io/en/latest/intro/about.html?highlight=express)  

# MacOS

## 编译安装

```Shell
mkdir build
cd build
cmake -DMNN_METAL=ON -DCMAKE_INSTALL_PREFIX=./install ..
make -j4
```

## 下载模型 Qwen1.5-1.8B-Chat-MNN

[下载地址](https://modelscope.cn/models/MNN/Qwen1.5-1.8B-Chat-MNN)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926180048795.png)

下载命令：

```Shell
conda activate mnn
pip install modelscope
modelscope download --model 'MNN/Qwen1.5-1.8B-Chat-MNN'

# 下载到本地目录：/Users/username/.cache/modelscope/hub/MNN/Qwen2-1.5B-Instruct-MNN
```

## 运行 web demo

```Shell
cd build
./web_demo ~/.cache/modelscope/hub/MNN/Qwen2-1___5B-Instruct-MNN/config.json ../web
```

## 运行 cli demo

```Shell
cd build
./cli_demo ~/.cache/modelscope/hub/MNN/Qwen1.5-1.8B-Chat-MNN/config.json
```

# 问题

- 如下问题不要紧，ubuntu也遇到这个报错，但是可以正常运行
	```plaintext
    Can't open file:.tempcache
    Load Cache file error.
    ```

- 使用模型 `Qwen2-1.5B-Instuct-MNN` 会出现错误：
    ```Shell
    ERROR: Unary Op can not execute
    ERROR: Unary Op can not execute
    Create execution error : 101
    code=2 in onForward, 564 
    ### response :
    ```
    
- 模型文件有错误，跑不起来：
    
    12.31 之后上传的模型在 Mac 上跑不起来，ubuntu 上没有测试。

    报错是 segmentation fault，没有更多的提示了。

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926180222648.png)

    有效的模型备份在 7.184:~/.cache/modelscope/hub/MNN/Qwen1___5-1___8B-Chat-MNN