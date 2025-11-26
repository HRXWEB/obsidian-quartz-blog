---
title: Foxglove Studio 3D结果在Image Panel显示：相机标定与3D投影
draft: true
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-12T16:36:24.2424+08:00
---

[https://foxglove.dev/blog/introducing-foxglove-studios-new-image-panel](https://foxglove.dev/blog/introducing-foxglove-studios-new-image-panel)

> To display 3D markers, publish topics with any of the [3D panel’s supported message types](https://docs.foxglove.dev/docs/visualization/panels/3d#supported-messages) – these can range from cubes and poses to point clouds and occupancy grids. First set a [“Calibration” topic](https://docs.foxglove.dev/docs/visualization/message-schemas/camera-calibration) in the Image panel settings – this determines the camera’s field-of-view, and is used to transform 3D markers into the image’s 2D space. Then select the 3D markers you’d like to superimpose on the image in the “Topics” section:

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182707894.png)

相机坐标系下的 3D 结果投影到像素坐标是一个很常见的行为，foxglove 提供了很友好的支持。

只需要：

- 统一坐标系
- 发布 3D message topic
- 发布相应的相机参数 CameraCalibration topic

就可以实现在 Imagel Panel 显示由相机坐标系投影到像素坐标系的 3D 框。

# 一个实际的例子

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182717794.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182729809.png)

adas 是来自 dataflow@44f545612e5e9ce6b38b538c5f2f574a8a8f7ede 的一个示例

同时发布 3D 框和 camera calibration topic 就可以正常投影到 Image Panel

## 如何从 yaw/pitch/roll 设置四元数

[https://stackoverflow.com/questions/56576403/from-euler-angles-to-quaternions](https://stackoverflow.com/questions/56576403/from-euler-angles-to-quaternions)

对应关系：xyz ←→ rpy

示例：

```cpp
foxglove::CubePrimitive cube;
// convert yaw, pitch, roll to quaternion
// xyz <<=>> rpy
double yaw = box.yaw;
double pitch = box.pitch;
double roll = box.roll;
double cy = cos(yaw * 0.5);
double sy = sin(yaw * 0.5);
double cp = cos(pitch * 0.5);
double sp = sin(pitch * 0.5);
double cr = cos(roll * 0.5);
double sr = sin(roll * 0.5);
double qx = sr * cp * cy - cr * sp * sy;
double qy = cr * sp * cy + sr * cp * sy;
double qz = cr * cp * sy - sr * sp * cy;
double qw = cy * cp * cr + sy * sp * sr;
cube.mutable_pose()->mutable_orientation()->set_x(qx);
cube.mutable_pose()->mutable_orientation()->set_y(qy);
cube.mutable_pose()->mutable_orientation()->set_z(qz);
cube.mutable_pose()->mutable_orientation()->set_w(qw);
```

# 参考

1. [https://foxglove.dev/blog/introducing-foxglove-studios-new-image-panel](https://foxglove.dev/blog/introducing-foxglove-studios-new-image-panel)
2. [https://stackoverflow.com/questions/56576403/from-euler-angles-to-quaternions](https://stackoverflow.com/questions/56576403/from-euler-angles-to-quaternions)
3. [https://blog.csdn.net/lh2008xp/article/details/84449927](https://blog.csdn.net/lh2008xp/article/details/84449927)