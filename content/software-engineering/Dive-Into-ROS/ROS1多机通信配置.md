---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 4:28:53 pm
---

# 确保互相 ping 通

可能需要的安装包

```Bash
# ping
sudo apt install iputils-ping -y
# ifconfig
sudo apt install net-tools -y
```

# 主机配置

```Bash
# 设置 ROS Master 的地址为本机的 IP
export ROS_MASTER_URI=http://192.168.1.101:11311

# 设置本机的 IP 地址，用于节点间的通信
export ROS_IP=192.168.1.101

# 启动 roscore
roscore
```

# 从机配置

```Bash
# 设置 ROS Master 的地址为主机的 IP
export ROS_MASTER_URI=http://192.168.1.101:11311

# 设置本机的 IP 地址，用于节点间的通信
export ROS_IP=192.168.1.202
```

# 原理解析

1. `ROS_MASTER_URI` 告诉所有主机和从机节点， ros master 就在我这台机器上。
2. `**ROS_IP**` **设定本机中节点在网络中的“身份”是什么。**

---

假设这样一个场景：

1. 主机上有一个 `/yolo11_node` 发布 topic `/yolo11_node/boxes_and_seg`，从机订阅并 echo
2. 主机只设置了 `ROS_MASTER_URI`，没设置 `ROS_IP`

那么 ：

- `echo $ROS_MASTER_URI` 输出 `http://localhost:11311`
    - **含义**: 这个配置告诉 `/yolo11_node` 节点：“ROS Master 就在我这台机器上（localhost）”。
    - **效果**: `/yolo11_node` 可以成功地连接到 `roscore`，并将自己发布的话题（如 `/yolo11_node/boxes_and_seg`）注册到 Master。这就是为什么在从机 里 `rostopic list` 能够看到这个话题的原因。**注册阶段是成功的。**
- `echo $ROS_IP` 输出为空
    - **含义**: 您没有明确告诉 `/yolo11_node` 节点它在网络中的“身份”是什么。
    - **效果 (致命错误)**: 当 `ROS_IP` 未设置时，ROS 节点会自己尝试去“猜测”本机的 IP 地址。在很多情况下，它会默认选择**回环地址** `**127.0.0.1**` **(localhost)**。
    - **灾难性后果**: `/yolo11_node` 在向 Master 注册时，不仅告诉 Master 它发布了什么话题，还告诉 Master：“**如果有人想订阅我的数据，请让他们来** `**127.0.0.1**` **这个地址找我**”。

当在从机里的订阅节点（`rostopic hz`）向 Master 请求数据时，Master 忠实地把这个错误的地址 `127.0.0.1`告诉了它。您的 Docker 容器尝试连接 `127.0.0.1`，结果只能连接到它自己，而那里并没有 `/yolo11_node` 在发布数据。因此，连接失败，就会看到 "no new messages"。

---

# 总结

|   |   |   |
|---|---|---|
|`ROS_MASTER_URI`设置|`ROS_IP`设置|效果分析|
|**未设置**|**已设置**|**依赖** `**roscore**` **位置**。`roscore` 在本机则工作正常（可用于多机）；`roscore` 在远端则节点完全无法连接。|
|**已设置**|**未设置**|**依赖** `**roscore**` **位置和网络**。能找到 Master，但回传地址错误，导致远端节点无法接收数据。|
|**已设置**|**已设置**|**正确配置**。明确指定了 Master 地址和自身地址，是进行多机通信的**唯一可靠方式**。|
|**未设置**|**未设置**|**仅限单机**。所有通信都限制在本机 `localhost` 上，无法进行任何多机通信。|