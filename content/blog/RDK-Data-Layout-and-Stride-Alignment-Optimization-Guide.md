---
title: RDK数据排布与跨距对齐优化指南
draft: 
aliases: []
tags: []
created: 2025-09-25T17:05:16.1616+08:00
updated: 2025-10-11T16:54:52.5252+08:00
---

# 对齐规则

依据数据排布方式不同，模型**输入输出** tensor 的对齐规则会有所不同：

- `NHWC`： 当输入 C＞4 时或输出时，C bytes 对齐 `256 * {0, 1, ...} + {0, 16, 32, 64, 128}` ；当C ≤ 4时，H对齐到2，W对齐到32
- `NCHW`：W bytes对齐 `256 * {0, 1, ...} + {0, 16, 32, 64, 128}`

> [!important]
> 
> - 对于 **HB_DNN_IMG_TYPE_NV12** ，要求模型输入的 H&W 必须为偶数。
> - `HB_DNN_IMG_TYPE_NV12` 以及 `HB_DNN_IMG_TYPE_Y` 这两种数据类型的对齐规则是只要求W为16的倍数，不需要完全按照 `*alignedShape**` 进行对齐。

# BPU 跨距对齐

```C++
typedef struct {
  hbDNNTensorShape validShape;    // 数据的有效尺寸
  hbDNNTensorShape alignedShape;  // 数据的对齐尺寸
  int32_t tensorLayout;
  int32_t tensorType;
  hbDNNQuantiShift shift;
  hbDNNQuantiScale scale; 
  hbDNNQuantiType quantiType;
  int32_t quantizeAxis;
  int32_t alignedByteSize;        // 数据对齐后所占的字节大小
  int32_t stride[HB_DNN_TENSOR_MAX_DIMENSIONS];
} hbDNNTensorProperties;
```

## 去除对齐

- 若模型输出是 cpu 算子，则会在 bpu 与 cpu 数据传输时自动去除对齐，此时输出 tensor shape 满足 `validShape=alignedShape`
- 若模型输出时 bpu 算子，则输出需要用户主动去除对齐数据，此时输出 tensor shape 是 `alignedshape`

# 参考资料

1. [https://forum.d-robotics.cc/t/topic/26182](https://forum.d-robotics.cc/t/topic/26182)
2. [https://forum.d-robotics.cc/t/topic/25456](https://forum.d-robotics.cc/t/topic/25456)