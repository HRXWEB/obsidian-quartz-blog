---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

[[triton-inference-server-vllm-orin]] 方案的继任者

---

# 环境配置

## 基础 python 环境准备

```Shell
conda create -n minicpm-3-1b-sft-v1 python=3.10
conda activate minicpm-3-1b-sft-v1
git clone git@192.168.3.224:username/minicpm-3-1b-sft-v1.git
cd minicpm-3-1b-sft-v1
```

## Install PyTorch for Jetson Platform

默认安装的 torch 是 pytorch 团队维护的，没办法用 jetson 的 cuda。

官方安装教程：

> [!info] Installing PyTorch for Jetson Platform  
> This guide provides instructions for installing PyTorch for Jetson Platform.  
> [https://docs.nvidia.com/deeplearning/frameworks/install-pytorch-jetson-platform/index.html](https://docs.nvidia.com/deeplearning/frameworks/install-pytorch-jetson-platform/index.html)  

下面安装 torch 的命令可以看到 torch 的版本信息是 `torch-2.5.0a0+872d972e41.nv24.08`

注意这个 `24.08` ，官方描述为：

> If installing 24.06 PyTorch or later versions, **[cusparselt](https://docs.nvidia.com/cuda/cusparselt/index.html)** needs to be installed first:
> 
> ```Shell
> wget raw.githubusercontent.com/pytorch/pytorch/5c6af2b583709f6176898c017424dc9981023c28/.ci/docker/](http://raw.githubusercontent.com/pytorch/pytorch/5c6af2b583709f6176898c017424dc9981023c28/.ci/docker/common/install_cusparselt.sh
> export CUDA_VERSION=12.1 # as an example
> bash ./install_cusparselt.sh
> ```

> [!important] 但是发现用上述命令安装的时候最多支持 12.4，jp62 已经默认是 cuda-12.6了，因此不能用上面这个方法安装 `cusparselt`

需要使用如下方法，来自：

> [!info] cuSPARSELt Downloads  
>  
> [https://developer.nvidia.com/cusparselt-downloads?target_os=Linux&target_arch=aarch64-jetson&Compilation=Native&Distribution=Ubuntu&target_version=22.04&target_type=deb_network](https://developer.nvidia.com/cusparselt-downloads?target_os=Linux&target_arch=aarch64-jetson&Compilation=Native&Distribution=Ubuntu&target_version=22.04&target_type=deb_network)  

```Shell
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/arm64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install libcusparselt0 libcusparselt-dev
```

开始安装 torch && torchvision：

```Shell
# install torch
pip install https://developer.download.nvidia.cn/compute/redist/jp/v61/pytorch/torch-2.5.0a0+872d972e41.nv24.08.17622132-cp310-cp310-linux_aarch64.whl
# install torchvision
pip install https://pypi.jetson-ai-lab.dev/jp6/cu126/+f/a83/27a4945ff0bdd/torchvision-0.19.0a0+48b1edf-cp310-cp310-linux_aarch64.whl\#sha256=a8327a4945ff0bddd1c511764a647c9e34a929e2da95b71c0beebb44873afad7
```

## 安装其他依赖

```Shell
pip install -r requirements.txt
```

# 运行测试

```Shell
python test.py
```