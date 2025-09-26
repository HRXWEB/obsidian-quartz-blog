---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 2:18:32 pm
---

# 硬件连接

将 PC 的以太网端口和雷达直连。

# wireshark 抓包分析

打开 wireshark 选择和雷达直连的网卡开始抓包，设置规则：

```Plain
udp.srcport == 2368
```

2368 这个端口是因为雷达默认的 `[config.yaml](https://github.com/HesaiTechnology/HesaiLidar_ROS_2.0/blob/2.0.9/config/config.yaml)`:

```YAML
lidar:
    - driver:
        pcap_play_synchronization: true                       # pcap play rate synchronize with the host time
        udp_port: 2368                                        # UDP port of lidar
        ptc_port: 9347                                        # PTC port of lidar
        device_ip_address: 192.168.1.201                      # host_ip_address
        group_address: 255.255.255.255
        pcap_path: "<Your PCAP file path>"                    # The path of pcap file
```

## 如果不是默认的端口怎么办？

找到目标 IP 是 255.255.255.255 的源 IP，因为发的 udp 包是广播的。例如：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926141828119.png)

过滤规则为：

```Plain
ip.dst == 255.255.255.255
```

# tcpdump 抓包分析（无 wireshark 时的替代）

针对上面的两个规则：

```Plain
udp.srcport == 2368
ip.dst == 255.255.255.255
```

替代命令是：

```Bash
sudo apt install tcpdump -y
sudo tcpdump -i <your_interface> udp src port 2368
sudo tcpdump -i <your_interface> dst host 255.255.255.255
```