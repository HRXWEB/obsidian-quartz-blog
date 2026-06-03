---
title: OpenWRT + PVE + 动态公网自建 Tailscale DERP 与旁路由全方案
draft: false
aliases: []
tags: []
created: 2026-06-03T00:00:00.000+08:00
updated: 2026-06-03T00:00:00.000+08:00
---

# 目标

这套方案要同时满足四个需求：

1. **外出时稳定回家**：继续使用 Tailscale 访问家中设备；当 P2P 打洞失败时，不走官方 DERP，而是走家里动态公网自建的 DERP。
2. **家中网关级出海**：在家时可以让指定设备通过 OpenWRT + OpenClash 出海，不必每台设备都单独配置代理。
3. **广告屏蔽**：通过 AdGuardHome 提供 DNS 级广告过滤。
4. **OpenWRT 异常时不影响基础上网**：主路由继续承担基础上网能力；OpenWRT 作为旁路由提供增强功能，必要时手动切回主路由。

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
        │   ├── AdGuardHome
        │   └── Tailscale subnet router / 可选 exit node
        │
        └── Debian / Ubuntu VM
            └── Docker 部署 derper
```

---

# 1. 为什么推荐 PVE + Docker，而不是 OpenWRT 里直接跑 DERP

DERP 本质上只是一个中继服务，理论上可以直接在 OpenWRT 上跑二进制。但更推荐用 PVE 拆成两个虚拟机：

- **OpenWRT VM**：只负责网络功能，例如旁路由、OpenClash、AdGuardHome、Tailscale 子网路由。
- **Debian / Ubuntu VM**：只负责 Docker 服务，例如 derper。

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
├── OpenWRT VM：网络功能
└── Debian / Ubuntu VM：Docker + derper
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
主路由 IP：192.168.1.1
主路由 DHCP：192.168.1.100 - 192.168.1.250
OpenWRT IP：192.168.1.2
Docker VM IP：192.168.1.3
AdGuardHome IP：192.168.1.2
DERP 域名：derp.example.com
DERP TCP 端口：33445
STUN UDP 端口：3478
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

## 4.2 创建 OpenWRT VM

OpenWRT VM 建议配置：

```text
CPU：2 核
内存：1GB - 2GB
硬盘：1GB - 4GB
网卡：virtio，接入 vmbr0
```

如果 OpenWRT 只是旁路由，一个网卡即可。它和主路由处在同一个 LAN 网段中。

## 4.3 创建 Debian / Ubuntu Docker VM

Docker VM 建议配置：

```text
CPU：1 - 2 核
内存：1GB - 2GB
硬盘：10GB - 20GB
网卡：virtio，接入 vmbr0
```

这个 VM 专门运行 Docker 和 derper，避免把 Docker 放进 OpenWRT。

---

# 5. OpenWRT 旁路由基础配置

OpenWRT 作为旁路由时，不要让它接管全家网络。它只提供增强能力。

基础设置：

```text
OpenWRT LAN IP：192.168.1.2
OpenWRT 网关：192.168.1.1
OpenWRT DNS：可以先填 192.168.1.1，后续再改 AdGuardHome / OpenClash
OpenWRT DHCP：关闭
```

重点：

- **主路由继续负责 DHCP**。
- **OpenWRT 不负责给全网发 IP**。
- **OpenWRT 的默认网关指向主路由**，这样 OpenWRT 自己可以正常联网。

---

# 6. 旁路由使用模式一：手动指定设备走 OpenWRT

## 适用场景

适合你只想让自己的电脑、手机、测试设备使用 OpenClash 和 AdGuardHome，不想影响家人设备。

这是最稳妥、最容易排障的模式。

## 工作原理

普通设备：

```text
设备 → 主路由 192.168.1.1 → 外网
```

高级功能设备：

```text
设备 → OpenWRT 192.168.1.2 → 主路由 192.168.1.1 → 外网
             │
             ├── OpenClash 处理出海流量
             └── AdGuardHome 处理 DNS 过滤
```

## 客户端配置

在需要高级功能的设备上手动设置：

```text
IP：保持 DHCP 或手动固定均可
网关：192.168.1.2
DNS：192.168.1.2
```

OpenWRT 异常时，把网关和 DNS 改回：

```text
网关：192.168.1.1
DNS：192.168.1.1
```

这样就能恢复普通上网。

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
IP：192.168.1.x
网关：192.168.1.2
DNS：192.168.1.2
```

实际流量：

```text
设备 → OpenWRT 192.168.1.2 → 主路由 192.168.1.1 → 外网
```

## 主路由配置

在主路由 DHCP 设置里，把默认网关和 DNS 改为：

```text
默认网关：192.168.1.2
DNS：192.168.1.2
```

如果主路由不支持自定义 DHCP 网关，可以继续使用模式一，不必强行折腾。

## OpenWRT 异常时如何恢复

进入主路由后台，把 DHCP 下发改回：

```text
默认网关：192.168.1.1
DNS：192.168.1.1
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
监听地址：192.168.1.2
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

## 9.3 客户端如何使用 AdGuardHome

模式一：手动在客户端设置 DNS 为：

```text
192.168.1.2
```

模式二：主路由 DHCP 下发 DNS 为：

```text
192.168.1.2
```

---

# 10. OpenClash 配置与本机 Clash 的关系

## 10.1 在家时的推荐方式

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

## 10.2 在外时的推荐方式

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

如果有些设备不能安装 Tailscale，例如 NAS、打印机、摄像头，可以让 OpenWRT 做 Subnet Router。

在 OpenWRT 上开启 IP 转发，然后宣告家里网段：

```bash
tailscale up --advertise-routes=192.168.1.0/24
```

然后在 Tailscale 管理后台批准这条路由。

外部客户端需要接受子网路由：

```bash
tailscale up --accept-routes
```

这样在外面就可以访问：

```text
192.168.1.x 家庭内网设备
```

## 11.2 Exit Node 是什么

Exit Node 是让外部设备把“全部互联网流量”都从家里出口出去：

```text
外部电脑 → Tailscale → 家中 OpenWRT → 家庭宽带 → 外网
```

它不是“回家访问内网”的必要条件。

只有当你需要以下能力时才需要 Exit Node：

- 外出时使用家里公网 IP 上网。
- 公共 Wi-Fi 下把所有流量加密送回家。
- 访问某些只允许家庭 IP 的服务。

如果只是访问家里设备，用普通 Tailscale 连接或 Subnet Router 即可。

---

# 12. 自建 DERP 的作用

即使家里有动态公网 IP，仍然可能需要 DERP。

原因是 Tailscale 通信涉及两端：

```text
外部电脑 ↔ 家里 OpenWRT / 家里设备
```

家里有公网 IP，只说明家里这一端更容易被访问。但公司、学校、酒店、公共 Wi-Fi 那一端的 NAT 和防火墙你控制不了。

当 P2P 失败时，Tailscale 会回退到 DERP：

```text
外部电脑 → DERP 中继 → 家里设备
```

如果没有自建 DERP，可能走官方节点，延迟不稳定。自建 DERP 的价值是：

- 让失败回退路径走自己的节点。
- 选择离自己更近、带宽更可控的位置。
- 避免官方 DERP 绕路。

动态公网 + 家中 DERP 的路径：

```text
外部电脑 → 家中动态公网 DERP → 家里设备
```

---

# 13. 动态公网与 DDNS

家里是动态公网 IP 时，必须配置 DDNS。

目标：

```text
derp.example.com 始终解析到当前家庭公网 IP
```

推荐做法：

1. 域名托管到 Cloudflare。
2. 在 OpenWRT 或 Docker VM 上运行 DDNS 客户端。
3. 使用 Cloudflare API Token 更新 A 记录。
4. TTL 设置为 Auto 或较短时间。

Cloudflare API Token 权限建议：

```text
Zone - Zone - Read
Zone - DNS - Edit
范围限制到指定域名
```

不要使用全局 API Key。

---

# 14. 主路由端口放行

DERP 需要从公网访问 Docker VM。

如果 derper 运行在 Docker VM `192.168.1.3` 上，主路由需要做端口转发：

| 协议 | 外部端口 | 内部目标 | 说明 |
|---|---:|---|---|
| TCP | 33445 | 192.168.1.3:33445 | DERP HTTPS |
| UDP | 3478 | 192.168.1.3:3478 | STUN |

如果使用其他高位端口，也可以，例如：

```text
TCP 55443 → 192.168.1.3:33445
UDP 53478 → 192.168.1.3:3478
```

对应的 Tailscale derpMap 里也要写相同端口。

安全建议：

- 只放行 DERP 必需端口。
- 不要把 OpenWRT 管理页面、PVE 管理页面、SSH 暴露到公网。
- DERP 必须开启客户端验证，避免被别人白嫖带宽。

---

# 15. Docker VM 部署 derper

以下以 Docker VM 为 Debian / Ubuntu 为例。

## 15.1 安装 Tailscale

Docker VM 本身需要加入你的 tailnet，因为 derper 要通过 tailscaled.sock 验证客户端身份。

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --accept-dns=false
```

确认 socket 存在：

```bash
ls /var/run/tailscale/tailscaled.sock
```

## 15.2 创建目录

```bash
sudo mkdir -p /opt/derp/certs
```

## 15.3 域名证书方案

如果使用正式域名和 Let’s Encrypt 证书，推荐 DERP 监听 TCP 33445，STUN 监听 UDP 3478。

安装 acme.sh：

```bash
curl https://get.acme.sh | sh -s email=your@email.com
source ~/.bashrc
```

配置 Cloudflare Token：

```bash
export CF_Token="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

切换默认 CA：

```bash
acme.sh --set-default-ca --server letsencrypt
```

申请 ECC 证书：

```bash
acme.sh --issue --dns dns_cf -d derp.example.com --ecc
```

部署证书并注册自动重启钩子：

```bash
acme.sh --install-cert -d derp.example.com --ecc \
  --key-file       /opt/derp/certs/derp.example.com.key \
  --fullchain-file /opt/derp/certs/derp.example.com.crt \
  --reloadcmd      "docker restart derper"
```

启动 derper：

```bash
docker run -d \
  --name derper \
  --restart always \
  --cpus 0.5 \
  --memory 256m \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 33445:443 \
  -p 3478:3478/udp \
  -v /opt/derp/certs:/app/certs \
  -v /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock \
  -e DERP_DOMAIN=derp.example.com \
  -e DERP_CERT_MODE=manual \
  -e DERP_VERIFY_CLIENTS=true \
  fredliang/derper
```

注意：

- `DERP_DOMAIN` 必须和证书域名一致。
- `DERP_VERIFY_CLIENTS=true` 必须开启。
- `/var/run/tailscale/tailscaled.sock` 必须挂载。

## 15.4 Docker Compose 写法

也可以使用 `/opt/derp/docker-compose.yml`：

```yaml
services:
  derper:
    container_name: derper
    image: fredliang/derper:latest
    restart: unless-stopped
    ports:
      - "33445:443"
      - "3478:3478/udp"
    environment:
      DERP_DOMAIN: "derp.example.com"
      DERP_CERT_MODE: "manual"
      DERP_VERIFY_CLIENTS: "true"
    volumes:
      - "/opt/derp/certs:/app/certs"
      - "/var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock"
    cpus: "0.50"
    memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

启动：

```bash
cd /opt/derp
sudo docker compose up -d
```

---

# 16. Tailscale derpMap 配置

进入 Tailscale 管理后台的 Access Control，添加 derpMap。

域名证书方案示例：

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
          "HostName": "derp.example.com",
          "DERPPort": 33445,
          "STUNPort": 3478,
          "InsecureForTests": false
        }
      ]
    }
  }
}
```

说明：

- `OmitDefaultRegions: false`：保留官方 DERP 作为兜底。
- `RegionID` 建议使用 900 以上，避免和官方节点冲突。
- `HostName` 必须和证书域名一致。
- `DERPPort` 必须和主路由端口转发一致。
- `STUNPort` 必须和主路由 UDP 端口转发一致。

---

# 17. 验证步骤

## 17.1 验证 DDNS

在外部网络执行：

```bash
nslookup derp.example.com
```

确认解析结果是当前家庭公网 IP。

## 17.2 验证端口开放

在外部网络执行：

```bash
nc -vz derp.example.com 33445
```

预期 TCP 端口成功。

UDP 不容易用 `nc` 准确判断，最终以 Tailscale netcheck 为准。

## 17.3 验证 DERP TLS

```bash
curl -v https://derp.example.com:33445
```

如果证书和服务正常，应看到 DERP 相关响应，且没有证书域名不匹配错误。

## 17.4 验证 Tailscale 识别自建 DERP

在客户端执行：

```bash
tailscale netcheck
```

检查 `DERP Latency` 中是否出现：

```text
home: xx ms
```

## 17.5 验证连接实际路径

对家中设备执行：

```bash
tailscale ping <目标设备的 Tailscale IP>
```

理想情况：

```text
direct
```

如果无法直连，预期看到：

```text
via DERP(home)
```

这说明自建 DERP 已经作为失败回退路径生效。

---

# 18. OpenWRT 宕机时的恢复策略

## 18.1 如果使用模式一：手动指定设备

受影响的只有手动配置过网关/DNS 的设备。

恢复方式：

```text
网关改回：192.168.1.1
DNS 改回：192.168.1.1
```

其他普通设备不受影响。

## 18.2 如果使用模式二：主路由 DHCP 下发

恢复方式：

1. 登录主路由后台。
2. DHCP 默认网关改回 `192.168.1.1`。
3. DHCP DNS 改回 `192.168.1.1` 或运营商 DNS。
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

## 19.3 Cloudflare Token 最小权限

Cloudflare API Token 只给：

```text
Zone - Zone - Read
Zone - DNS - Edit
```

并限制到具体域名。

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
2. 创建 OpenWRT VM，设置固定 IP `192.168.1.2`，关闭 DHCP。
3. 用模式一手动让一台电脑走 OpenWRT 网关，确认普通上网正常。
4. 安装 AdGuardHome，确认 DNS 过滤生效。
5. 安装 OpenClash，确认该电脑在家时不需要本机 Clash 也能出海。
6. 创建 Docker VM，安装 Docker 和 Tailscale。
7. 部署 derper，配置证书和端口转发。
8. 配置 DDNS，确认域名指向家庭公网 IP。
9. 配置 Tailscale derpMap。
10. 在外部网络执行 `tailscale netcheck` 和 `tailscale ping` 验证路径。
11. 如果模式一稳定，再考虑是否切换到模式二，让主路由 DHCP 下发 OpenWRT 网关/DNS。

最终稳定状态：

```text
普通设备：主路由直出，稳定优先
高级设备：OpenWRT 旁路由，获得 OpenClash + AdGuardHome
外部访问：Tailscale 优先 P2P，失败后走自建 DERP
故障恢复：OpenWRT 异常时手动切回主路由
```
