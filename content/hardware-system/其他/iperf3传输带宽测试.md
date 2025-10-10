---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:20.2020+08:00
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