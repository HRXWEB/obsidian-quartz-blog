---
title: iperf3网络带宽测试工具使用指南
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-11T16:43:08.088+08:00
---

# 安装

## Macos

```bash
brew install iperf3
```

## Unix

```bash
apt install -y iperf3
```

# 测试

## 启动服务器

```bash
iperf3 -s
```

## 启动客户端

```bash
# TCP 测试
iperf3 -c <server_ip>

# UDP 测试
iperf3 -c <server_ip> -u
```