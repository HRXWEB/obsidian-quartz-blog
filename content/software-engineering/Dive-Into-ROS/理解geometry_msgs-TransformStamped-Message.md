---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 💻定义

[http://docs.ros.org/en/fuerte/api/geometry_msgs/html/msg/TransformStamped.html](http://docs.ros.org/en/fuerte/api/geometry_msgs/html/msg/TransformStamped.html)

```Plain
# This expresses a transform from coordinate frame header.frame_id
# to the coordinate frame child_frame_id
#
# This message is mostly used by the 
# tf package. 
# See it's documentation for more information.

Header header
string child_frame_id # the frame id of the child frame
Transform transform
```

# 🥪如何理解 transform 字段

注释明确说明了，这个消息表达的是一个**从** `**header.frame_id**` **坐标系**到 `**child_frame_id**` **坐标系**的变换。

## 如何理解这个转换过程？(这个这个没错！！虽然反直觉）

假设有一个点 P，它在子坐标系 (`child_frame_id`) 中的坐标是 `P_child`。我们想知道这个点在父坐标系 (`header.frame_id`) 中的坐标 `P_parent` 是多少。

这个 `transform` 字段就告诉了我们如何进行这个计算。我们可以将 `transform` 应用于 `P_child`，从而得到 `P_parent`。

**公式可以表示为：**

`P_parent` = `transform` * `P_child`

> [!important] 直觉上应该是 `P_child` = `transform` * `P_parent` ，但反直觉！！
> 
> ---
> 
> 详细解释（不是很直观）：
> 
> 已知
> 
> - transform 为父坐标系到子坐标系的旋转平移过程
> - P_child 为某点在子坐标系的位置
> 
> 那么它在父坐标系的位置可分解为：
> 
> - 父坐标系经过 transform 之后到达子坐标系
> - 此时再看点在 P_child 位置。
> 
> 因此 P_parent = transform * P_child

**举一个具体的例子：**

假设我们有两个坐标系：

- **父坐标系** `**base_link**`：机器人的基座。
- **子坐标系** `**camera_link**`：安装在机器人上的一个摄像头。

`TransformStamped` 消息会这样设置：

- `header.frame_id` = `"base_link"`
- `child_frame_id` = `"camera_link"`
- `transform`： 描述了 `camera_link` 相对于 `base_link` 的位置和姿态。

这个 `transform` 包含了从 `base_link` 坐标系原点，移动和旋转到 `camera_link` 坐标系原点所需要进行的变换。

# 🤔得到外参后如何将其封装为 transform

比如相机外参：

相机外参（Extrinsic Parameters）通常描述的是**从世界坐标系（或目标坐标系）到相机坐标系的变换过程**。

## 🔨详细解释

### 1. 相机外参 (World -> Camera)

相机外参矩阵（通常表示为 `[R|t]`）的作用是，将一个在**世界坐标系**下的三维点 `P_world`，转换到**相机坐标系**下，得到 `P_camera`。

这个过程回答了这样一个问题：“**世界中的一个点，在我的相机看来位于哪里？**”

数学表达式为： `P_camera = [R|t] * P_world`

- **R (Rotation Matrix)**: 描述了世界坐标系相对于相机坐标系的旋转。
- **t (Translation Vector)**: 描述了世界坐标系原点在相机坐标系下的位置。

这个变换是计算机视觉（尤其是相机标定）中的标准约定。

### 2. ROS `geometry_msgs/TransformStamped` (Parent -> Child)

正如我们之前讨论的，`TransformStamped` 描述的是**从父坐标系 (**`**header.frame_id**`**) 到子坐标系 (**`**child_frame_id**`**) 的变换**。

这个 `transform` 字段本身代表了子坐标系在父坐标系中的“位姿”（Pose）。它的作用是将一个在**子坐标系**下的点 `P_child`，转换到**父坐标系**下，得到 `P_parent`。

这个过程回答了这样一个问题：“**在子坐标系里有一个点，它在父坐标系中位于哪里？**”

数学表达式为： `P_parent = transform * P_child`

### 两者的关系：互为逆变换

现在我们把这两个概念放在一起。假设：

- 父坐标系 (`header.frame_id`) = `world`
- 子坐标系 (`child_frame_id`) = `camera`

那么：

1. **ROS** `**transform**` (`T_world_camera`) 会将点从 `camera` 坐标系变换到 `world` 坐标系。 `P_world = T_world_camera * P_camera`
2. **相机外参** (`M_ext`) 会将点从 `world` 坐标系变换到 `camera` 坐标系。 `P_camera = M_ext * P_world`

对比这两个公式，您会发现它们描述的变换方向正好相反。因此，它们互为逆矩阵：

`**T_world_camera**` **= (**`**M_ext**`**)⁻¹**

`**M_ext**` **= (**`**T_world_camera**`**)⁻¹**

### 总结

|   |   |   |
|---|---|---|
|特性|ROS `transform` (从 `world` 到 `camera`)|相机外参|
|**描述内容**|子坐标系（`camera`）在父坐标系（`world`）中的位姿|世界坐标系（`world`）在相机坐标系（`camera`）中的位姿|
|**变换方向**|**子 -> 父** (`camera` -> `world`)|**世界 -> 相机** (`world` -> `camera`)|
|**回答问题**|“相机坐标系里的一个点，在世界中哪里？”|“世界里的一个点，在相机看来是哪里？”|
|**关系**|互为逆变换||

> [!important] 所以，当您在处理机器人视觉问题，需要将在相机标定中得到的外参矩阵应用到 ROS 的 TF 系统时，**一定要记得先求一次逆变换**，才能得到正确的 `transform`。这是实践中一个非常关键且容易出错的细节。

## 💡实例证明

在 ros2 的 `launch.py` 中写下如下：

```Python
def RTMatrix2TransformArgs(rt_matrix: np.ndarray, parent_frame_id: str, child_frame_id: str):
    # rt 矩阵是从父坐标系到子坐标系的变换矩阵，描述的是符合从父坐标系如何旋转平移到子坐标系
    rt_matrix = rt_matrix.reshape(4, 4)

    translation = rt_matrix[:3, 3]
    rotation_matrix = rt_matrix[:3, :3]

    quaternion = R.from_matrix(rotation_matrix).as_quat()

    transform_args = [
        str(t) for t in translation] + [
        str(q) for q in quaternion ] + [
        parent_frame_id,
        child_frame_id,
    ]

    return transform_args

# ego 绕 x 轴旋转 -90 度后得到相机坐标系
ego2cam_transform = R.from_euler('x', -90, degrees=True).as_matrix()
ego2cam_transform_args = RTMatrix2TransformArgs(ego2cam_transform, "ego_link", "camera_left_link")
camera_to_ego_tf_node = Node(
    package="tf2_ros",
    executable="static_transform_publisher",
    name="camera_to_ego_tf_node",
    output="screen",
    arguments=ego2cam_transform_args,
)
```

- 看一下逆向旋转 90 度的 RT矩阵：
    
    ```Python
    >>> R.from_euler('x', -90, degrees=True).as_matrix()
    array([[ 1.00000000e+00, -0.00000000e+00,  0.00000000e+00],
           [ 0.00000000e+00,  2.22044605e-16,  1.00000000e+00],
           [-0.00000000e+00, -1.00000000e+00,  2.22044605e-16]])
    ```
    
- 此时 `camera_to_ego_tf_node` 发布的 `/tf_static` 为：
    
    ```JSON
    // 下面四元数相当于 rpy = [-90, 0, 0]，即绕 x 轴逆向旋转 90 度
    {
      "transforms": [
        {
          "header": {
            "stamp": {
              "sec": 1757047341,
              "nsec": 41724544
            },
            "frame_id": "ego_link"
          },
          "child_frame_id": "camera_left_link",
          "transform": {
            "translation": {
              "x": 0,
              "y": 0,
              "z": 0
            },
            "rotation": {
              "x": 0.7071067811865475,
              "y": 0,
              "z": 0,
              "w": -0.7071067811865475
            }
          }
        }
      ]
    }
    ```

想象一下：

- ego 坐标系 xyz 为右前上
- cam 坐标系 xyz 为右下前
- 即 ego 坐标系绕 x 轴逆向旋转 90 度即为 cam 坐标系

因此：

$$\begin{bmatrix} ego\_x \\ ego\_y \\ ego\_z \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & -1 & 0 \end{bmatrix} \begin{bmatrix} cam\_x \\ cam\_y \\ cam\_z \end{bmatrix}$$

可以看到公式中的旋转矩阵是和上面的 `R.from_euler('x', -90, degrees=True).as_matrix()` 描述的 RT 矩阵中的 R 矩阵是一样的。

即证明了 ros2 geometry_msgs/TransformStamped 的 `transform` 字段使用方式为：

$$P_{parent} = \text{transform} \times P_{child} \\  
P_{world} = \text{transform} \times P_{camera} \quad \text {,以相机外参为例}$$

而外参（以相机外参为例）描述的是：

$$P_{camera} = [R \mid T] \times P_{world}$$

所以

$$\text{transform} = [R \mid T] ^{-1}$$