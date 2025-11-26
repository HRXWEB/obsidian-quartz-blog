---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

根据资料 1 操作

# 软硬件环境

1. One of the following Jetson devices:

    `Jetson AGX Orin (64GB)` `Jetson AGX Orin (32GB)` `Jetson Orin NX (16GB)`

2. Running one of the following versions of [JetPack](https://developer.nvidia.com/embedded/jetpack) :

    `JetPack 6.0 (L4T r36.3.0)`

3. Sufficient storage space (preferably with NVMe SSD).
    - `22GB` for `nano_llm` container image
    - Space for models and datasets ( `>15GB` )
4. Clone and setup `[jetson-containers](https://github.com/dusty-nv/jetson-containers/blob/master/docs/setup.md)` :
    
    ```bash
    git clone https://github.com/dusty-nv/jetson-containers
    bash jetson-containers/install.sh
    ```

> [!important] 截止 December 12, 2024 ，虽然官网写的 `JetPack 6` 和 `L4T r36.x` ，但是实操下来一定要是
> 
> 1. `JetPack 6.0`
> 2. `L4T r36.3.0`
> 
> 环境细节：
> 
> ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150258930.png)

# 操作流程

## 下载模型并量化

```bash
jetson-containers run \
  -e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
  $(autotag nano_llm) \
  python3 -m nano_llm.vision.vla --api mlc \
    --model openvla/openvla-7b \
    --quantization q4f16_ft \
    --dataset dusty-nv/bridge_orig_ep100 \
    --dataset-type rlds \
    --max-episodes 10 \
    --save-stats /data/benchmarks/openvla_bridge_int4.json
```

模型会下载到 `jetson-containers/data/models/huggingface/models--openvla--openvla-7b`

量化的模型保存到 `jetson-containers/data/models/mlc/dist/openvla-7b/ctx2048/openvla-7b-q4f16_ft/params`

数据集下载到 `jetson-containers/data/datasets/huggingface/datasets--dusty-nv--bridge_orig_ep100`

## 下载 Stack 数据集

```bash
jetson-containers run \
	-e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
  $(autotag nano_llm) \
  python3 -m mimicgen.generate \
      --tasks Stack_D4 \
      --episodes 100 \
      --output /data/datasets/mimicgen \
      --cameras agentview \
      --camera-width 224 \
      --camera-height 224
```

数据集会下载到 `/data/datasets/mimicgen/demo_src_stack_task_D4/demo.hdf5`

## 将数据转换成 rlds 格式

```bash
jetson-containers run \
	-e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
  $(autotag nano_llm) \
  python3 -m nano_llm.datasets \
        --dataset /data/datasets/mimicgen/demo_src_stack_task_D4/demo.hdf5 \
        --dataset-type mimicgen \
        --convert rlds \
        --remap-keys agentview:image \
        --output /data/datasets/mimicgen/rlds/stack_d4_ep2500
```

## LoRA finetune

```bash
jetson-containers run \
	-e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
  $(autotag openvla) \
  torchrun --standalone --nnodes 1 --nproc-per-node 1 vla-scripts/finetune.py \
      --vla_path openvla/openvla-7b \
      --data_root_dir /data/datasets/mimicgen/rlds \
      --dataset_name stack_d4_ep2500 \
      --run_root_dir /data/models/openvla \
      --lora_rank 32 \
      --batch_size 8 \
      --grad_accumulation_steps 2 \
      --learning_rate 5e-4 \
      --image_aug False \
      --save_steps 250 \
      --epochs 5
```

## 验证模型

使用官方 finetune 的模型

```bash
jetson-containers run \
	-e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
	$(autotag nano_llm) \
  python3 -m nano_llm.vision.vla --api mlc \
    --model dusty-nv/openvla-7b-mimicgen \
    --quantization q4f16_ft \
    --dataset dusty-nv/bridge_orig_ep100 \
    --dataset-type rlds \
    --max-episodes 10 \
    --save-stats /data/benchmarks/openvla_mimicgen_int4.json
```

```bash
vim /opt/NanoLLM/nano_llm/nano_llm.py   # line 390
# 注释 shutil.copy
```

使用自己 finetune 的模型

```bash
jetson-containers run \
	-e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
	$(autotag nano_llm) \
  python3 -m nano_llm.vision.vla --api mlc \
    --model dusty-nv/openvla-7b-mimicgen \
    --quantization q4f16_ft \
    --dataset dusty-nv/bridge_orig_ep100 \
    --dataset-type rlds \
    --max-episodes 10 \
    --save-stats /data/benchmarks/openvla_mimicgen_int4.json
```

## 推理可视化

```bash
jetson-containers run \
	-e http_proxy=$http_proxy \
  -e https_proxy=$https_proxy \
	$(autotag nano_llm) \
  python3 -m nano_llm.studio --load OpenVLA-MimicGen-FP8
 
```

### dev mode

```bash
sudo mkdir -p /workspace/openvla \
&& sudo chown -R username:username /workspace \
&& cd /workspace/openvla \
&& git clone https://github.com/dusty-nv/NanoLLM \
&& sudo docker run --runtime nvidia -itd --network host --shm-size=8g --volume /tmp/argus_socket:/tmp/argus_socket --volume /etc/enctune.conf:/etc/enctune.conf --volume /etc/nv_tegra_release:/etc/nv_tegra_release --volume /tmp/nv_jetson_model:/tmp/nv_jetson_model --volume /var/run/dbus:/var/run/dbus --volume /var/run/avahi-daemon/socket:/var/run/avahi-daemon/socket --volume /var/run/docker.sock:/var/run/docker.sock --volume /workspace/openvla/jetson-containers/data:/data -v /etc/localtime:/etc/localtime:ro -v /etc/timezone:/etc/timezone:ro --device /dev/snd -e PULSE_SERVER=unix:/run/user/1000/pulse/native -v /run/user/1000/pulse:/run/user/1000/pulse --device /dev/bus/usb --device /dev/i2c-0 --device /dev/i2c-1 --device /dev/i2c-2 --device /dev/i2c-3 --device /dev/i2c-4 --device /dev/i2c-5 --device /dev/i2c-6 --device /dev/i2c-7 --device /dev/i2c-8 --device /dev/i2c-9 -v /run/jtop.sock:/run/jtop.sock --name hrx_nanollm -e http_proxy=http://192.168.3.242:2888 -e https_proxy=http://192.168.3.242:2888 -v ${PWD}/NanoLLM:/opt/NanoLLM dustynv/nano_llm:r36.3.0 \
&& sudo docker exec -it -u root hrx_nanollm /bin/bash -c "python3 -m nano_llm.studio --load OpenVLA-MimicGen-FP8"
```

这一步需要下载模型 llama2-7b-hf 模型，但是发现并不好用，手动下载之后再 copy

```bash
huggingface-cli download meta-llama/Llama-2-7b-hf

# 定义函数来复制符号链接指向的文件
copy_symlinks() {
    # 检查是否提供了两个参数
    if [ "$#" -ne 2 ]; then
        echo "Usage: copy_symlinks <source_directory> <destination_directory>"
        return 1
    fi

    local src_dir="$1"
    local dst_dir="$2"

    # 检查源目录是否存在且为目录
    if [ ! -d "$src_dir" ]; then
        echo "Error: Source directory '$src_dir' does not exist or is not a directory."
        return 1
    fi

    # 创建目标目录（如果不存在）
    mkdir -p "$dst_dir"

    # 遍历源目录中的所有符号链接
    for src_link in "$src_dir"/*; do
        # 如果是符号链接，则进行处理
        if [ -L "$src_link" ]; then
            # 获取符号链接的文件名
            link_name=$(basename "$src_link")
            
            # 解析符号链接指向的实际文件路径
            real_file=$(readlink -f "$src_link")
            
            # 检查实际文件是否存在
            if [ ! -e "$real_file" ]; then
                echo "Warning: The target file of symlink '$src_link' does not exist."
                continue
            fi
            
            # 复制实际文件到目标目录，并使用符号链接的名字
            cp --remove-destination "$real_file" "$dst_dir/$link_name" && \
            echo "Copied $real_file to $dst_dir/$link_name"
        fi
    done
}

# 示例调用函数
# copy_symlinks "/path/to/source/directory" "/path/to/destination/directory"
```

然后运行的时候要看见这个过程：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150325734.png)

- **问题1 missing keys in state_dict**

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150348132.png)

    https://github.com/dusty-nv/jetson-containers/issues/634

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150409641.png)

- **问题2 copy file error**
    
    ```bash
    vim /opt/NanoLLM/nano_llm/nano_llm.py
    # 注释
     line 390
    ```

# 问题

## 模型节点不在 agent studio 出现

1. 进入容器下载 llama-2-7b-hf
    
    ```bash
    huggingface-cli download meta-llama/Llama-2-7b-hf
    ```
    
2. 删除 llm 目录

    https://github.com/dusty-nv/jetson-containers/issues/634

## 'sinkpad' should not be nullptr

https://github.com/dusty-nv/jetson-containers/issues/687

作者本身没有给回复，但是从这个情况来看是升级到 6.1 之后出现的问题，这也是为什么在 中要求安装 `JetPack 6.0`

## 读取文件失败： what(): basic_filebuf::underflow error reading the file: Is a directory

==**具体错误：**==

```bash
[gstreamer] initialized gstreamer, version 1.20.3.0
[gstreamer] gstEncoder -- codec not specified, defaulting to H.264
failed to find/open file /proc/device-tree/model
terminate called after throwing an instance of 'std::__ios_failure'
  what():  basic_filebuf::underflow error reading the file: Is a directory
Fatal Python error: Aborted

Current thread 0x0000ffffbcf40ca0 (most recent call first):
  File "/opt/NanoLLM/nano_llm/plugins/video/video_output.py", line 46 in __init__
  File "/opt/NanoLLM/nano_llm/plugins/dynamic_plugin.py", line 35 in __new__
  File "/opt/NanoLLM/nano_llm/agents/dynamic_agent.py", line 65 in add_plugin
  File "/opt/NanoLLM/nano_llm/agents/dynamic_agent.py", line 241 in set_state_dict
  File "/usr/lib/python3.10/threading.py", line 953 in run
  File "/opt/NanoLLM/nano_llm/agents/dynamic_agent.py", line 207 in set_state_dict
  File "/opt/NanoLLM/nano_llm/agents/dynamic_agent.py", line 350 in load
  File "/opt/NanoLLM/nano_llm/agents/dynamic_agent.py", line 54 in __init__
  File "/opt/NanoLLM/nano_llm/studio.py", line 17 in <module>
  File "/usr/lib/python3.10/runpy.py", line 86 in _run_code
  File "/usr/lib/python3.10/runpy.py", line 196 in _run_module_as_main
```

==**错误分析：**==

错误的重点是 `Is a directory` ，最终发现问题在这个讨论[https://forums.developer.nvidia.com/t/opengl-failed-to-create-x11-window-when-using-videooutput-in-container/270118/4](https://forums.developer.nvidia.com/t/opengl-failed-to-create-x11-window-when-using-videooutput-in-container/270118/4)里面有说到。

排查后发现 `/tmp/nv_jetson_model` 本应该是一个文件的，不知道为什么变成了一个目录。

==**解决方案：**==

```bash
sudo rm -rf /tmp/nv_jetson_model
cat /proc/device-tree/model > /tmp/nv_jetson_model
```

# 参考资料

1. [https://www.jetson-ai-lab.com/openvla.html#__tabbed_1_1](https://www.jetson-ai-lab.com/openvla.html#__tabbed_1_1)