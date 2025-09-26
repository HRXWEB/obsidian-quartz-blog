---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 2:20:50 pm
---

# 安装

## Macos

```Bash
brew install iperf3
```

## Unix

```Bash
apt install -y iperf3
```

# 测试

## 启动服务器

```Bash
iperf3 -s
```

## 启动客户端

```Bash
# TCP 测试
iperf3 -c <server_ip>

# UDP 测试
iperf3 -c <server_ip> -u
```