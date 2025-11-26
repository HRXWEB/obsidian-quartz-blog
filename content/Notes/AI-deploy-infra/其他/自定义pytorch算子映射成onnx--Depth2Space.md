---
title:
draft: true
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

> [!important] 目前对于自定义算子并且映射了解还十分少，目前只是映射成onnx算子之后，使用onnxruntime创建run session 后，推理能够得到正确的结果。
> 
> 如何确保算子可以在训练期间使用需要进一步研究

# nn.PixelShuffle

pytorch本身有 `nn.PixelShuffle` 这个算子，在导出成onnx模型的时候会映射成`onnx::DepthToSpace` 算子。

参看onnx对这个算子的定义：

> [!info] DepthToSpace - ONNX 1.18.0 documentation  
> This version of the operator has been available  
> [https://onnx.ai/onnx/operators/onnx__DepthToSpace.html#attributes](https://onnx.ai/onnx/operators/onnx__DepthToSpace.html#attributes)  

发现在属性的部分，mode有两个取值：

- ‘DCR’(default)
- ‘CRD’

而 `nn.PixelShuffle` 只会映射成 ‘CRD’ 模式的 `onnx::DepthToSpace` ，这个issue也提到了这个问题：

https://github.com/pytorch/pytorch/issues/75748

> [!important] 如何才能将pytorch算子转换成 `onnx::DepthToSpace` `mode='DCR'` 呢？

# 两种模式的区别

https://github.com/onnx/onnx/issues/3739

上述issue比较了 `nn.PixelUnShuffle` 和 默认模式的 `onnx::SpaceToDept` ，在同样输入的情况下输出不一致。

这两个算子其实就是 `nn.PixelShuffle` 和 `onnx::DepthToSpace` 的逆过程，所以拿来理解是没有问题的。贴上作者的图解过程：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926183330712.png)

图像左到右是 `PixelUnShuffle` ，那反过来右到左就是 `PixelShuffle` ，onnx同理。

1. 尝试使用**文字描述**这一过程：
    - PixelShuffle：沿着channel维度，先填列，再填行，最后再填通道。
    - DepthToSpace：沿着channel维度，先填深度，再填列，最后填行。
2. 使用**公式描述**这一过程，借助了python，实现了两个类来模拟这两个算子，从而搞清了数据重排的过程，文件如下：

    [pixelunshuffle_depth2space_simulator.py](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/pixelunshuffle_depth2space_simulator.py)

# 自定义算子

此文章阐述了自定义算子的几种情况和相应的解决方法，以及一些基础的概念，后续需要深入研究一下：

> [!info] 第四章：在 PyTorch 中支持更多 ONNX 算子 — mmdeploy 1.3.1 文档  
> 在上一篇教程中，我们系统地学习了 PyTorch 转 ONNX 的方法，可以发现 PyTorch 对 ONNX 的支持还不错。但在实际的部署过程中，难免碰到模型无法用原生 PyTorch 算子表示的情况。这个时候，我们就得考虑扩充 PyTorch，即在 PyTorch 中支持更多 ONNX 算子。  
> [https://mmdeploy.readthedocs.io/zh-cn/stable/tutorial/04_onnx_custom_op.html](https://mmdeploy.readthedocs.io/zh-cn/stable/tutorial/04_onnx_custom_op.html)  

一个自定义pytorch算子并转成onnx算子的例子：

> [!info] 【pytorch】——自定义一个算子并导出到onnx_torch自定义算子导出到onnx-CSDN博客  
> 文章浏览阅读5.  
> [https://blog.csdn.net/u011622208/article/details/122255317](https://blog.csdn.net/u011622208/article/details/122255317)  

## 具体实现

[depth2space.py](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/depth2space.py)

在这个脚本中，实现了两个pytorch算子，分别可以转成 `mode='CRD'` 和 `mode = 'DCR`' 的 `onnx::DepthToSpace`

tips：

- 在 `test_depth_to_space` 函数中对这两个算子保存出来的模型做了推理，得到的结果符合预期
- 在 `test_depth_to_space` 函数中比较了 `CRD` 模式和 `nn.PixelShuffle` 的输出，发现二者结果是一致的，说明 `nn.PixelShuffle` 确实等价于 `CRD` 模式的 `onnx::DepthToSpace`

# 三维可视化效果

```python
import matplotlib.pyplot as plt
import numpy as np

# 准备一组体素坐标
n_voxels = np.ones((3, 4, 4), dtype=np.float32)

step = 2
size = np.array(n_voxels.shape) * step
filled_values = np.zeros(size - 1, dtype=np.float32)
for h in range(0, filled_values.shape[0], step):
    for w in range(0, filled_values.shape[1], step):
        for c in range(0, filled_values.shape[2], step):
            filled_values[h, w, c] = np.random.rand()

filled = filled_values != 0

# 颜色映射
cmap = plt.cm.viridis  # 选择一个颜色映射表
norm = plt.Normalize(vmin=filled_values.min(), vmax=filled_values.max())  # 规范化数据
facecolors = cmap(norm(filled_values))  # 计算每个体素的颜色

# 绘制3D色块图
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.voxels(filled, facecolors=facecolors, edgecolor='k')

# 显示颜色条
m = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
m.set_array([])
# plt.colorbar(m, shrink=0.8)

plt.show()
```