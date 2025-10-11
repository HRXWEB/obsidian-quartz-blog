---
title: RDK部署踩坑经验总结
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-11T16:55:08.088+08:00
---

# 去掉反量化算子

> [!info] 反量化节点的融合实现  
> 近年来，基于深度学习的方法在图像分类、目标检测、实例分割等任务上取得了巨大的成就，这样的成就得益于神经网络模型的深层次结构和庞大的模型参数量。但是，庞大的参数量意味着很难将模型部署到资源受限的边缘设备中，比如智能手机、智能穿戴设备、无人机、机器人、自动驾驶汽车等，这些设备通常对神经网络的执行过程有着严格的时间限制或者在长期执行时对功耗有着严苛的要求。因此，迫切需要优化模型的技术，以减少模型尺寸、实现更低的功耗和更快的推理速度。 量化将信号的连续取值（float32）近似为有限多个离散值（int8等），是减少神经网络模型计算时间和功耗最常用的手段。但是，神经网络量化后引入的量化/反量化节点，在进行逐点elementwise运算过程中需要消耗大量时间进行数据遍历，严重影响量化模型推理的性能。为了减少计算时间，在模型部署实践中通常将反量化并入模型的后处理环节进行计算，以减少数据重复遍历的时间消耗，称为反量化节点融合。 如下表为efficientdetd0模型反量化节点融合前后在Horzion XJ3开发板上的性能，显然，当把反量化节点融入到模型的后处理后，模型的性能具有以下变化： .  
> [https://forum.d-robotics.cc/t/topic/25001](https://forum.d-robotics.cc/t/topic/25001)  

> [!important] 当去掉反量化算子之后，输出 tensor 的 alignedshape 和 validshape 是不一致的

tensor 属性如下：

```C++
typedef struct {
  hbDNNTensorShape validShape;
  hbDNNTensorShape alignedShape;
  int32_t tensorLayout;
  int32_t tensorType;
  hbDNNQuantiShift shift;
  hbDNNQuantiScale scale;
  hbDNNQuantiType quantiType;
  int32_t quantizeAxis;
  int32_t alignedByteSize;
  int32_t stride[HB_DNN_TENSOR_MAX_DIMENSIONS];
} hbDNNTensorProperties;
```

具体来说，比如有一个模型的浮点输出 `validShape = 1x448x1280x`==`**1**`==，编译后的输出则是 `alignedShape = 1x448x1280x`==`**8**`== 。可以看到 C 通道 pad 到 8。

# 原因

[[RDK数据排布与跨距对齐]]