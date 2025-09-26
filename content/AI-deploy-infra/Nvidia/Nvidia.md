# Jetson board

[[orin-flash]]

[[Nvidia-Linux-Archive]]

[[Nvidia-Linux-Developer-Guide]]

[[AGX-Orin]]

[[NanoLLM]]

---

# Courses

## Open Source

[[accelerated-computing-hub]]

## Deep Learning Insititute

[[Nvidia——使用CUDA加速python应用]]

---

# Robotics

[[Issac-Sim-4.5-release-note]]

---

# Inference

[[Tensorrt-wise]]

[[Triton-Inference-Server入门]]

[[triton-server+vllm+orin]]

[[transformers部署minicpm-3-1b-sft-v1]]

[[如何给triton-inference-server增加后端]]

[[Nvidia/NanoLLM|NanoLLM]]

---

# GPU 术语

[[gpu术语]]

[[SIMT]]

SM发展历史：[https://fabiensanglard.net/cuda/](https://fabiensanglard.net/cuda/)

[[CUDA、CUDA-Toolkit、NVCC、cuDNN的关系]]

[[CUDA-Driver-API-v.s.-CUDA-Runtime-API]]

---

# CUDA

[[CUDA版本管理cuda_switcher.sh]]

[[安装cuda-toolkit]]

# Jetson 最佳实践

- 镜像管理：docker 镜像拉取之后上传到私有的 docker hub，否则网速真的影响体验
- 大模型管理：先在服务器本地下载模型，避免之后刷机模型文件就丢了，。在传输文件时需要保持 symbolic links，且已知 scp 网络传输比 rsync 更快（因为用的多线程）：
    
    ```Bash
    # tar 命令默认保持 link，如果想作为普通文件，那就 -cvhf（即加上 -h 参数）
    tar -cvf - /path/to/local_source_dir | ssh user@remote_host "tar -C /path/to/remote_destination_dir -xvf -"
    ```
    

[[如何清理docker空间]]