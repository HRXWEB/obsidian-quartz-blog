---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 3:18:04 pm
---

一开始做了很多尝试性的工作，做了一个简单的记录：

# 尝试性的工作

## 跟目录结构

```Plain
.
├── model_download
│   └── huggingface
│       └── hub
│           └── models--google--gemma-3-1b-it
│               ├── blobs
│               ├── refs
│               └── snapshots
│                   └── dcc83ea841ab6100d6b47a070329e1ba4cf78752
└── model_repository
    ├── gemma3_1b
    │   └── 1
    └── llama3_8b
        └── 1
```

## 启动容器

```Shell
source ~/proxy.sh
docker run --runtime nvidia -it --rm -p 8000:8000 -p 8002:8002 -p 8001:8001 \\
-e http_proxy=$http_proxy \\
-e https_proxy=$https_proxy \\
-e no_proxy=$no_proxy \\
-e all_proxy=$all_proxy \\
-e HF_TOKEN=$HF_TOKEN \\
--net=host \\
--ipc=host \\
-v ${PWD}:/work -w /work \\
--privileged \\
nvcr.io/nvidia/tritonserver:25.04-vllm-python-py3
```

## 登录huggingface

```Shell
huggingface-cli login --token $HF_TOKEN
```

## 启动triton server

```Shell
tritonserver --model-repository model_repository --model-control-mode=explicit
```

## 加载模型

```Shell
curl -X POST localhost:8000/v2/repository/models/gemma3_1b/load
```

## 问题 1

load 模型时，报错：

| RuntimeError: CUDA error: no kernel image is available for execution on the device

首先简化问题，定位到这是 vllm 在初始化模型时报的错误，因为先验证 vllm 是否正常工作：

```Shell
python3 -m vllm.entrypoints.openai.api_server --model "google/gemma-3-1b-it"
```

依然报错：

> RuntimeError: Cannot re-initialize CUDA in forked subprocess. To use CUDA with multiprocessing, you must use the 'spawn' start method

在 github 上搜索，发现有人遇到同样的问题，并给出了[答案](https://github.com/vllm-project/vllm/issues/8893)，

```Shell
export VLLM_WORKER_MULTIPROC_METHOD=spawn
python3 -m vllm.entrypoints.openai.api_server --model "google/gemma-3-1b-it"
```

此时复现了之前的错误，

> RuntimeError: CUDA error: no kernel image is available for execution on the device

说明成功简化了问题，那就专注于解决 vllm 加载模型的问题

### 猜测 1

这段 warning 是不是报错的原因，驱动的版本太低

> WARNING: CUDA Minor Version Compatibility mode ENABLED.  
> Using driver version 540.4.0 which has support for CUDA 12.6. This container  
> was built with CUDA 12.9 and will be run in Minor Version Compatibility mode.  
> CUDA Forward Compatibility is preferred over Minor Version Compatibility for use  
> with this container but was unavailable:  
> [[No CUDA-capable device is detected (CUDA_ERROR_NO_DEVICE) cuInit()=100]]  
> See https://docs.nvidia.com/deploy/cuda-compatibility/ for details.

jetson 的设计理念上，是不允许升级驱动的，驱动本身是 BSP 提供的，如果需要升级驱动，需要重新烧录 BSP。但是现在已经使用的是最新版本的 JetPack 6.2，所以这个 warning 应该不是报错的原因。是的话也没法解决。

### 猜测 2

针对问题本身，github 上确实有一个类似的 issue ：

> [!info] ARM aarch-64 server build failed (host OS: Ubuntu22.04.3) · Issue #2021 · vllm-project/vllm  
> do as: https://docs.  
> [https://github.com/vllm-project/vllm/issues/2021#issuecomment-2503716187](https://github.com/vllm-project/vllm/issues/2021#issuecomment-2503716187)  

回复里面提到了 vllm 应该对 jetson 是有支持的 feat ：

https://github.com/vllm-project/vllm/pull/9735

但是为什么不行还是没有一个合理的解释，而且里面都是直接安装的 vllm。和 triton server 没关系。

---

# 解决思路分析

‼️后来看到这个 [https://github.com/triton-inference-server/server/issues/6373](https://github.com/triton-inference-server/server/issues/6373) 之后就发现了大无语事件。

里面提到：

> Triton does not currently release a Jetson-compatible container.

再然后看到 release note 里面对 `25.04` 版本的描述：[https://github.com/triton-inference-server/server/releases/tag/v2.57.0](https://github.com/triton-inference-server/server/releases/tag/v2.57.0)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151531161.png)

> **iGPU (Integrated Graphics Processing Unit):**
> 
> - 这是一个**硬件组件的类型**。
> - 指的是**集成在 CPU (或 SoC - 片上系统) 芯片内部的图形处理单元**。与独立的显卡 (Discrete GPU, dGPU) 不同，iGPU 与 CPU 共享系统内存。

‼️ 所以想在针对 jetson 发布的镜像，应该都是带 `igpu` 这个 tag 的 ‼️

然后在 [https://catalog.ngc.nvidia.com/orgs/nvidia/containers/tritonserver/tags](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/tritonserver/tags) 查找发布的镜像

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151540702.png)

> [!important] 很遗憾，就没有考虑 vllm 作为后端。

---

## 一篇很契合的工作

> [!info] Inferencing with vLLM and Triton on NVIDIA Jetson AGX Orin  
> This tutorial shows how to run Large language models using the NVIDIA Triton and vLLM on the NVIDIA Jetson AGX Orin 64GB Developer Kit.  
> [https://www.hackster.io/shahizat/inferencing-with-vllm-and-triton-on-nvidia-jetson-agx-orin-e546a9](https://www.hackster.io/shahizat/inferencing-with-vllm-and-triton-on-nvidia-jetson-agx-orin-e546a9)  

这篇文章也是就是 triton server + vLLM + orin 的组合。看起来确实顺利跑起来了。

但是它用的 docker image 是自己打包的。不知道它是怎么打包的。

## 扩展适用于 jetson 的 triton-server-igpu docker image

> [!info] Triton Inference Server on Nvidia Jetson using K3s and MinIO  
> In this blog, I’ll demonstrate the deployment of NVIDIA Triton Inference server on NVIDIA Jetson AGX Orin Dev Kit using K3s and Minio S3.  
> [https://www.hackster.io/shahizat/triton-inference-server-on-nvidia-jetson-using-k3s-and-minio-cbcfe3](https://www.hackster.io/shahizat/triton-inference-server-on-nvidia-jetson-using-k3s-and-minio-cbcfe3)  

其中有一个章节是：

> **Building Triton Inference Server from Source with S3 Support**
> 
> The official Docker image of Triton Inference Server does not include S3 support by default for the `igpu` images. To enable S3 support, we need to build the server from source.
> 
> Here is the docker command example without S3 support
> 
> ```Bash
> docker run --runtime nvidia --rm --net=host -v ${PWD}/model_repository:/models nvcr.io/nvidia/tritonserver:24.07-py3-igpu tritonserver --model-repository=/models
> ```

# 解决方法

经过上面的分析，只能自己从源码构建一个支持 vllm 后端的镜像了。

- **结合下列：**
    - [https://github.com/triton-inference-server/vllm_backend/tree/main](https://github.com/triton-inference-server/vllm_backend/tree/main) 给出的方法：
        
        ```Bash
        # YY.MM is the version of Triton.
        export TRITON_CONTAINER_VERSION=<YY.MM>
        ./build.py -v  --enable-logging
                        --enable-stats
                        --enable-tracing
                        --enable-metrics
                        --enable-gpu-metrics
                        --enable-cpu-metrics
                        --enable-gpu
                        --filesystem=gcs
                        --filesystem=s3
                        --filesystem=azure_storage
                        --endpoint=http
                        --endpoint=grpc
                        --endpoint=sagemaker
                        --endpoint=vertex-ai
                        --upstream-container-version=${TRITON_CONTAINER_VERSION}
                        --backend=python:r${TRITON_CONTAINER_VERSION}
                        --backend=vllm:r${TRITON_CONTAINER_VERSION}
                        --backend=ensemble
        ```
        
    - [https://www.hackster.io/shahizat/triton-inference-server-on-nvidia-jetson-using-k3s-and-minio-cbcfe3](https://www.hackster.io/shahizat/triton-inference-server-on-nvidia-jetson-using-k3s-and-minio-cbcfe3) 给出的方法：
        
        ```Bash
        #!/usr/bin/env bash
        
        TRITON_VERSION="${1}"
        [[ -z "${TRITON_VERSION}" ]] && TRITON_VERSION="24.08"
        
        IMAGE_NAME="tritonserver"
        OFFICIAL_MIN_IMAGE_TAG="${TRITON_VERSION}-py3-igpu-min"
        CUSTOM_IMAGE_TAG="${TRITON_VERSION}-igpu-s3"
        
        # Create a directory for Triton and clone the repository
        rm -rf triton
        mkdir triton && cd triton
        git clone --recurse-submodules https://github.com/triton-inference-server/server.git
        cd server
        
        # Checkout the desired Triton version
        git checkout "r${TRITON_VERSION}"
        
        # Build the Triton Inference Server
        sudo python3 build.py \
            --build-parallel 10 \
            --no-force-clone \
            --target-platform igpu \
            --target-machine aarch64 \
            --filesystem s3 \
            --enable-gpu \
            --enable-mali-gpu \
            --enable-metrics \
            --enable-logging \
            --enable-stats \
            --enable-cpu-metrics \
            --enable-nvtx \
            --backend onnxruntime \
            --backend pytorch \
            --backend tensorflow \
            --backend python \
            --backend tensorrt \
            --endpoint http \
            --endpoint grpc \
            --min-compute-capability "5.3" \
            --image "base,nvcr.io/nvidia/${IMAGE_NAME}:${OFFICIAL_MIN_IMAGE_TAG}" \
            --image "gpu-base,nvcr.io/nvidia/${IMAGE_NAME}:${OFFICIAL_MIN_IMAGE_TAG}"
        
        # Tag the image locally without pushing to a registry
        docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:${CUSTOM_IMAGE_TAG}"
        
        echo "Docker image '${IMAGE_NAME}:${CUSTOM_IMAGE_TAG}' created successfully."
        ```

得到一个支持 vllm 后端的 triton server docker image 构建脚本 `build_triton.sh` ：

```Bash
#!/usr/bin/env bash

TRITON_VERSION="${1}"
[[ -z "${TRITON_VERSION}" ]] && TRITON_VERSION="25.04"

IMAGE_NAME="tritonserver"
OFFICIAL_MIN_IMAGE_TAG="${TRITON_VERSION}-py3-igpu-min"
CUSTOM_IMAGE_TAG="${TRITON_VERSION}-igpu-vllm-py3"

# Create a directory for Triton and clone the repository
rm -rf triton
mkdir triton && cd triton
git clone --recurse-submodules https://github.com/triton-inference-server/server.git
cd server

# Checkout the desired Triton version
git checkout "r${TRITON_VERSION}"

# Build the Triton Inference Server
sudo python3 build.py \
    --build-parallel 10 \
    --no-force-clone \
    --target-platform igpu \
    --target-machine aarch64 \
    --enable-gpu \
    --enable-mali-gpu \
    --enable-metrics \
    --enable-logging \
    --enable-stats \
    --enable-cpu-metrics \
    --enable-nvtx \
    --backend python:r${TRITON_VERSION} \
    --backend vllm:r${TRITON_VERSION} \
    --endpoint http \
    --endpoint grpc \
    --min-compute-capability "5.3" \
    --image "base,nvcr.io/nvidia/${IMAGE_NAME}:${OFFICIAL_MIN_IMAGE_TAG}" \
    --image "gpu-base,nvcr.io/nvidia/${IMAGE_NAME}:${OFFICIAL_MIN_IMAGE_TAG}"

# Tag the image locally without pushing to a registry
docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:${CUSTOM_IMAGE_TAG}"

echo "Docker image '${IMAGE_NAME}:${CUSTOM_IMAGE_TAG}' created successfully."
```

---

编译的时候会出现网络的问题，需要做一些

## 准备工作

- 修改 `triton-inference-server/server/build.py` 文件

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151641970.png)

- `代理打开 ALLOW LAN`

---

## 构建

```Bash
./build_triton.sh 25.04
```

---

又出现了

## ~~问题 1 （看后面的结论，这个问题及问题 2 都不会出现的）~~

```Plain
156.2 ERROR: Could not find a version that satisfies the requirement triton==3.2.0; platform_machine != "ppc64le" (from vllm) (from versions: none)                                                                                     
156.2 ERROR: No matching distribution found for triton==3.2.0; platform_machine != "ppc64le"
```

~~找到了相应的解决方法：~~

https://github.com/vllm-project/vllm-ascend/issues/581

---

~~但是这种解决方法后续会导致错误：~~

## ~~问题 2~~

```Plain
python3 -m vllm.entrypoints.openai.api_server --model "google/gemma-3-1b-it"
INFO 05-15 15:10:19 [__init__.py:239] Automatically detected platform cuda.
Traceback (most recent call last):
  File "<frozen runpy>", line 189, in _run_module_as_main
  File "<frozen runpy>", line 112, in _get_module_details
  File "/usr/local/lib/python3.12/dist-packages/vllm/__init__.py", line 12, in <module>
    from vllm.engine.arg_utils import AsyncEngineArgs, EngineArgs
  File "/usr/local/lib/python3.12/dist-packages/vllm/engine/arg_utils.py", line 16, in <module>
    from vllm.config import (CacheConfig, CompilationConfig, ConfigFormat,
  File "/usr/local/lib/python3.12/dist-packages/vllm/config.py", line 30, in <module>
    from vllm.model_executor.layers.quantization import (QUANTIZATION_METHODS,
  File "/usr/local/lib/python3.12/dist-packages/vllm/model_executor/__init__.py", line 3, in <module>
    from vllm.model_executor.parameter import (BasevLLMParameter,
  File "/usr/local/lib/python3.12/dist-packages/vllm/model_executor/parameter.py", line 9, in <module>
    from vllm.distributed import get_tensor_model_parallel_rank
  File "/usr/local/lib/python3.12/dist-packages/vllm/distributed/__init__.py", line 3, in <module>
    from .communication_op import *
  File "/usr/local/lib/python3.12/dist-packages/vllm/distributed/communication_op.py", line 8, in <module>
    from .parallel_state import get_tp_group
  File "/usr/local/lib/python3.12/dist-packages/vllm/distributed/parallel_state.py", line 122, in <module>
    from vllm.platforms import current_platform
  File "/usr/local/lib/python3.12/dist-packages/vllm/platforms/__init__.py", line 271, in __getattr__
    _current_platform = resolve_obj_by_qualname(
                        ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/dist-packages/vllm/utils.py", line 2009, in resolve_obj_by_qualname
    module = importlib.import_module(module_name)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/importlib/__init__.py", line 90, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/dist-packages/vllm/platforms/cuda.py", line 15, in <module>
    import vllm._C  # noqa
    ^^^^^^^^^^^^^^
ModuleNotFoundError: No module named 'vllm._C'
```

~~对比了一下 ngc 的 docker 镜像和我自己编译的镜像，发现：~~

- ~~官方：~~
    
    ```Plain
    $ ls /usr/local/lib/python3.12/dist-packages/vllm
    _C.abi3.so           _ipex_ops.py     attention       core                     entrypoints         jsontree.py        model_executor  pooling_params.py   scalar_type.py  third_party         utils.py
    __init__.py          _moe_C.abi3.so   beam_search.py  cumem_allocator.abi3.so  envs.py             logger.py          multimodal      profiler            scripts.py      tracing.py          v1
    __pycache__          _version.py      compilation     device_allocator         executor            logging_utils      outputs.py      prompt_adapter      sequence.py     transformers_utils  version.py
    _custom_ops.py       adapter_commons  config.py       distributed              forward_context.py  logits_process.py  platforms       py.typed            spec_decode     triton_utils        vllm_flash_attn
    _flashmla_C.abi3.so  assets           connections.py  engine                   inputs              lora               plugins         sampling_params.py  test_utils.py   usage               worker
    ```
    
- ~~自编：~~
    
    ```Plain
    $ ls /usr/local/lib/python3.12/dist-packages/vllm
    __init__.py     adapter_commons  compilation       distributed      executor            logging_utils      outputs.py         prompt_adapter      scripts.py     tracing.py          v1
    __pycache__     assets           config.py         engine           forward_context.py  logits_process.py  platforms          py.typed            sequence.py    transformers_utils  version.py
    _custom_ops.py  attention        connections.py    entrypoints      inputs              lora               plugins            reasoning           spec_decode    triton_utils        vllm_flash_attn
    _ipex_ops.py    beam_search.py   core              env_override.py  jsontree.py         model_executor     pooling_params.py  sampling_params.py  test_utils.py  usage               worker
    _version.py     benchmarks       device_allocator  envs.py          logger.py           multimodal         profiler           scalar_type.py      third_party    utils.py
    ```

~~可以发现缺少了 so 库，整个文件夹的内容很不一样。~~

> [!important] ==**结论**==：不能用 [https://github.com/vllm-project/vllm-ascend/issues/581](https://github.com/vllm-project/vllm-ascend/issues/581) 描述的方法，其实是 build.py 写错了。25.04 对应的版本应该是 0.8.1，装这个版本的 vllm 就没有这个问题了。

## 问题 3

```Plain
ImportError: /usr/local/lib/python3.12/dist-packages/vllm/_C.abi3.so: undefined symbol: _ZN3c108ListType3getERKNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEEENS_4Type24SingletonOrSharedTypePtrIS9_EE
```

> 交给大模型分析：
> 
> - 符号名 `_ZN3c108ListType3get...` 看起来是经过 C++ 名称重整 (name mangling) 后的名字。`c10` 通常是 PyTorch (libtorch) 中的一个核心命名空间。这个符号很可能是在 PyTorch 的某个版本中定义的 `c10::ListType::get` 方法。
> - 错误表明，`vllm/_C.abi3.so` 在编译时依赖于某个版本的 PyTorch 库，并使用了其中定义的 `c10::ListType::get` 函数。但在你的系统上加载 `vllm/_C.abi3.so` 时，动态链接器未能找到这个符号的定义，这通常意味着：
>     - **PyTorch 没有正确安装**，或者安装的版本不对。
>     - **安装的 PyTorch 版本与编译** `**vllm/_C.abi3.so**` **时使用的 PyTorch 版本不兼容**。这个符号的签名（函数参数、返回类型等）可能在 PyTorch 的不同版本之间发生了变化，导致名称重整后的符号名不匹配。这是使用依赖特定 C++ 库的 Python 扩展时非常常见的问题。

一开始我去看官方提供的镜像里面，是 `torch 2.7.0a0+79aa17489c.nv25.4`，所以直接

```Plain
pip install torch==2.7.0
```

但是后面就出现了这样的**问题**：

```Plain
  File "<frozen importlib._bootstrap>", line 1412, in _handle_fromlist
  File "/usr/local/lib/python3.12/dist-packages/transformers/utils/import_utils.py", line 1955, in __getattr__
    module = self._get_module(self._class_to_module[name])
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/dist-packages/transformers/utils/import_utils.py", line 1969, in _get_module
    raise RuntimeError(
RuntimeError: Failed to import transformers.processing_utils because of the following error (look up to see its traceback):
operator torchvision::nms does not exist
```

找到了这个相关的资料：

> [!info] PyTorch and Torvision version issue: RuntimeError: operator torchvision::nms does not exist  
> Hello.  
> [https://forums.developer.nvidia.com/t/pytorch-and-torvision-version-issue-runtimeerror-operator-torchvision-nms-does-not-exist/312446](https://forums.developer.nvidia.com/t/pytorch-and-torvision-version-issue-runtimeerror-operator-torchvision-nms-does-not-exist/312446)  

分析来看，Nvidia 有自己打包的 torch 版本，一定要完全匹配 `torch 2.7.0a0+79aa17489c.nv25.4`

还找到了辅证的材料：

> [!info] Installing PyTorch for Jetson Platform  
> This guide provides instructions for installing PyTorch for Jetson Platform.  
> [https://docs.nvidia.com/deeplearning/frameworks/install-pytorch-jetson-platform/index.html](https://docs.nvidia.com/deeplearning/frameworks/install-pytorch-jetson-platform/index.html)  

---

问题 3 分析总结并深入：

1. 需要安装 nvidia 维护的 torch: [https://pypi.jetson-ai-lab.dev/jp6/cu126/torch/2.7.0#nvidia-jetson-platforms](https://pypi.jetson-ai-lab.dev/jp6/cu126/torch/2.7.0#nvidia-jetson-platforms)
2. 点击上面链接中的超文本 [Simple index](https://pypi.jetson-ai-lab.dev/jp6/cu126/+simple/torch) ，发现针对 cp310 的版本。

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151727440.png)

3. 在 server 的 [https://github.com/triton-inference-server/server/blob/d79c4f11ed08572571b2eac99e0dac268e38cf9b/docs/introduction/compatibility.md?plain=1#L55](https://github.com/triton-inference-server/server/blob/d79c4f11ed08572571b2eac99e0dac268e38cf9b/docs/introduction/compatibility.md?plain=1#L55) 文档里面详细说明了兼容性的问题。

    | | | | | | | |

    |---|---|---|---|---|---|---|

    |Triton release version|NGC Tag|Python version|vLLM version|CUDA version|CUDA Driver version|Size|

    |25.04|nvcr.io/nvidia/tritonserver:25.04-vllm-python-py3|Python 3.12.3|0.8.1+5f4af9e0.nv25.4.cu129|12.9.0.036|575.51.02|10G|

    |25.03|nvcr.io/nvidia/tritonserver:25.03-vllm-python-py3|Python 3.12.3|0.7.3+04de634a.nv25.3.cu128|12.8.1.012|570.124.06|22G|

    |25.02|nvcr.io/nvidia/tritonserver:25.02-vllm-python-py3|Python 3.12.3|0.7.0+5e800e3d.nv25.2.cu128|12.8.0.038|570.86.10|22G|

    |25.01|nvcr.io/nvidia/tritonserver:25.01-vllm-python-py3|Python 3.12.3|0.6.3.post1|12.8.0.038|570.86.10|23G|

    |24.12|nvcr.io/nvidia/tritonserver:24.12-vllm-python-py3|Python 3.12.3|0.5.5|12.6.3.004|560.35.05|20G|

    |24.11|nvcr.io/nvidia/tritonserver:24.11-vllm-python-py3|Python 3.12.3|0.5.5|12.6.3.001|560.35.05|22.1G|

    |24.10|nvcr.io/nvidia/tritonserver:24.10-vllm-python-py3|Python 3.10.12|0.5.5|12.6.2.004|560.35.03|21G|

    |24.09|nvcr.io/nvidia/tritonserver:24.09-vllm-python-py3|Python 3.10.12|0.5.3.post1|12.6.1.006|560.35.03|19G|

    |24.08|nvcr.io/nvidia/tritonserver:24.08-vllm-python-py3|Python 3.10.12|0.5.0 post1|12.6.0.022|560.35.03|19G|

    |24.07|nvcr.io/nvidia/tritonserver:24.07-vllm-python-py3|Python 3.10.12|0.5.0 post1|12.5.1|555.42.06|19G|

    |24.06|nvcr.io/nvidia/tritonserver:24.06-vllm-python-py3|Python 3.10.12|0.4.3|12.5.0.23|555.42.02|18G|

    |24.05|nvcr.io/nvidia/tritonserver:24.05-vllm-python-py3|Python 3.10.12|0.4.0 post1|12.4.1|550.54.15|18G|

    |24.04|nvcr.io/nvidia/tritonserver:24.04-vllm-python-py3|Python 3.10.12|0.4.0 post1|12.4.1|550.54.15|17G|

4. 因为官方目前只提供 cp310 版本的 torch，需要自行编译这个版本：

    | | | | | | | |

    |---|---|---|---|---|---|---|

    |Triton release version|NGC Tag|Python version|vLLM version|CUDA version|CUDA Driver version|Size|

    |24.10|nvcr.io/nvidia/tritonserver:24.10-vllm-python-py3|Python 3.10.12|0.5.5|12.6.2.004|560.35.03|21G|

> [!important] 在自行编译这个版本之前，得看一下 vLLM 0.5.5 这个版本的 release note，对模型的支持力度怎么样。

### vLLM 0.5.5 supported model 简单调研

> [!info] Supported Models — vLLM  
> vLLM supports a variety of generative Transformer models in HuggingFace Transformers.  
> [https://docs.vllm.ai/en/v0.5.5/models/supported_models.html#multimodal-language-models](https://docs.vllm.ai/en/v0.5.5/models/supported_models.html#multimodal-language-models)  

现在是拿到一个 minicpm-v-3 版本的模型，这边只支持到 2_6，只能先试试看了。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151744363.png)

尝试后 vLLM 0.5.5 安装会出现问题，经过分析发现这个版本是没法支持 jetson的：

- vLLM 发布 0.5.5 的时间是 2024/08/24:

    [https://github.com/vllm-project/vllm/releases/tag/v0.5.5](https://github.com/vllm-project/vllm/releases/tag/v0.5.5)

- 支持 AGX orin 的特性是在 2024/11/27 合入的：

    https://github.com/vllm-project/vllm/pull/9735

所以 vLLM 最起码要选择 2024/12/18 号发布的 `v0.6.5` [https://github.com/vllm-project/vllm/releases/tag/v0.6.5](https://github.com/vllm-project/vllm/releases/tag/v0.6.5) 才可以。

> [!important] 互相卡版本，看起来这个方案可以判死刑了。不知道这个文章的作者是怎么解决这个兼容性的问题的：
> 
> > [!info] Inferencing with vLLM and Triton on NVIDIA Jetson AGX Orin  
> > This tutorial shows how to run Large language models using the NVIDIA Triton and vLLM on the NVIDIA Jetson AGX Orin 64GB Developer Kit.  
> > [https://www.hackster.io/shahizat/inferencing-with-vllm-and-triton-on-nvidia-jetson-agx-orin-e546a9](https://www.hackster.io/shahizat/inferencing-with-vllm-and-triton-on-nvidia-jetson-agx-orin-e546a9)  

---

**柳暗花明又一村：**

发现官方对 vLLM 后端在 Jetson 平台上是有考虑支持的，只不过要很新的版本。对比一下 `r24.10` 和 `r25.04` 的构建脚本 `build.py` ：

r24.10

https://github.com/triton-inference-server/server/blob/e0f0734d61c789535ac58c22b79d67eabc5d7477/build.py\#L1417

```Python
    if "vllm" in backends:
        df += """
# vLLM needed for vLLM backend
RUN pip3 install vllm=={}
""".format(
            TRITON_VERSION_MAP[FLAGS.version][6]
        )
```

r25.04

https://github.com/triton-inference-server/server/blob/d79c4f11ed08572571b2eac99e0dac268e38cf9b/build.py\#L1482

```Python
    if "vllm" in backends:
        df += f"""
ARG BUILD_PUBLIC_VLLM="true"
ARG VLLM_INDEX_URL
ARG PYTORCH_TRITON_URL
ARG NVPL_SLIM_URL

RUN --mount=type=secret,id=req,target=/run/secrets/requirements \\
    if [ "$BUILD_PUBLIC_VLLM" = "false" ]; then \\
        if [ "$(uname -m)" = "x86_64" ]; then \\
            pip3 install --no-cache-dir \\
                mkl==2021.1.1 \\
                mkl-include==2021.1.1 \\
                mkl-devel==2021.1.1; \\
        elif [ "$(uname -m)" = "aarch64" ]; then \\
            echo "Downloading NVPL from: $NVPL_SLIM_URL" && \\
            cd /tmp && \\
            wget -O nvpl_slim_24.04.tar $NVPL_SLIM_URL && \\
            tar -xf nvpl_slim_24.04.tar && \\
            cp -r nvpl_slim_24.04/lib/* /usr/local/lib && \\
            cp -r nvpl_slim_24.04/include/* /usr/local/include && \\
            rm -rf nvpl_slim_24.04.tar nvpl_slim_24.04; \\
        fi \\
        && pip3 install --no-cache-dir --progress-bar on --index-url $VLLM_INDEX_URL -r /run/secrets/requirements \\
        # Need to install in-house build of pytorch-triton to support triton_key definition used by torch 2.5.1
        && cd /tmp \\
        && wget $PYTORCH_TRITON_URL \\
        && pip install --no-cache-dir /tmp/pytorch_triton-*.whl \\
        && rm /tmp/pytorch_triton-*.whl; \\
    else \\
        # public vLLM needed for vLLM backend
        pip3 install vllm=={DEFAULT_TRITON_VERSION_MAP["vllm_version"]}; \\
    fi

ARG PYVER=3.12
ENV LD_LIBRARY_PATH /usr/local/lib:/usr/local/lib/python${{PYVER}}/dist-packages/torch/lib:${{LD_LIBRARY_PATH}}
"""
```

可以看到 `r25.04` （分析源码可知是从 `r25.01` 开始支持的）官方已经考虑到指定 index_url 去安装 vLLM，这个 index_url 就是下图中的 simple index 链接的[地址](https://pypi.jetson-ai-lab.dev/jp6/cu126/+simple/vllm)：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151800809.png)

> [!important] 但是！经过遍历查询， `r25.04` 之前的版本都没有对架构的判断：
> 
> ```Shell
> if [ "$(uname -m)" = "x86_64" ]; then \\
>     ...
>     ...
> elif [ "$(uname -m)" = "aarch64" ]; then \\
>     echo "Downloading NVPL from: $NVPL_SLIM_URL" && \\
>     ...
>     ...
> fi
> ```
> 
> 而 nvpl_slim 这个下载的地址 `NVPL_SLIM_URL` 在 May 18, 2025 确实是没有找到在哪里。
> 
> 不过在 support issue
> 
> https://github.com/triton-inference-server/server/issues/8211
> 
> 里面顺带提了这个事:
> 
> > where to find the NVPL_SLIM tarball? Is there a method for user to control the nvpl_slim_url? （NVPL_SLIM_URL） 这个变量用户没办法控制。

---

使用 24.10 改了一些代码，自行安装 vLLM、triton、torch 发现还是不太行。又复现了：

```Shell
operator torchvision::nms does not exist
```