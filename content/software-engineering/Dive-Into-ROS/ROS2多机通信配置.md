---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 4:28:47 pm
---

# ROS 2：基于 DDS 的去中心化模式

**原理：** ROS 2放弃了`roscore`，转而使用**DDS（Data Distribution Service）**作为其核心通信中间件。DDS是一种去中心化的、基于发布-订阅（publish-subscribe）模式的通信协议，广泛应用于实时系统中。

- **去中心化发现：** DDS通过**多播（multicast）**或**单播（unicast）**机制，在网络中自动发现所有正在运行的节点。每个DDS节点都是平等的，没有中心服务器。
- **发布-订阅模型：** 当一个节点发布一个话题时，它并不需要知道哪个节点在订阅。它只向DDS网络发布数据。任何对该话题感兴趣的节点都会自动接收到这些数据。
- **动态连接：** 节点之间的连接是动态建立和维护的，不需要预先配置。

# **跨机通信设置：**

由于DDS的去中心化特性，ROS 2的跨机通信设置要简单得多，主要是网络和环境变量的配置。

1. **网络配置：** 确保所有机器处于同一个局域网内，并且可以互相ping通。
2. **DDS供应商：** ROS 2支持多种DDS供应商（如Fast DDS、Cyclone DDS等），它们有不同的配置选项。默认情况下，Fast DDS使用多播（multicast）进行发现。
3. **环境变量：** 通常，你只需要设置以下环境变量来指定网络接口或进行更高级的配置：
    - `RMW_IMPLEMENTATION=rmw_fastrtps_cpp`：指定使用的DDS供应商，通常不需要更改，除非你有特定需求。
    - `ROS_DOMAIN_ID=0`：这是一个非常重要的概念。只有具有相同`ROS_DOMAIN_ID`的ROS 2节点才能相互通信。这使得你可以在同一个物理网络中创建多个独立的ROS 2子网络。
    - `ROS_IPV6_ENABLED=1`：启用IPv6，用于一些高级配置。
    - `ROS_LOCALHOST_ONLY=0`：这是一个重要的安全设置，在多机通信时需要设置为`0`以允许外部连接。
4. **运行：** 在所有机器上，只需确保它们在同一个网络并使用相同的`ROS_DOMAIN_ID`，然后直接运行你的ROS 2节点即可。它们会通过DDS的发现机制自动找到彼此，无需运行一个中心化的`roscore`。