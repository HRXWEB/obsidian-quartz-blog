---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 3:11:53 pm
---

# 场景

开发板A有无线网卡和有线网卡，开发板B只有有线网卡，现在的网络拓扑是A连接Wifi可以连接到互联网，A和B通过网络直连进行通信。但是这种情况下B无法连接互联网，有什么可以解决的办法吗？

```Plain
           +-------------------+                 +-------------------+
           |                   |  （以太网连接）   |                   |
           |  开发板A (无线网卡) |-----------------|  开发板B (有线网卡) |
           |                   |                 |                   |
           +-------------------+                 +-------------------+
                    |
                    | (WiFi连接)
                    |
           +-------------------+
           |                   |
           | 互联网            |
           |                   |
           +-------------------+
```

# 解决方案

让开发板 A 充当网关，这样 B 就可以通过 A 的网络连接到互联网。

## 1. 设置开发板 A 作为网关

- 开发板 A 启用 IP 转发功能
    
    ```Bash
    sudo sysctl -w net.ipv4.ip_forward=1
    ```

    要使其永久生效，可以编辑 `/etc/sysctl.conf` 文件，加入以下内容：

    ```Plain
    net.ipv4.ip_forward = 1
    ```

    然后执行 `sudo sysctl -p` 来应用这个配置。

- 配置开发板 A 的防火墙规则，允许它转发流量
    
    ```Bash
    sudo iptables --table nat -A POSTROUTING -o wlan0 -j MASQUERADE
    sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT
    ```
    
- 保存 iptables 配置
    
    ```Bash
    sudo apt install iptables-persistent
    sudo netfilter-persistent save
    ```

    当前的配置会保存到 `/etc/iptables/rules.v4` 和 `/etc/iptables/rules.v4` 随着系统启动自动加载

## 2. 配置开发板 B 的默认网关

将开发板B的默认网关设置为开发板A的有线网卡IP地址（假设是192.168.1.1）：

```Bash
sudo route add default gw 192.168.1.1
```

## 3. 确保**开发板B能够通过开发板A的有线网卡访问互联网**

在开发板B上设置DNS服务器为开发板A的DNS或者使用公网的DNS（如8.8.8.8）。编辑 `/etc/resolv.conf`：

```Bash
nameserver 8.8.8.8
```