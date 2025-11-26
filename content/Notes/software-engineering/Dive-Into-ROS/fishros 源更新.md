---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:51.5151+08:00
---

```bash
sudo su

curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg && \
rm -rf /etc/apt/sources.list.d/ros-fish.list && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://mirrors.tuna.tsinghua.edu.cn/ros/ubuntu/ focal main" >> /etc/apt/sources.list.d/ros-fish.list && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://mirrors.tuna.tsinghua.edu.cn/ros2/ubuntu/ focal main" >> /etc/apt/sources.list.d/ros-fish.list && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu/ focal main" >> /etc/apt/sources.list.d/ros-fish.list && \
apt-get update
```

# 更新 ros 源

```bash
sudo su

curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg && \
cp /etc/apt/sources.list.d/ros.list /etc/apt/sources.list.d/ros.list.save
rm -rf /etc/apt/sources.list.d/ros.list && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://mirrors.tuna.tsinghua.edu.cn/ros/ubuntu/ focal main" >> /etc/apt/sources.list.d/ros.list && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://mirrors.tuna.tsinghua.edu.cn/ros2/ubuntu/ focal main" >> /etc/apt/sources.list.d/ros.list && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu/ focal main" >> /etc/apt/sources.list.d/ros.list && \
apt-get update
```