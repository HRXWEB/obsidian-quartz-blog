---
title: 双开发板通过网关配置共享互联网
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-12-24T15:39:14.1414+08:00
---

# 场景

开发板 A 有无线网卡和有线网卡，开发板 B 只有有线网卡，现在的网络拓扑是 A 连接 Wifi 可以连接到互联网，A 和 B 通过网线直连进行通信。但是这种情况下 B 无法连接互联网，有什么可以解决的办法吗？

```plaintext
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
    
    ```bash
    sudo sysctl -w net.ipv4.ip_forward=1
    ```

    要使其永久生效，可以编辑 `/etc/sysctl.conf` 文件，加入以下内容：

    ```plaintext
    net.ipv4.ip_forward = 1
    ```

    然后执行 `sudo sysctl -p` 来应用这个配置。

- 配置开发板 A 的防火墙规则，允许它转发流量
    
    ```bash
    sudo iptables --table nat -A POSTROUTING -o wlan0 -j MASQUERADE
    sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT
    ```
    
- 保存 iptables 配置
    
    ```bash
    sudo apt install iptables-persistent
    sudo netfilter-persistent save
    ```

    当前的配置会保存到 `/etc/iptables/rules.v4` 和 `/etc/iptables/rules.v4` 随着系统启动自动加载

## 2. 配置开发板 B 的默认网关

将开发板 B 的默认网关设置为开发板 A 的有线网卡 IP 地址（假设是 192.168.1.1）：

```bash
sudo route add default gw 192.168.1.1
```

## 3. 确保**开发板 B 能够通过开发板 A 的有线网卡访问互联网**

在开发板 B 上设置 DNS 服务器为开发板 A 的 DNS 或者使用公网的 DNS（如 8.8.8.8）。编辑 `/etc/systemd/resolved.conf`，空格区分多个 DNS：

```toml
[Resolve]
DNS=202.106.0.20 202.106.196.115 8.8.8.8
```

重启网络服务：

```bash
# 重启 systemd-resolved 服务
sudo systemctl restart systemd-resolved
# 重启网卡 (或直接重启开发板 reboot)
sudo ifdown <网卡名称> && sudo ifup <网卡名称>
```