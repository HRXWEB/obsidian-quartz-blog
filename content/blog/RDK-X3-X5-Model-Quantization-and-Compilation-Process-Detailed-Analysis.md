---
title: RDK X3-X5模型量化编译过程详解
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-11T16:54:01.011+08:00
---

> [!important]
> 
> - `RDK X3 yaml配置文件`，可直接使用**[RDK X3 Caffe模型量化yaml文件模板](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#rdk_x3_caffe_yaml_template)** 和**[RDK X3 ONNX模型量化yaml文件模板](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#rdk_x3_onnx_yaml_template)**模板文件进行填写。
> - `RDK Ultra yaml配置文件`，可直接使用**[RDK Ultra Caffe模型量化yaml文件模板](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#rdk_ultra_caffe_yaml_template)** 和**[RDK Ultra ONNX模型量化yaml文件模板](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#rdk_ultra_onnx_yaml_template)**模板文件进行填写。
> - `RDK X5 yaml配置文件`，可直接使用**[RDK X5 Caffe模型量化yaml文件模板](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#rdk_x5_caffe_yaml_template)** 和**[RDK X5 ONNX模型量化yaml文件模板](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#rdk_x5_onnx_yaml_template)**模板文件进行填写。
> - 若 hb_mapper makertbin 步骤异常终止或者出现报错信息，则说明模型转换失败，请根据终端打印或在当前路径下生成的 `hb_mapper_makertbin.log` 日志文件确认报错信息和修改建议，错误信息可以在 **[模型量化错误及解决方法](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain#model_convert_errors_and_solutions)**章节来查找错误的解决方法，若以上步骤仍不能排除问题，请联系D-Robotics 技术支持团队或在**[D-Robotics 官方技术社区](https://developer.d-robotics.cc/)**提出您的问题，我们将在24小时内给您提供支持。

---

配合D-Robotics 算法工具链的模型完整开发过程，需要经过 **浮点模型准备**、 **模型验证**、 **模型转换**、 **性能评估** 和 **精度评估** 共五个重要阶段，如下图:

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926181013611.png)

# 浮点模型准备

支持 `onnx@opset11` 和 `caffe1.0` 的模型

> [!important] 一些 pytorch 有的算子而 onnx@opset11 没有的算子，D-Robotics 算法工具链提供了导出脚本可以将其从 PyTorch 算子导出到D-Robotics 自定义的onnx OP中。
> 
> > ref: [https://developer.d-robotics.cc/rdk_doc/Advanced_development/toolchain_development/intermediate/supported_op_list#使用限制说明](https://developer.d-robotics.cc/rdk_doc/Advanced_development/toolchain_development/intermediate/supported_op_list#%E4%BD%BF%E7%94%A8%E9%99%90%E5%88%B6%E8%AF%B4%E6%98%8E)

# 模型验证

## 使用方法

```Bash
  hb_mapper checker --model-type ${model_type} \
                    --march ${march} \
                    --proto ${proto} \
                    --model ${caffe_model/onnx_model} \
                    --input-shape ${input_node} ${input_shape} \
                    --output ${output}

# 多个输入的情况下，多次指定 --input-shape 即可
```

## 结果解读

```Plain
  ==============================================
  Node         ON   Subgraph  Type
  ----------
  conv1        BPU  id(0)     HzSQuantizedConv
  conv2_1/dw   BPU  id(0)     HzSQuantizedConv
  conv2_1/sep  BPU  id(0)     HzSQuantizedConv
  conv2_2/dw   BPU  id(0)     HzSQuantizedConv
  conv2_2/sep  BPU  id(0)     HzSQuantizedConv
  conv3_1/dw   BPU  id(0)     HzSQuantizedConv
  conv3_1/sep  BPU  id(0)     HzSQuantizedConv
  ... 
```

每行含 Node、ON、Subgraph 和 Type 四列，分别为节点名称、执行节点计算的硬件、节点所属子图和节点映射到的D-Robotics 算子名称。

> [!important] 官方对 yolov5 举的示例中，会要求把最终输出的 anchor 解算去掉，并且用 permute 操作把输出格式弄成 NHWC
> 
> > 示例使用的 yolov5 官方的模型 v2.0 和 v7.0 都是 5 维，不支持
> 
> > convert 成 NHWC 是方便后续后处理的 anchor 解算。可以保持 NCHW 也没关系，但是解算过程就会比较复杂。

# 模型转换

> [!important] 需要 100 份左右校准数据

### 准备校准数据集

> [!important] `preprocess_on` 参数可以比较方便的把数据处理成模型需要的类型、格式、大小，但是官方不建议开启，会影响量化的效果。
> 
> 因为这个参数开启后，前处理的过程是固定的，但实际上不同模型前处理可能不太一样。

**举一个实际的例子，使用ImageNet训练的用于分类的原始浮点模型：**

- 它只有一个输入节点，输入信息描述如下：
    - 输入类型：`BGR`
    - 输入layout：`NCHW`
    - 输入尺寸：`1x3x224x224`
- 使用验证集做模型推理（inference）时的数据预处理如下：
    1. 图像长宽等比scale,短边缩放到256。
    2. `center_crop` 方法获取224x224大小图像。
    3. 按通道减mean。
    4. 数据乘以scale系数。

> [!important] 量化编译镜像里面安装了 `horizon_tc_ui` 包，有常用的 transformer 操作，具体有哪些参考：**[Transformer使用说明](https://developer.d-robotics.cc/rdk_doc/FAQ/toolchain/#transformer使用说明)**

借助各类 transformer 来实现预处理过程，将数据处理成上面描述的样子：

```Python
  # 本示例使用skimage，如果是opencv会有所区别
  # 需要您特别注意的是，transformers中并没有体现减mean和乘scale的处理
  # mean和scale操作已经融合到了模型中，请参考下文norm_type/mean_value/scale_value配置
  def data_transformer():
    transformers = [
    # 长宽等比scale，短边缩放至256
    ShortSideResizeTransformer(short_size=256),
    # CenterCrop获取224x224图像
    CenterCropTransformer(crop_size=224),
    # skimage读取结果为NHWC排布，转换为模型需要的NCHW
    HWC2CHWTransformer(),
    # skimage读取结果通道顺序为RGB，转换为模型需要的BGR
    RGB2BGRTransformer(),
    # skimage读取数值范围为[0.0,1.0]，调整为模型需要的数值范围
    ScaleTransformer(scale_value=255)
    ]

    return transformers

  # src_image 标定集中的原图片
  # dst_file 存放最终标定样本数据的文件名称
  def convert_image(src_image, dst_file, transformers)：
    image = skimage.img_as_float(skimage.io.imread(src_file))
    for trans in transformers:
	    image = trans(image)
    # 模型指定的input_type_train BGR数值类型是UINT8
    image = image.astype(np.uint8)
    # 二进制存储标定样本到数据文件
    image.tofile(dst_file)

  if __name__ == '__main__':
    # 此处表示原始标定图片集合，伪代码
    src_images = ['ILSVRC2012_val_00000001.JPEG'，...]
    # 此处表示最终标定文件名称（后缀名不限制），伪代码
    # calibration_data_bgr_f32是您在配置文件中指定的cal_data_dir
    dst_files = ['./calibration_data_bgr_f32/ILSVRC2012_val_00000001.bgr'，...]

    transformers = data_transformer()
    for src_image, dst_file in zip(src_images, dst_files):
    convert_image(src_image, dst_file, transformers)
```

> [!important]
> 
> > 需要您特别注意的是，transformers中并没有体现减mean和乘scale的处理  
> > mean和scale操作已经融合到了模型中，请参考下文norm_type/mean_value/scale_value配置
> 
> 怎么解读上面这段话呢？
> 
> 减均值除方差的操作会融合到模型的最前面去做，所以这段预处理部分就不需要做这个操作了。

### 使用 `hf_mapper makertbin` 工具转换模型

```Bash
hb_mapper makertbin --config ${config_file}  \
                    --model-type  ${model_type}
```

模型转换过程通过 yaml 配置控制，分成四个大的参数组：

- model_parameters
- input_parameters
- calibration_parameters
- compiler_parameters

> [!important] 参数存在多个值的情况下，形式为： `param_name: 'param_value1; param_value2; param_value3'`

进阶的几个参数说明：

- model_parameters.node_info: 可以配置 计算 op 的硬件、输入数据类型、输出数据类型。
    - node_info 在指定输入/输出类型为 int16的时候：==**在您配置了某个op输入/输出数据类型为int16后，模型转换内部会自动进行op输入输出上下文（context）int16配置的更新和检查。 例如，当配置op_1输入/输出数据类型为int16时，实际上潜在同时指定了op_1的上/下一个op需要支持以int16计算。 对于不支持的场景，模型转换工具会打印log提示该int16配置组合暂时不被支持并回退到int8计算。**==
- input_parameters.norm_type/mean_value/scale_value: 用来设置预处理减均值除方差的过程，如果有配置的话，会生成一个 `**HzPreprocess**` 算子插入到输入节点后面做归一化操作。
- calibration_parameters.calibration_type: 取值范围是 `default` `mix` `kl` `max` `load` `skip` 。==**使用 skip 可以先用随机数校准，适合对模型结构进行验证。**==
- calibration_parameters.cal_data_dir: 如果 dir 有后缀如 _f32 可以不需要指定 cal_data_type。但是建议显式指定 cal_data_type
- calibration_parameters.run_on_cpu: deprecated
- calibration_parameters.run_on_bpu: deprecated
- ==**compiler_parameters.core_num: 默认是 1，X5 也不支持多核，所以不用配置。**==
- compiler_parameters.debug: 分析每一层算子的计算量、计算耗时、数据搬运耗时等

> [!important] 在您配置了某个op输入/输出数据类型为int16后，模型转换内部会自动进行op输入输出**上下文**（context）int16配置的更新和检查。 例如，当配置op_1输入/输出数据类型为int16时，实际上==**潜在同时指定了op_1的上/下一个op需要支持以int16计算**==。 对于不支持的场景，模型转换工具会打印log提示该int16配置组合暂时不被支持并回退到int8计算。

### 转换内部过程解析

> [!important] 模型转换重点在解决 **输入数据处理** 和 **模型优化编译** 两个问题

---

**输入数据处理：**

相关的配置参数为：

- input_type_train
- input_layout_train
- input_type_rt
- input_layout_rt

通过配置这一系列参数后，模型的输入会变成这样一个过程：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926181030884.png)

1. Data format Conversion：这一步根据上述配置的四个参数，将 layout 和 type 为 rt 的边缘设备上的数据，转为 layout 和 type 为 train 的数据格式和类型
2. Data preprocessing：这一步做减均值除方差，之后开始模型的计算。

通过这样的配置，用户可以少做很多输入数据处理的相关工作，而且厂商能够利用硬件来加速这个输入数据的处理过程。

具体如何配置：

- type 支持的配置对：

  |`input_type_train` \ `input_type_rt`|nv12|yuv444|rgb|bgr|gray|featuremap|
  |---|---|---|---|---|---|---|
  |yuv444|Y|Y|N|N|N|N|
  |rgb|Y|Y|Y|Y|N|N|
  |bgr|Y|Y|Y|Y|N|N|
  |gray|N|N|N|N|Y|N|
  |featuremap|N|N|N|N|N|Y|

- layout NCHW 还是 NHWC 没有要求。只需要根据实际情况设置即可：
  
  - 第一是 `input_layout_train` 必须与原始模型的数据排布一致
  - 第二是在处理器上准备好与 `input_layout_rt` 一致排布的数据

  正确的数据排布是顺利解析数据的基础。

---

**模型优化编译：**

**模型优化编译** 完成了模型解析、模型优化、模型校准与量化、模型编译几个重要阶段，其内部工作过程如下图所示：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926181045791.png)

---

模型解析阶段：（产出 original_float_model.onnx）

在原始浮点模型上会根据转换配置yaml文件中的配置参数决定**是否加入数据预处理节点**，此阶段产出一个original_float_model.onnx。 这个ONNX模型计算精度仍然是float32，但**在输入部分加入了一个数据预处理节点**。这个预处理节点会完成 `input_type_rt` 到 `input_type_train` 的完整转换。

> [!important] 需要注意的是，这个转换过程会利用硬件资源。实际上 onnx 模型并不包含硬件转换的部分，所以其实 onnx 的输入是一个中间态的数据。如下所示，onnx 其实是从中间态这个输入开始计算的。
> 
> ---
> 
> input_type_rt —— 「硬件」—— 中间态 —— 「转换」 —— input_type_train
> 
> ---
> 
> 自然地，每种 input_type_rt 都有其对应的中间态：
> 
> |input_type_rt|**nv12**|**yuv444**|**rgb**|**bgr**|**gray**|featuremap|
> |---|---|---|---|---|---|---|
> |中间态|yuv444_128|yuv444_128|RGB_128|BGR_128|GRAY_128|featuremap|
> 
> > 解释：
> > 
> > - yuv444_128 是yuv444数据减去128结果，每个数值采用int8表示。
> > - RGB_128 是RGB数据减去128的结果，每个数值采用int8表示。
> > - BGR_128 是BGR数据减去128的结果，每个数值采用int8表示。
> > - GRAY_128 是gray数据减去128的结果，每个数值采用int8表示。
> > - featuremap 是一个四维张量数据，每个数值采用float32表示。

---

模型优化阶段：（产出 optimized_float_model.onnx）

计算精度仍然是 fp32，输入的要求和 original_float_model.onnx 一样

---

模型校准与量化阶段：（产出 quantized_model.onnx）

计算精度是 int8。==**输入的要求目前存疑。**==

---

模型编译阶段：（产出 ***.bin）

---

# 性能评估

[[TBD-BPU-Model-Performance-Evaluation]]

# 精度评估

[[TBD-BPU-Model-Accuracy-Evaluation]]