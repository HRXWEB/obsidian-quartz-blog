---
title: 禾赛激光雷达ROS2驱动配置与Docker部署指南
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-11T16:42:07.077+08:00
---

# 官方驱动库

https://github.com/HesaiTechnology/HesaiLidar_ROS_2.0

# 支持的雷达系列

- Pandar
- AT128/AT128P
- QT
- FT120
- XT16/XT32
- ET25/ET30
- OT
- ATX
- JT16
- JT128、JT256 (need define JT128_256)

# 配置方法

## 配置编译/运行环境

```bash
# 创建容器，注意网络和端口配置
docker run -it \
  --name hesai_lidar_driver \
  --network host \
  -v /path/to/your/workspace:/workspace \
  -v /dev:/dev \
  --privileged \
  osrf/ros:humble-desktop \
  /bin/bash
```

```bash
# 进入容器后
cd /workspace
mkdir -p src
cd src

# 克隆禾赛驱动代码
git clone --recurse-submodules https://github.com/HesaiTechnology/HesaiLidar_ROS_2.0.git

# 返回工作空间根目录
cd /workspace

# 编译
colcon build --symlink-install

# 设置环境变量
source install/local_setup.bash
```

## 配置雷达 `config/config.yaml`

```yaml
lidar:
    - driver:
        udp_port: 2368                          # 激光雷达UDP端口
        ptc_port: 9347                          # PTC端口
        device_ip_address: 192.168.1.201        # 激光雷达IP地址
        source_type: 1                          # 实时连接
        # 其他配置保持默认或根据需要调整
    ros:
        ros_frame_id: hesai_lidar
        ros_send_point_cloud_topic: /lidar_points
        send_point_cloud_ros: true
```

# 启动驱动

```bash
ros2 launch hesai_ros_driver start.py
```

# Docker Compose 方案（推荐）

`docker-compose.yml`:

```yaml
version: '3.8'
services:
  hesai_driver:
    image: osrf/ros:humble-desktop
    container_name: hesai_lidar_driver
    network_mode: host
    privileged: true
    volumes:
      - ./workspace:/workspace
      - /dev:/dev
    working_dir: /workspace
    command: >
      bash -c "source /opt/ros/humble/setup.bash &&
               source install/local_setup.bash &&
               ros2 launch hesai_ros_driver start.py"
    restart: unless-stopped
```

以下命令都在包含 `docker-compose.yml` 文件的目录中执行：

- 启动
    
    ```bash
    docker-compose up -d
    ```
    
- 停止
    
    ```bash
    docker-compose stop 
    ```
    
- 停止并删除
    
    ```bash
    docker-compose down
    ```
    
- 重启服务
    
    ```bash
    docker-compose restart
    ```
    
- 查看服务状态
    
    ```bash
    # 查看服务运行状态
    docker-compose ps
    
    # 查看服务日志
    docker-compose logs hesai_driver
    
    # 实时跟踪日志
    docker-compose logs -f hesai_driver
    ```