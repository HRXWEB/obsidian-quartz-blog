---
title: 
draft: true
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

[EI-45](http://192.168.3.224:8089/browse/EI-45)

---

之前在 jetpack@6.0+ 的开发板上部署，对 layernorm 和各种算子的支持都很完善了，所以部署很顺利。

但是宇树 go2 上的拓展坞上的 orin nx 刷的是 Jetpack 4.6.5 [L4T 32.7.5]

可预见的会碰见很多算子支持不完善的情况，借助此次机会，可以了解如何在 tensorrt 推理中支持自定义的算子

---

# 问题1— layernorm 算子不支持

借鉴 [https://blog.csdn.net/qq_40672115/article/details/140246052](https://blog.csdn.net/qq_40672115/article/details/140246052) 可知，

网上有现成的 layernorm 算子的实现。

集成到部署的代码库里：fg-clip-trt@**[!5](http://192.168.3.224:8081/embodied-ai/fg-clip-trt/-/merge_requests/5)**

# 问题2 — ArgMax 算子不支持 int32 的计算

根据官方文档：

- [https://github.com/onnx/onnx-tensorrt/blob/8.2-EA/docs/operators.md](https://github.com/onnx/onnx-tensorrt/blob/8.2-EA/docs/operators.md)
- [https://github.com/onnx/onnx-tensorrt/blob/8.5-GA/docs/operators.md](https://github.com/onnx/onnx-tensorrt/blob/8.5-GA/docs/operators.md)

即 8.2 和 8.5 的 tensorrt 都不支持 ArgMax@int32

所以需要修改模型。

## 分析

分析模型的结构后发现，很幸运只有一个 ArgMax 算子并且它的前继节点是一个 cast，就是这个 cast node 将数据转为了 int32。

因此一个可能的方案是将 cast node 的操作变成将数据转为 fp32

结合问题1，得到最终的 onnx 模型修改脚本： fg-clip-trt@**[!6](http://192.168.3.224:8081/embodied-ai/fg-clip-trt/-/merge_requests/6)**

# 问题3 — trtexec 报错 could not find any implementaion for node {ForeignNode[onnx::MatMul_5490 + (Unnamed Layer* 62) [Shuffle]………

在这个问题里面发现这个开发者说

[https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://forums.developer.nvidia.com/t/could-not-find-any-implementation-for-node-foreignnode-onnx-matmul-6753-unnamed-layer-1863-shuffle-reshape-41/277670&ved=2ahUKEwi_1PTw3ZiOAxVBKEQIHYiUNDoQrAIoAXoECCEQAg&usg=AOvVaw3CcrCPRL2jKLOv1UFn60ng](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://forums.developer.nvidia.com/t/could-not-find-any-implementation-for-node-foreignnode-onnx-matmul-6753-unnamed-layer-1863-shuffle-reshape-41/277670&ved=2ahUKEwi_1PTw3ZiOAxVBKEQIHYiUNDoQrAIoAXoECCEQAg&usg=AOvVaw3CcrCPRL2jKLOv1UFn60ng)

> I increased `workspace-size` to 6144 but it didn’t fix the issue.

增加了 `workspace-size` ，猜测转模型时是不是也要增加一下。

在 `trtexec -h` 中，看见相应的参数为 `--workspace` 最终验证确实可行。

解决代码见：**[!7](http://192.168.3.224:8081/embodied-ai/fg-clip-trt/-/merge_requests/7)**

```Bash
/usr/src/tensorrt/bin/trtexec --onnx=/home/username/workspace/fg-clip-trt/models/retrieval_model.plugin.onnx --fp16 --saveEngine=/home/username/workspace/fg-clip-trt/models/retrieval_model.plugin_fp16.engine --minShapes=input_ids:1x77,attention_mask:1x77 --optShapes=input_ids:4x77,attention_mask:4x77 --maxShapes=input_ids:4x77,attention_mask:4x77 --plugins=libcustom_layernorm.so --workspace=2048
```

# ✌️最终部署成功

部署代码：**[!8](http://192.168.3.224:8081/embodied-ai/fg-clip-trt/-/merge_requests/8)**

支持 jetpack 4.6.5+

# 使用手册

（导出onnx模型）fg-clip: [http://192.168.3.224:8081/embodied-ai/fg-clip/-/tree/c1c2f7c28508ecec117d646e9e4677e08a596b25](http://192.168.3.224:8081/embodied-ai/fg-clip/-/tree/c1c2f7c28508ecec117d646e9e4677e08a596b25)

（onnx模型量化编译推理）fg-clip-trt：[http://192.168.3.224:8081/embodied-ai/fg-clip-trt/-/tree/27e4a8df9712c195046159b098598c125d26197b](http://192.168.3.224:8081/embodied-ai/fg-clip-trt/-/tree/27e4a8df9712c195046159b098598c125d26197b)

## 1. 导出模型

```Bash
cd /root/of/repo
# 得到 图像编码器模型、文本编码器模型、跨模态检索模型
bash scripts/fgclip_huggingface2onnx.sh export

# 生产输入数据用于 trt 推理
bash scripts/fgclip_huggingface2onnx.sh generate_input
```

## 2. 修改 onnx 模型

主要功能：

- 将 LayerNorm 节点的 type 转为 CustomLayernorm
- 修改 ArgMax 节点的前继 cast 节点，从 .to(int32) 改为 .to(float32)。

```Bash
cd /root/of/repo
python scripts/onnx_model_modifier.py
```

## 3. 生成 engine 文件

```Bash
cd /root/of/repo
python scripts/build_engine.sh
```

## 4. 编译推理

```Bash
cd /root/of/repo
bash build_jetson.sh
./build/trt_inference_one_retrieval -m ./models/retrieval_model_fp16.engine
```