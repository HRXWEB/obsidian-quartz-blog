---
title: OpenWRT + PVE + 动态公网自建 Tailscale DERP 与旁路由全方案
draft: false
aliases: []
tags: []
created: 2026-06-03T00:00:00.000+08:00
updated: 2026-06-03T00:00:00.000+08:00
---

# 目标

这套方案要同时满足五个需求：

1. **外出时稳定回家**：继续使用 Tailscale 访问家中设备；家里已有动态公网 IP 时，Docker VM 作为 Subnet Router 通常已经足够。
2. **低延迟 DERP 中继**：当你需要和另一个无法直连的远端网络通信时，用家里的动态公网自建 DERP 替代官方 DERP，降低回退中继路径的延迟。
3. **家中网关级出海**：在家时可以让指定设备通过 OpenWRT + OpenClash 出海，不必每台设备都单独配置代理。
4. **广告屏蔽**：通过 AdGuardHome 提供 DNS 级广告过滤。
5. **OpenWRT 异常时不影响基础上网**：主路由继续承担基础上网能力；OpenWRT 作为旁路由提供增强功能，必要时手动切回主路由。

最终推荐架构：

```text
光猫 / 现有主路由
    │
    ├── 普通家庭设备
    │   └── 默认继续走主路由，上网不依赖 OpenWRT
    │
    └── x86 小主机 / PVE
        ├── OpenWRT VM
        │   ├── 旁路由
        │   ├── OpenClash
        │   └── AdGuardHome
        │
        └── Debian / Ubuntu VM
            ├── Tailscale
            ├── Subnet Router
            └── Docker 部署 derper
```

---

# 1. 为什么推荐 PVE + Docker，而不是 OpenWRT 里直接跑 DERP

DERP 本质上只是一个中继服务，理论上可以直接在 OpenWRT 上跑二进制。但更推荐用 PVE 拆成两个虚拟机：

- **OpenWRT VM**：只负责旁路由增强功能，例如 OpenClash、AdGuardHome。
- **Debian / Ubuntu VM**：负责 Tailscale、Subnet Router、Docker 和 derper。

这样做的好处：

| 维度 | PVE + Docker | OpenWRT 直接跑 DERP |
|---|---|---|
| 部署便利性 | Docker 镜像成熟，命令固定 | 需要找二进制、写 init 脚本、处理依赖 |
| 系统边界 | 路由功能和服务功能隔离 | 路由系统里混入服务进程 |
| 回滚能力 | PVE 快照容易回滚 | 依赖备份或 A/B 分区 |
| 日志与证书 | Docker VM 里管理更自然 | OpenWRT 存储和日志空间有限 |
| 故障影响 | DERP VM 异常不影响 OpenWRT | 服务异常可能影响路由系统稳定性 |

因此，如果你准备使用 x86 小主机，推荐：

```text
PVE 裸机安装
├── OpenWRT VM：旁路由 + OpenClash + AdGuardHome
└── Debian / Ubuntu VM：Tailscale + Subnet Router + Docker + derper
```

A/B 分区不是必须。PVE 自带快照和备份能力，已经覆盖了大部分“升级失败可回滚”的需求。

---

# 2. 硬件建议

最低建议：

- CPU：J4125 起步，N100 更好
- 内存：8GB 起步
- 硬盘：128GB SSD 起步
- 网口：至少 2 个网口更灵活，1 个网口也能通过 VLAN / 单臂模式实现

如果只跑 OpenWRT、OpenClash、AdGuardHome、DERP，J4125 已经足够。N100 的优势是性能余量更大，适合以后继续加 Home Assistant、轻量 NAS、监控等服务。

---

# 3. 网络地址规划

假设当前主路由网段是：

```text
主路由 IP：192.168.50.1
主路由 DHCP：192.168.50.100 - 192.168.50.250
OpenWRT IP：192.168.50.2
Docker VM IP：192.168.50.3
AdGuardHome IP：192.168.50.2
家庭公网 IP：由脚本自动检测
DERP TCP 端口：55443
STUN UDP 端口：53478
```

建议在主路由里给 PVE、OpenWRT VM、Docker VM 做 DHCP 静态租约，避免 IP 变化。

---

# 4. PVE 安装与虚拟机划分

## 4.1 安装 PVE

在 x86 小主机上安装 PVE。安装完成后：

1. 给 PVE 管理口设置固定 IP。
2. 确认主路由能访问 PVE 管理页面。
3. 创建一个 Linux Bridge，例如 `vmbr0`，桥接到物理 LAN 网口。

典型关系：

```text
物理网口 eno1
    ↓
PVE Linux Bridge vmbr0
    ↓
OpenWRT VM / Debian VM 都接入 vmbr0
```

### 验证

在同一局域网的电脑上验证：

```bash
ping <PVE管理IP>
```

预期：可以 ping 通。

浏览器访问：

```text
https://<PVE管理IP>:8006
```

预期：能打开 PVE 管理页面。

在 PVE Shell 中检查桥接网络：

```bash
ip addr show vmbr0
```

预期：`vmbr0` 存在，并且绑定了正确的管理 IP。

## 4.2 创建 OpenWRT VM

OpenWRT VM 建议配置：

```text
CPU：2 核
内存：1GB - 2GB
硬盘：1GB - 4GB
网卡：virtio，接入 vmbr0
```

如果 OpenWRT 只是旁路由，一个网卡即可。它和主路由处在同一个 LAN 网段中。

### 验证

启动 OpenWRT VM 后，在 PVE 控制台或 SSH 中检查 LAN 地址：

```bash
ip addr
```

预期：OpenWRT 的 LAN 接口地址是规划好的 `192.168.50.2`。

从同一局域网电脑验证：

```bash
ping 192.168.50.2
```

预期：可以 ping 通。

浏览器访问：

```text
http://192.168.50.2
```

预期：能打开 OpenWRT LuCI 管理页面。

## 4.3 创建 Debian / Ubuntu Docker VM

Docker VM 建议配置：

```text
CPU：1 - 2 核
内存：1GB - 2GB
硬盘：10GB - 20GB
网卡：virtio，接入 vmbr0
```

这个 VM 专门运行 Docker 和 derper，避免把 Docker 放进 OpenWRT。

### 验证

在 Docker VM 中检查网络：

```bash
ip addr
ip route
```

预期：

```text
Docker VM IP 是 192.168.50.3
默认网关是 192.168.50.1
```

检查外网访问：

```bash
ping -c 3 1.1.1.1
```

预期：能收到回包。

---

# 5. OpenWRT 旁路由基础配置

OpenWRT 作为旁路由时，不要让它接管全家网络。它只提供增强能力。

基础设置：

```text
OpenWRT LAN IP：192.168.50.2
OpenWRT 网关：192.168.50.1
OpenWRT DNS：可以先填 192.168.50.1，后续再改 AdGuardHome / OpenClash
OpenWRT DHCP：关闭
```

重点：

- **主路由继续负责 DHCP**。
- **OpenWRT 不负责给全网发 IP**。
- **OpenWRT 的默认网关指向主路由**，这样 OpenWRT 自己可以正常联网。

## 验证

在 OpenWRT 上检查默认路由：

```bash
ip route
```

预期看到类似：

```text
default via 192.168.50.1
```

检查 OpenWRT 自己能否上网：

```bash
ping -c 3 1.1.1.1
```

预期：能收到回包。

检查 DHCP 是否关闭：

```bash
uci show dhcp.lan.ignore
```

预期：

```text
dhcp.lan.ignore='1'
```

如果没有输出，需要在 LuCI 里确认 LAN 口 DHCP Server 已关闭。

---

# 6. 旁路由使用模式一：手动指定设备走 OpenWRT

## 适用场景

适合你只想让自己的电脑、手机、测试设备使用 OpenClash 和 AdGuardHome，不想影响家人设备。

这是最稳妥、最容易排障的模式。

## 工作原理

普通设备：

```text
设备 → 主路由 192.168.50.1 → 外网
```

高级功能设备：

```text
设备 → OpenWRT 192.168.50.2 → 主路由 192.168.50.1 → 外网
             │
             ├── OpenClash 处理出海流量
             └── AdGuardHome 处理 DNS 过滤
```

## 客户端配置

在需要高级功能的设备上手动设置：

```text
IP：保持 DHCP 或手动固定均可
网关：192.168.50.2
DNS：192.168.50.2
```

### 验证

在该设备上检查当前默认网关。

macOS：

```bash
route -n get default
```

Linux：

```bash
ip route
```

预期：默认网关是 `192.168.50.2`。

检查 DNS 是否走 OpenWRT / AdGuardHome：

```bash
nslookup example.com 192.168.50.2
```

预期：能返回解析结果。

检查普通上网：

```bash
ping -c 3 1.1.1.1
```

预期：能收到回包。

OpenWRT 异常时，把网关和 DNS 改回：

```text
网关：192.168.50.1
DNS：192.168.50.1
```

再验证：

```bash
route -n get default
ping -c 3 1.1.1.1
```

预期：默认网关变回 `192.168.50.1`，并且普通上网恢复。

## 优点

- 不影响家人设备。
- OpenWRT 挂了，只影响手动指定的设备。
- 排障简单：改回主路由即可。

## 缺点

- 每台设备都要手动配置。
- 手机、平板在不同 Wi-Fi 间切换时可能需要重新确认网络设置。

---

# 7. 旁路由使用模式二：主路由 DHCP 下发 OpenWRT 网关/DNS

## 适用场景

适合你希望全家设备默认都获得广告屏蔽和网关级出海能力，并且能接受 OpenWRT 异常时需要手动切回。

这种模式比手动指定更无感，但故障影响范围更大。

## 工作原理

主路由仍然负责 DHCP，但它下发给客户端的网关和 DNS 改成 OpenWRT：

```text
设备获取 DHCP：
IP：192.168.50.x
网关：192.168.50.2
DNS：192.168.50.2
```

实际流量：

```text
设备 → OpenWRT 192.168.50.2 → 主路由 192.168.50.1 → 外网
```

## 主路由配置

在主路由 DHCP 设置里，把默认网关和 DNS 改为：

```text
默认网关：192.168.50.2
DNS：192.168.50.2
```

如果主路由不支持自定义 DHCP 网关，可以继续使用模式一，不必强行折腾。

### 验证

让一台客户端断开重连 Wi-Fi，重新获取 DHCP。

macOS：

```bash
ipconfig getoption en0 router
ipconfig getoption en0 domain_name_server
```

Linux：

```bash
ip route
resolvectl status
```

预期：

```text
默认网关：192.168.50.2
DNS：192.168.50.2
```

再检查普通上网：

```bash
ping -c 3 1.1.1.1
nslookup example.com
```

预期：IP 连通和 DNS 解析都正常。

## OpenWRT 异常时如何恢复

进入主路由后台，把 DHCP 下发改回：

```text
默认网关：192.168.50.1
DNS：192.168.50.1
```

然后让客户端重新获取 DHCP：

- 断开重连 Wi-Fi
- 或手动续租 DHCP
- 或重启客户端网络

## 优点

- 客户端无感。
- 全家设备都能使用广告屏蔽。
- 不需要每台设备单独配置。

## 缺点

- OpenWRT 异常时影响范围大。
- 主路由必须支持自定义 DHCP 网关/DNS。
- 排障时要记得先切回主路由。

---

# 8. 为什么不一开始使用 iptables 透明劫持

iptables 透明劫持可以做到“客户端网关仍然是主路由，但流量被 OpenWRT 自动接管”。它的优点是设备无感，OpenWRT 挂了理论上不影响基础上网。

但不建议一开始使用，原因是：

- 规则复杂。
- OpenClash、AdGuardHome、Tailscale 混在一起时排障困难。
- 不同 OpenWRT 版本可能使用 iptables 或 nftables，教程容易失效。
- 你已经可以接受手动切换网关，没有必要一开始引入透明劫持复杂度。

推荐先用模式一或模式二。等整体稳定后，如果确实想做到完全无感，再考虑透明劫持。

---

# 9. AdGuardHome 配置

AdGuardHome 建议安装在 OpenWRT VM 上。

## 9.1 监听地址

设置 AdGuardHome 监听：

```text
监听地址：192.168.50.2
DNS 端口：53
管理页面端口：例如 3000
```

## 9.2 上游 DNS

上游 DNS 有两种思路：

### 方案 A：AdGuardHome → OpenClash DNS

```text
客户端 → AdGuardHome → OpenClash DNS → 远端 DNS
```

适合希望 DNS 分流和出海规则都交给 OpenClash 的场景。

### 方案 B：AdGuardHome → 公共 DoH / DoT

```text
客户端 → AdGuardHome → DoH / DoT 上游
```

适合只想做广告过滤，不想让 DNS 过度依赖 OpenClash 的场景。

如果你主要依赖 OpenClash 处理国内外分流，推荐方案 A。

## 9.3 验证 AdGuardHome

在客户端指定 AdGuardHome 查询：

```bash
nslookup example.com 192.168.50.2
```

预期：能返回解析结果。

打开 AdGuardHome 管理页面，查看 Query Log。

预期：能看到刚才的 `example.com` 查询记录。

如果配置了广告过滤规则，可以查询一个已知广告域名：

```bash
nslookup <广告测试域名> 192.168.50.2
```

预期：返回被拦截结果，或者在 Query Log 中显示 blocked。

如果没有准备广告测试域名，只看 Query Log 即可，不必强行测试拦截。

## 9.4 客户端如何使用 AdGuardHome

模式一：手动在客户端设置 DNS 为：

```text
192.168.50.2
```

模式二：主路由 DHCP 下发 DNS 为：

```text
192.168.50.2
```

---

# 10. OpenClash 配置与本机 Clash 的关系

## 10.1 安装后的验证

OpenClash 安装完成后，先只让一台测试设备走 OpenWRT，确认稳定后再扩大范围。

### 验证 OpenClash

在测试设备上确认默认网关是 OpenWRT：

```bash
route -n get default
```

预期：默认网关是 `192.168.50.2`。

打开 OpenClash Dashboard，查看连接列表。

预期：测试设备访问网页时，Dashboard 中出现对应连接记录，并且规则命中符合预期。

再访问一个需要代理的网站和一个国内网站。

预期：

```text
需要代理的网站：走代理节点
国内网站：直连或按你的规则分流
```

如果 Dashboard 没有任何连接记录，先检查测试设备是否真的把网关和 DNS 指向了 OpenWRT。

## 10.2 在家时的推荐方式

如果设备已经通过 OpenWRT 走 OpenClash，电脑上的 Clash 建议关闭，或者切到直连模式。

推荐路径：

```text
电脑 → OpenWRT/OpenClash → 外网
```

不推荐路径：

```text
电脑 Clash → OpenWRT/OpenClash → 外网
```

后者属于“双代理”。不一定会断网，但可能造成：

- 延迟增加。
- 规则重复匹配。
- DNS 判断不一致。
- 某些站点登录风控异常。
- 排障困难，不知道问题出在本机 Clash 还是 OpenWRT OpenClash。

## 10.3 在外时的推荐方式

在公司、酒店、咖啡厅等外部网络中，继续使用电脑本机 Clash。

此时流量路径是：

```text
电脑 Clash → 当前网络出口 → 外网
```

如果还需要访问家里设备，则同时开启 Tailscale：

```text
电脑 → Tailscale → 家中设备
```

Tailscale 负责回家，Clash 负责出海，二者职责不同。

---

# 11. Tailscale 回家：Subnet Router 与 Exit Node 的区别

## 11.1 只访问家里设备：用 Tailscale 直连或 Subnet Router

如果家里的设备都安装了 Tailscale，直接使用它们的 Tailscale IP 访问即可。

如果有些设备不能安装 Tailscale，例如 NAS、打印机、摄像头，可以让 Docker VM 做 Subnet Router。这样能复用 derper 宿主机上的同一个 tailscaled：

```text
Docker VM
├── tailscaled：加入 tailnet
├── Subnet Router：宣告 192.168.50.0/24
└── derper：挂载 tailscaled.sock 做 VERIFY_CLIENTS
```

OpenWRT VM 不需要为了 Subnet Router 再登录 Tailscale，它继续只负责旁路由、OpenClash、AdGuardHome。

在 Docker VM 上开启 IP 转发：

```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

然后用 Docker VM 宣告家里网段：

```bash
sudo tailscale up \
  --accept-dns=false \
  --advertise-routes=192.168.50.0/24
```

然后在 Tailscale 管理后台批准这条路由。

默认情况下，Tailscale Subnet Router 会做 SNAT。家庭内网设备看到的来源是 Docker VM 的 LAN IP `192.168.50.3`，回包会自然回到 Docker VM，不需要先在主路由上加静态路由。

外部客户端需要接受子网路由：

```bash
tailscale up --accept-routes
```

### 验证 Subnet Router

在 Docker VM 上确认路由已宣告：

```bash
tailscale status
```

预期：Docker VM 节点在线，并且在 Tailscale 管理后台能看到 `192.168.50.0/24` 路由等待批准或已经批准。

在外部客户端检查是否接受了家庭网段路由：

```bash
tailscale status
```

预期：能看到 Docker VM 节点在线。

访问一个没有安装 Tailscale、但在家庭内网里的设备：

```bash
ping 192.168.50.x
```

预期：能收到回包。

也可以访问该设备的 Web 管理页面或 SSH 服务。

这样在外面就可以访问：

```text
192.168.50.x 家庭内网设备
```

## 11.2 Exit Node 是什么

Exit Node 是让外部设备把“全部互联网流量”都从家里出口出去：

```text
外部电脑 → Tailscale → 家中 Docker VM → 主路由 → 家庭宽带 → 外网
```

它不是“回家访问内网”的必要条件。

只有当你需要以下能力时才需要 Exit Node：

- 外出时使用家里公网 IP 上网。
- 公共 Wi-Fi 下把所有流量加密送回家。
- 访问某些只允许家庭 IP 的服务。

如果只是访问家里设备，用普通 Tailscale 连接或 Subnet Router 即可。

---

# 12. 自建 DERP 的作用

要区分两个场景。

## 12.1 外出访问家里设备：通常不需要自建 DERP

如果家里已有动态公网 IP，并且 Docker VM 已经作为 Tailscale Subnet Router 宣告了家庭内网网段，那么外出访问家里设备通常已经够用。

典型路径：

```text
外部电脑 → Tailscale → 家中 Docker VM Subnet Router → 家庭内网设备
```

这时家里的 Docker VM 是公网环境下更容易被访问的一端，Tailscale 更容易和它建立连接。即使访问的是没有安装 Tailscale 的内网设备，流量也可以通过 Docker VM 的 Subnet Router 进入家庭网段。

因此，如果需求只是“我在外面访问家里的 NAS、电脑、摄像头、打印机”，优先做：

```text
动态公网 + Docker VM Tailscale + Subnet Router
```

这条链路不一定需要自建 DERP。

## 12.2 自建 DERP 的真正价值：优化无法 P2P 的远端通信

自建 DERP 更适合另一个场景：你和某个远端网络之间无法直接 P2P，但远端机器允许安装 Tailscale，并且需要和你的设备加入同一个 tailnet 通信。

此时双方虽然都在 Tailscale 里，但由于远端网络限制、NAT 类型、防火墙策略等原因，实际访问可能无法直连，只能回退到官方 DERP：

```text
你的设备 → 官方 DERP → 远端设备
```

如果官方 DERP 路径绕路，延迟就会明显变高。

这时把 DERP 部署在家里的动态公网 OpenWRT/PVE 环境中，目标是让回退路径变成：

```text
你的设备 → 家中自建 DERP → 远端设备
```

自建 DERP 在这里不是为了“让你访问家里”，而是为了给无法 P2P 的远端 tailnet 通信提供一个更近、更可控的中继点。

## 12.3 结论

- 只为外出回家：优先配置 Subnet Router，不必急着自建 DERP。
- 为了优化无法 P2P 的远端访问：自建 DERP 有价值。
- 家里有动态公网 IP 的意义：让自建 DERP 可以部署在家里，从而省掉云服务器成本。

---

# 13. 动态公网 IP 变更处理

如果不想使用域名和 DDNS，可以直接走“公网 IP + 自签名证书指纹”的方案。

这时 **不需要 ddns-go**。ddns-go 的作用是把动态公网 IP 同步到域名；如果 DERP 配置里直接写公网 IP，那就没有域名记录需要更新。

但动态公网 IP 变化后，所有和固定 IP 绑定的配置都必须刷新：

- derper 的 `DERP_DOMAIN` / 自签名证书。
- derper 日志中生成的 `sha256-raw` 证书指纹。
- Tailscale ACL 里的 `derpMap`：`HostName`、`IPv4`、`CertName`。
- 主路由端口转发通常不需要改，因为它转发到内网 Docker VM IP。

推荐在 Docker VM 宿主机上放一个定时脚本：

```text
定时任务 → 检测当前公网 IP → 和上次记录比较 → 如果变化：重建 derper → 提取新证书指纹 → 输出需要更新的 derpMap 片段
```

这里不建议脚本自动修改 Tailscale ACL，因为 ACL 是全 tailnet 生效的控制面配置。更稳妥的做法是：脚本只生成新的 derpMap 片段，由你手动复制到 Tailscale 管理后台保存。

## 13.1 函数式脚本示例

在 Docker VM 上创建 `/opt/derp/update-derp-ip.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="/opt/derp/current_public_ip"
COMPOSE_FILE="/opt/derp/docker-compose.yml"
CERT_DIR="/opt/derp/certs"
REGION_ID="901"
REGION_CODE="home"
REGION_NAME="Home DERP"
DERP_TCP_PORT="55443"
STUN_UDP_PORT="53478"

get_public_ip() {
  curl -fsS4 https://ifconfig.me
}

get_saved_ip() {
  if [ -f "$STATE_FILE" ]; then
    cat "$STATE_FILE"
  fi
}

save_ip() {
  local ip="$1"
  printf '%s\n' "$ip" > "$STATE_FILE"
}

ip_changed() {
  local current_ip="$1"
  local saved_ip="$2"
  [ "$current_ip" != "$saved_ip" ]
}

write_compose_file() {
  local public_ip="$1"

  cat > "$COMPOSE_FILE" <<EOF
services:
  derper:
    container_name: derper
    image: fredliang/derper:latest
    restart: unless-stopped
    ports:
      - "${DERP_TCP_PORT}:33445"
      - "${STUN_UDP_PORT}:3478/udp"
    environment:
      DERP_DOMAIN: "${public_ip}"
      DERP_CERT_MODE: "manual"
      DERP_CERT_DIR: "/cert"
      DERP_ADDR: ":33445"
      DERP_STUN: "true"
      DERP_STUN_PORT: "3478"
      DERP_HTTP_PORT: "-1"
      DERP_VERIFY_CLIENTS: "true"
    volumes:
      - "/etc/localtime:/etc/localtime:ro"
      - "${CERT_DIR}:/cert"
      - "/var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock"
    cpus: "0.50"
    memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF
}

restart_derper() {
  cd /opt/derp
  docker compose up -d --force-recreate
}

extract_cert_fingerprint() {
  docker logs derper 2>&1 | grep -o 'sha256-raw:[^ ]*' | tail -n 1
}

print_derp_map() {
  local public_ip="$1"
  local cert_name="$2"

  cat <<EOF

请把 Tailscale ACL 中 derpMap 对应节点更新为：

"derpMap": {
  "OmitDefaultRegions": false,
  "Regions": {
    "${REGION_ID}": {
      "RegionID": ${REGION_ID},
      "RegionCode": "${REGION_CODE}",
      "RegionName": "${REGION_NAME}",
      "Nodes": [
        {
          "Name": "home-1",
          "RegionID": ${REGION_ID},
          "HostName": "${public_ip}",
          "IPv4": "${public_ip}",
          "DERPPort": ${DERP_TCP_PORT},
          "STUNPort": ${STUN_UDP_PORT},
          "STUNOnly": false,
          "InsecureForTests": true,
          "CertName": "${cert_name}"
        }
      ]
    }
  }
}
EOF
}

update_when_needed() {
  local current_ip
  local saved_ip
  local cert_name

  current_ip="$(get_public_ip)"
  saved_ip="$(get_saved_ip)"

  if ! ip_changed "$current_ip" "$saved_ip"; then
    printf 'Public IP unchanged: %s\n' "$current_ip"
    return 0
  fi

  printf 'Public IP changed: %s -> %s\n' "${saved_ip:-none}" "$current_ip"

  write_compose_file "$current_ip"
  restart_derper
  save_ip "$current_ip"

  cert_name="$(extract_cert_fingerprint)"
  print_derp_map "$current_ip" "$cert_name"
}

main() {
  update_when_needed
}

main "$@"
```

授权：

```bash
sudo chmod +x /opt/derp/update-derp-ip.sh
```

## 13.2 定时任务

使用 root 的 crontab：

```bash
sudo crontab -e
```

加入：

```cron
*/5 * * * * /opt/derp/update-derp-ip.sh >> /var/log/update-derp-ip.log 2>&1
```

含义：每 5 分钟检测一次公网 IP。如果 IP 没变化，只输出 `Public IP unchanged`；如果 IP 变化，就重建 derper 并输出新的 derpMap。

## 13.3 验证

手动运行一次：

```bash
sudo /opt/derp/update-derp-ip.sh
```

首次运行预期：

```text
Public IP changed: none -> <当前公网IP>
```

并输出一段新的 derpMap。

再次运行预期：

```text
Public IP unchanged: <当前公网IP>
```

检查容器状态：

```bash
cd /opt/derp
sudo docker compose ps
```

预期：`derper` 处于 running 状态。

查看脚本日志：

```bash
sudo tail -n 50 /var/log/update-derp-ip.log
```

预期：能看到定时任务输出。

---

# 14. 主路由端口放行

DERP 需要从公网访问 Docker VM。

如果 derper 运行在 Docker VM `192.168.50.3` 上，主路由需要做端口转发：

| 协议 | 外部端口 | 内部目标 | 说明 |
|---|---:|---|---|
| TCP | 55443 | 192.168.50.3:55443 | DERP HTTPS |
| UDP | 53478 | 192.168.50.3:53478 | STUN |

这里使用 50000+ 高位端口，减少和常见服务端口冲突。对应的 Tailscale derpMap 里也要写相同端口。

## 验证

在外部网络检查 TCP 端口：

```bash
nc -vz <当前公网IP> 55443
```

预期：TCP 连接成功。

UDP 端口不容易用普通 `nc` 准确验证，后续以 `tailscale netcheck` 的 STUN/DERP 结果为准。

如果 TCP 不通，按顺序检查：

1. 当前公网 IP 是否正确。
2. 主路由端口转发是否指向 Docker VM。
3. Docker VM 防火墙是否放行端口。
4. derper 容器是否正在监听。

安全建议：

- 只放行 DERP 必需端口。
- 不要把 OpenWRT 管理页面、PVE 管理页面、SSH 暴露到公网。
- DERP 必须开启客户端验证，避免被别人白嫖带宽。

---

# 15. Docker VM 部署 derper

以下以 Docker VM 为 Debian / Ubuntu 为例。

## 15.1 安装 Tailscale

Docker VM 本身需要加入你的 tailnet，因为它同时承担两个角色：

- derper 通过 `tailscaled.sock` 验证客户端身份。
- Docker VM 作为 Subnet Router 宣告家庭网段 `192.168.50.0/24`。

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up \
  --accept-dns=false \
  --advertise-routes=192.168.50.0/24
```

确认 socket 存在：

```bash
ls /var/run/tailscale/tailscaled.sock
```

### 验证

检查 Docker VM 是否已经加入 tailnet：

```bash
tailscale status
```

预期：能看到本机和其他 tailnet 设备，并在 Tailscale 管理后台看到 Docker VM 宣告的 `192.168.50.0/24` 路由。

检查 socket：

```bash
ls -l /var/run/tailscale/tailscaled.sock
```

预期：文件存在，后续可以挂载进 derper 容器。

## 15.2 创建目录

```bash
sudo mkdir -p /opt/derp/certs
```

### 验证

```bash
ls -ld /opt/derp/certs
```

预期：目录存在。

## 15.3 IP 自签名证书方案

不使用域名时，不申请 Let’s Encrypt 证书，也不需要 acme.sh。

derper 会根据 `DERP_DOMAIN=<当前公网IP>` 生成自签名证书。客户端侧通过 derpMap 里的 `CertName: sha256-raw:...` 信任这个证书指纹。

因此 IP 方案的关键不是“自动续签证书”，而是：

```text
公网 IP 变化 → derper 用新 IP 重建自签名证书 → 提取新指纹 → 手动更新 derpMap
```

这一过程已经交给第 13 节的定时脚本处理。

启动 derper 建议直接使用第 13 节脚本生成的 Docker Compose 文件，不再手写固定 IP。首次部署时执行：

```bash
sudo /opt/derp/update-derp-ip.sh
```

脚本会自动：

1. 检测当前公网 IP。
2. 写入 `/opt/derp/docker-compose.yml`。
3. 重建 derper 容器。
4. 提取 `sha256-raw` 证书指纹。
5. 输出需要复制到 Tailscale ACL 的 derpMap。

### 验证容器

检查容器状态：

```bash
docker ps
```

预期：`derper` 处于 running 状态。

查看日志：

```bash
docker logs --tail 50 derper
```

预期：没有证书加载失败、端口绑定失败、socket 权限失败等错误。

在 Docker VM 本机检查 HTTPS 响应：

```bash
curl -vk https://127.0.0.1:55443
```

预期：能连接到 derper 服务。

注意：

- `DERP_DOMAIN` 必须等于当前公网 IP。
- `DERP_VERIFY_CLIENTS=true` 必须开启。
- `/var/run/tailscale/tailscaled.sock` 必须挂载。

## 15.4 Docker Compose 文件

`/opt/derp/docker-compose.yml` 由第 13 节脚本自动生成，不建议手工维护。

生成后的文件应包含这些关键点：

```yaml
ports:
  - "55443:33445"
  - "53478:3478/udp"
environment:
  DERP_DOMAIN: "<当前公网IP>"
  DERP_CERT_MODE: "manual"
  DERP_CERT_DIR: "/cert"
  DERP_ADDR: ":33445"
  DERP_STUN_PORT: "3478"
  DERP_HTTP_PORT: "-1"
  DERP_VERIFY_CLIENTS: "true"
volumes:
  - "/opt/derp/certs:/cert"
  - "/var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock"
```

### 验证 Compose 部署

```bash
cd /opt/derp
sudo docker compose ps
sudo docker compose logs --tail 50
```

预期：`derper` 处于 running 状态，日志中没有端口、socket 相关错误，并能看到 `sha256-raw` 证书指纹。

---

# 16. Tailscale derpMap 配置

进入 Tailscale 管理后台的 Access Control，添加 derpMap。

IP 自签名方案示例：

```json
"derpMap": {
  "OmitDefaultRegions": false,
  "Regions": {
    "901": {
      "RegionID": 901,
      "RegionCode": "home",
      "RegionName": "Home DERP",
      "Nodes": [
        {
          "Name": "home-1",
          "RegionID": 901,
          "HostName": "<当前公网IP>",
          "IPv4": "<当前公网IP>",
          "DERPPort": 55443,
          "STUNPort": 53478,
          "STUNOnly": false,
          "InsecureForTests": true,
          "CertName": "sha256-raw:<脚本输出的证书指纹>"
        }
      ]
    }
  }
}
```

说明：

- `OmitDefaultRegions: false`：保留官方 DERP 作为兜底。
- `RegionID` 建议使用 900 以上，避免和官方节点冲突。
- `HostName` 和 `IPv4` 必须是当前公网 IP。
- `DERPPort` 必须和主路由 TCP 端口转发一致。
- `STUNPort` 必须和主路由 UDP 端口转发一致。
- `InsecureForTests: true` 是 IP 自签名方案必须项，用于跳过 CA 链校验。
- `CertName` 必须填脚本从 derper 日志中提取到的 `sha256-raw` 指纹。

## 验证

保存 ACL 后，在客户端执行：

```bash
tailscale netcheck
```

预期：`DERP Latency` 列表里出现自建区域，例如：

```text
home: xx ms
```

再执行：

```bash
tailscale debug derp 901
```

预期：可以成功建立 DERP 连接。

如果 `netcheck` 看不到 `home`，优先检查 ACL JSON 是否保存成功、`RegionID` 是否重复、客户端是否已经收到最新网络配置。

---

# 17. 最终总体验收

前面的每个配置阶段都已经包含对应验证。全部完成后，再做一次总体验收。

## 17.1 家庭内网访问验收

在外部网络访问一个家庭内网设备：

```bash
ping 192.168.50.x
```

预期：能收到回包。

如果目标设备有 Web 服务，也可以直接访问：

```text
http://192.168.50.x
```

预期：能打开对应服务。

这一步验证的是：

```text
外部设备 → Tailscale → Docker VM Subnet Router → 家庭内网设备
```

## 17.2 DERP 回退路径验收

在客户端执行：

```bash
tailscale netcheck
```

预期：`DERP Latency` 中能看到自建 DERP 区域，例如：

```text
home: xx ms
```

再对远端 tailnet 设备执行：

```bash
tailscale ping <远端设备的 Tailscale IP>
```

理想情况是：

```text
direct
```

如果 P2P 失败，预期回退到：

```text
via DERP(home)
```

这一步验证的是：

```text
你的设备 → 家中自建 DERP → 远端设备
```

## 17.3 家中出海与广告屏蔽验收

在一台走 OpenWRT 网关的测试设备上：

1. 打开 OpenClash Dashboard，访问一个需要代理的网站，确认有连接记录。
2. 打开 AdGuardHome Query Log，访问几个网页，确认有 DNS 查询记录。
3. 关闭本机 Clash 或切到直连模式，再确认网页访问仍然符合预期。

这一步验证的是：

```text
测试设备 → OpenWRT → OpenClash / AdGuardHome → 外网
```

---

# 18. OpenWRT 宕机时的恢复策略

## 18.1 如果使用模式一：手动指定设备

受影响的只有手动配置过网关/DNS 的设备。

恢复方式：

```text
网关改回：192.168.50.1
DNS 改回：192.168.50.1
```

其他普通设备不受影响。

## 18.2 如果使用模式二：主路由 DHCP 下发

恢复方式：

1. 登录主路由后台。
2. DHCP 默认网关改回 `192.168.50.1`。
3. DHCP DNS 改回 `192.168.50.1` 或运营商 DNS。
4. 客户端断开重连 Wi-Fi，重新获取 DHCP。

## 18.3 PVE 层面的恢复

建议在每次大改前给 VM 做快照：

- OpenWRT 修改防火墙前拍快照。
- OpenClash 大版本升级前拍快照。
- AdGuardHome 大版本升级前拍快照。
- derper 改证书、端口、compose 文件前拍快照。

这样出现问题可以快速回滚。

---

# 19. 安全注意事项

## 19.1 不要暴露管理面板

不要把这些服务暴露到公网：

- PVE 管理页面
- OpenWRT LuCI
- AdGuardHome 管理页面
- SSH
- Docker API

公网只放行 DERP 必需端口。

## 19.2 DERP 必须防白嫖

必须开启：

```text
DERP_VERIFY_CLIENTS=true
```

并挂载：

```text
/var/run/tailscale/tailscaled.sock
```

否则别人只要知道你的 DERP 地址，就可能把你的服务器当公共中继使用。

## 19.3 IP 方案的配置更新风险

IP 方案不依赖 Cloudflare Token，但公网 IP 变化后必须更新 Tailscale ACL 中的 derpMap。

注意：

- 脚本只输出新的 derpMap，不自动改 ACL。
- 复制 derpMap 时要同时更新 `HostName`、`IPv4`、`CertName`。
- 如果只更新 IP、不更新 `CertName`，客户端会因为证书指纹不匹配而拒绝连接。

## 19.4 家庭动态公网的风险

有公网 IP 后，家里网络更容易被扫描。原则是：

- 主路由只转发必要端口。
- 管理服务只允许内网或 Tailscale 访问。
- OpenWRT、PVE、Docker VM 定期更新。
- 重要服务使用强密码和密钥登录。

---

# 20. 推荐落地顺序

不要一次性把所有功能都打开。推荐按这个顺序逐步验证：

1. 安装 PVE，确认管理页面稳定可访问。
2. 创建 OpenWRT VM，设置固定 IP `192.168.50.2`，关闭 DHCP。
3. 用模式一手动让一台电脑走 OpenWRT 网关，确认普通上网正常。
4. 安装 AdGuardHome，确认 DNS 过滤生效。
5. 安装 OpenClash，确认该电脑在家时不需要本机 Clash 也能出海。
6. 创建 Docker VM，安装 Docker 和 Tailscale。
7. 配置主路由端口转发。
8. 部署 IP 检测脚本，让脚本生成 Compose 文件并启动 derper。
9. 复制脚本输出的 derpMap 到 Tailscale ACL。
10. 在外部网络执行 `tailscale netcheck` 和 `tailscale ping` 验证路径。
11. 如果模式一稳定，再考虑是否切换到模式二，让主路由 DHCP 下发 OpenWRT 网关/DNS。

最终稳定状态：

```text
普通设备：主路由直出，稳定优先
高级设备：OpenWRT 旁路由，获得 OpenClash + AdGuardHome
外出回家：Tailscale + Subnet Router 访问家庭内网
远端受限网络访问：P2P 失败时回退到家中自建 DERP
故障恢复：OpenWRT 异常时手动切回主路由
```
