---
title: 利用 Tailscale Subnet Router 实现内外网无感切换
draft: false
aliases: []
tags: []
created: 2026-04-28T22:08:45.4545+08:00
updated: 2026-05-02T22:26:35.3535+08:00
---

# 利用 Tailscale Subnet Router 实现内外网无感切换

## 0. 核心原理

**子网路由 (Subnet Router)** 允许你将某台位于内网的设备（如开发机）作为”网关”。当你不在内网时，Tailscale 会自动将发往内网段（如 `192.168.1.x`）的流量通过加密隧道转发至该网关，从而实现像在局域网内一样直接访问 GitLab、数据库或 SSH 设备。

## 1. 环境准备

* **宣告者 (Advertiser)**：一台位于目标内网、24 小时不关机的 Linux 设备（以下简称”跳板机”）。
* **接受者 (Acceptor)**：你的移动办公设备（如 MacBook）。

---

## 2. 跳板机配置 (Linux)

### 第一步：开启内核转发

必须允许 Linux 内核转发来自虚拟网卡的流量。

```bash
# 开启 IPv4 转发
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
# 使配置立即生效
sudo sysctl -p
```

### 第二步：宣告公司内网段

在跳板机上运行以下命令，将目标内网实际使用的网段（用逗号分隔）告知 Tailscale 网络。

```bash
# 示例网段：192.168.1.0/24 和 10.0.0.0/16
sudo tailscale up --advertise-routes=192.168.1.0/24,10.0.0.0/16
```
*注：该配置会自动持久化，重启设备后无需重新输入。*

---

## 3. 管理后台授权 (Web)

出于安全考虑，宣告的路由必须经过手动批准才能生效：

1.  登录 [Tailscale Admin Console](https://login.tailscale.com/admin/machines)。
2.  找到对应的**跳板机设备**。
3.  点击 **Edit route settings**。
4.  在 **Subnet routes** 列表中，手动勾选你刚才宣告的网段并点击确认。

---

## 4. 客户端配置 (Mac/Windows/iOS)

为了让你的电脑“接受”这些远程路由，需要开启相关设置：

* **macOS / Windows**: 点击状态栏 Tailscale 图标 -> **Settings** -> **Route Settings** -> 勾选 **Use Tailscale Subnets**。
* **Linux**: 运行 `sudo tailscale up --accept-routes`。

---

## 5. 实现无感切换效果

配置完成后，你将获得以下体验：

### SSH 配置简化

你的 `~/.ssh/config` 不再需要 `ProxyJump`。无论在内网还是外网，统一使用内网 IP：

```plaintext
Host dev-machine
    HostName 192.168.1.x  # 直接写内网 IP
    User username
```

### 浏览器/应用透明访问

* **GitLab**: 直接在浏览器输入 `http://192.168.1.x` 即可访问。
* **其他内网服务**: 能够跨地域直接通过内网 IP 进行访问和通信。

---

## 6. 注意事项与安全建议

* **网段冲突检测**：请确保你本地的路由器网段与远程内网网段不重合。若发生重合，本地路由优先级更高，会导致无法访问远程资源。建议将本地网段修改为较冷门的数值（如 `192.168.50.x`）。
* **防火墙策略**：如果能连接跳板机但无法访问其同网段的其他机器，请检查跳板机的防火墙（如 `ufw` 或 `iptables`）是否允许转发。

---
