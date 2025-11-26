---
title: RDK工具链环境下ONNX导出建议
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-11T16:55:23.2323+08:00
---

# 在导出时为模型输出加上 transpose 算子

> [!important] 加上 transpose 算子将模型输出的 tensor 格式从 NCHW 转为 NHWC
> 
> `.transpose(0, 2, 3, 1)`

一般情况下 pytorch 计算时，tensor 的 data format 一般都是 NCHW，输出 tensor 也是 NCHW。

使用 RDK 工具链对 onnx 模型进行量化编译后，模型的输出也是 NCHW。但是这个格式对逐像素处理的后处理很不友好，会造成频繁的 cache-miss，比如当前的代码：

```cpp
// data format is CHW
for (int k = 0; k < channels; k += step) {
    for (int i = 0; i < height; ++i) {
      for (int j = 0; j < width; ++j) {
auto *cur_data = data + k * C_stride + i * H_stride + j * W_stride;
        if (cur_data[0] > arc_det_threshold_) {
          Box box;
          box.class_id = k / step;
          box.class_name = det_class_names_.at(k / step);
          box.confidence = cur_data[0];
float bev_x = j + *(cur_data + 1 * C_stride);
float bev_y = i + *(cur_data + 2 * C_stride);
          box.center_x = bev_x * scale_x - bev_range_x_ / 2.0f;
          box.center_z = - bev_y * scale_y + bev_range_y_;
          box.center_y = *(cur_data + 3 * C_stride);
          box.length = *(cur_data + 4 * C_stride);
          box.width = *(cur_data + 5 * C_stride);
          box.height = *(cur_data + 6 * C_stride);
          box.yaw = std::atan2(*(cur_data + 7 * C_stride), *(cur_data + 8 * C_stride));
          boxes.push_back(box);
        }
      }
    }
  }
```

每次都会跳跃访问 C_stride * n 个内存地址

# 未完待续