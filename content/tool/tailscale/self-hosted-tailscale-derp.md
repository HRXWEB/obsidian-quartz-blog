---
title: Tailscale 私有 DERP 中转服务器搭建全指南。
draft: false
aliases: []
tags: []
created: 2026-04-28T13:12:54.5454+08:00
updated: 2026-05-04T00:52:11.1111+08:00
---

> [!important] 建议
> 先看完所有配置阶段后熟悉所有的环节和概念（这个过程使用的是域名方案，需要备案），然后跳转到 [[#不备案纯 IP 方案]] 去部署。免去备案的烦恼。

> [!example] 注意点
> - tailscale 启动之后会污染 dns（尝试过启动时加 `--accept-dns=false` 没有解决），导致宿主机 `apt update` `ping www.baidu.com` 网络不通，可以先 `systemctl stop tailscaled` 关闭 tailscale 服务

# 第一阶段：基础设施准备（云服务器与网络安全）

## 1. 云服务器 (ECS) 的选型逻辑

对于 DERP 这种纯流量转发型服务，资源消耗极其不均衡：**CPU/内存需求极低，但对带宽延迟极度敏感**。

- **地域选择**：必须选择离你主要使用设备最近的节点。
- **计费模式**：强烈建议选择 **“按使用流量计费”**。
    - 将带宽上限直接拉到 **100Mbps**（甚至更高）。
    - DERP 平时负载极低，只有在传输大文件或远程桌面时才会有峰值。按量付费能保证你在需要时有足够的带宽吞吐，而平时只需支付极少的存储费。
- **镜像版本**：推荐 **Ubuntu 22.04 或 24.04 LTS**，内核较新，对 Docker 和网络栈的优化更好。

---

## 2. 配置“防火墙模板”（安全组控制台）

在云控制台，不要直接在实例里乱改，建议先创建一个**安全组模板**，方便后续扩容或管理。

#### **核心入方向规则 (Inbound)**

你需要手动添加以下三条规则，缺一不可：

|**协议类型**|**端口范围**|**授权对象**|**描述**|
|---|---|---|---|
|**TCP**|`33445`|`0.0.0.0/0`|**DERP HTTPS 端口**。避开 443 减少被扫描，用于 TLS 握手和数据中转。|
|**UDP**|`3478`|`0.0.0.0/0`|**STUN 端口**。这是 Tailscale 进行 NAT 穿透探测的核心，不通则无法实现 P2P。|
|**TCP**|`22`|`你的办公/家IP`|**SSH 远程管理**。建议限制来源 IP 以保安全。|

---

## 3. 云服务器的网络检查（重要）

在云控制台完成配置后，务必确认以下两点，否则容易出现“内通外不通”：

- **关联实例**：确保刚才创建的安全组已经正确关联到了你的 ECS 实例。
- **出方向规则 (Outbound)**：默认通常是“允许所有”，请保持现状，确保 DERP 容器能访问公网去校验 `tailscaled.sock` 和回传数据。

---

## 4. 系统资源保护（2C2G 小规格必做）

2 核 2GB 的轻量服务器跑 Docker + Tailscale + 系统服务，内存余量极小。不做以下两步，系统在负载突增时（如自动更新触发大规模磁盘 I/O）极易被 OOM Killer 杀进程甚至整机锁死。

### A. 强制添加 Swap

在 2GB 内存的机器上不设置 Swap 是非常危险的。Swap 相当于在硬盘上开辟一块空间充当 " 临时内存 "，当内存快满时，系统会把不常用的数据移到硬盘，防止内核因为 " 无路可走 " 而触发 OOM 锁死 CPU。

```bash
# 创建 2G 的虚拟内存
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 写入 fstab 防止重启失效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# ESSD 云盘读写性能好，但 Swap 毕竟是磁盘 I/O，
# 将 swappiness 调低，让系统尽量用完物理内存后再动用 Swap
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

- **验证**：执行 `free -h`，Swap 一行应显示 `2.0Gi`。

### B. 关闭自动更新（减少突发负载）

Ubuntu 默认开启的 `unattended-upgrades` 会在后台自动下载和安装软件包更新。在大内存机器上无感，但在 2GB 机器上，一旦触发大规模更新 + 磁盘扫描，极易打满 CPU 和内存，导致 SSH 无响应。

```bash
sudo systemctl stop unattended-upgrades
sudo systemctl disable unattended-upgrades
```

> [!warning] 代价
> 关闭后你将**失去自动安全补丁**。对于一台只暴露两个高位端口的 DERP 中转服务器，攻击面极小，风险可控。但建议每月手动执行一次 `apt update && apt upgrade` 保持系统更新。

---

## 5. 安装本地 Tailscale (宿主机节点)

为了让 DERP 具备“查票”验证能力，宿主机本身必须也加入你的 Tailscale 网络：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --accept-dns=false
```

- **检查 Sock 文件**：安装后确认 `/var/run/tailscale/tailscaled.sock` 存在，它是 DERP 容器识别“自己人”的唯一信物。

### 为什么要加 `--accept-dns=false`？

这个参数是**网络稳定性的救命稻草**。

#### A. 防止内网“失联” (The Aliyun Conflict)

阿里云的 `apt` 源和内部服务依赖其内网 DNS（通常是 `100.100.2.136`）。

- **默认 (True)**：Tailscale 会接管 `/etc/resolv.conf`，将所有 DNS 请求导向自己的 `100.100.100.100`。
- **结果**：Tailscale 有时无法正确转发阿里云的内网域名请求，导致 `apt update` 拿不到 IP，或者像刚才那样虽然拿到了 IP 但路由优先级混乱。
- **关闭后**：系统将继续使用阿里云原生的 DNS，互不干扰。

#### B. 解决“127.0.0.53”死循环

Ubuntu 24.04 使用 `systemd-resolved`。

- **默认 (True)**：Tailscale 会试图通过 `resolvectl` 强行插入解析链路。
- **结果**：在某些复杂的网络环境下（尤其是国内云厂商），这会导致 DNS 环路或超时，表现为你刚才遇到的 `Connecting to mirrors...` 卡死。

---

**第一阶段完成后，你的服务器就是一个在公网上“待命”的专业网关了。下一步就是通过 DNS 把你的域名和这台机器的 IP 绑定，并把灰云朵点亮。**

---

# 第二阶段：DNS 解析与流量路由配置

## 1. 域名解析策略（Cloudflare 侧）

由于你的 DERP 服务器没有备案，选择 Cloudflare (CF) 作为 DNS 解析商是最灵活的做法。

- **添加 A 记录**：
    - **Type**: `A`
    - **Name**: `derp`（对应完整域名 `derp.xxx.xxx`）
    - **IPv4 address**: 填入你在第一阶段获得的阿里云 **公网 IP**。
    - **TTL**: 设置为 `Auto` 或 `1 min`（方便后续如果更换服务器能快速生效）。
- **关键：关闭代理模式 (Proxy Status)**：
    - **操作**：点击那朵云，使其变为 **灰色 (DNS Only)**。
    - **为什么要这样做？**：Cloudflare 的“橙色云朵”是为 Web 流量（HTTP/HTTPS）设计的 CDN 代理。而 Tailscale 的 DERP 协议涉及非标端口的 TLS 握手和复杂的 UDP 穿透协助。如果开启代理，CF 节点会尝试接管 TLS，导致 Tailscale 客户端无法识别真实的服务器指纹，直接导致连接失败。

---

## 2. 申请 Cloudflare API 令牌 (Token)

为了在第四阶段实现“无人值守”的证书更新，我们需要让宿主机的 `acme.sh` 有权限修改 DNS 记录来证明域名的所有权（DNS-01 验证）。

- **步骤**：
    
    1. [登录 CF 控制台](https://dash.cloudflare.com)，点击右上角 **My Profile -> API Tokens**。
    2. 点击 **Create Token**。
    3. 选择 **Edit Cloudflare DNS** 模板。
    4. **Permissions**：确保包含 `Zone - DNS - Edit` 和 `Zone - Zone - Read`。
    5. **Zone Resources**：选择 `Include - Specific zone - xxx.xxx`。
    6. 记录下生成的 **API Token**（它只会出现一次）。

---

## 3. 连通性预检

在进入容器部署阶段之前，必须确保解析已经生效。在你的 **本地电脑 (macOS)** 终端运行：

```bash
# 验证解析是否指向云服务器 IP
nslookup derp.xxx.xxx

# 验证端口是否已在公网开放（第一阶段防火墙生效检查）
nc -vz derp.xxx.xxx 33445
```

- **预期结果**：`nc` 命令返回 `succeeded`。如果显示 `Connection refused` 或 `Timeout`，请回过头检查云安全组是否有误，或者你的 ISP 是否拦截了该非标端口。

---

## 4. 为什么不直接用公网 IP？

虽然 Tailscale ACL 支持填 IP，但使用域名有三个不可替代的优势：

1. **SSL 证书绑定**：DERP 必须在 TLS (HTTPS) 下运行，证书是绑定域名的，IP 无法直接申请常规免费证书。
2. **平滑迁移**：如果当前云节点故障，你可以在其他区域再起一台，只需在 DNS 里改一下 IP，所有客户端会自动重连，无需修改 ACL。
3. **安全性**：配合证书，可以防止中间人攻击（MITM），确保你的中转数据只有你自己能解密。

---

**第二阶段完成后，你的域名已经像导航一样指向了那台待命的服务器。接下来，我们将进入第三阶段，在那台服务器上拉起具有“查票功能”的 Docker 容器。**

---

# 第三阶段：Docker 容器部署与身份验证闭环

## 1. 镜像选择与环境适配

我们使用的是 `fredliang/derper`，这个镜像对原生 Tailscale DERP 进行了封装，支持通过环境变量快速配置。

- **获取镜像**：考虑到国内云服务器拉取 Docker Hub 可能存在网络抖动，建议配置加速器或通过 `docker pull` 预先缓存。
- **核心依赖**：确保宿主机的 `/var/run/tailscale/tailscaled.sock` 存在。这个文件是容器内 DERP 进程向宿主机 Tailscale 询问“这个客户端是不是咱家人”的通信渠道。

---

## 2. 建立证书挂载目录

在宿主机创建持久化目录，用于存放第四阶段将生成的 SSL 证书。

```bash
sudo mkdir -p /opt/derp/certs
```

---

## 3. 执行容器启动命令（深度解析）

这是整个项目的核心命令，每一行环境变量都对应一个关键的工程逻辑：

```bash
docker run -d \
  --name derper \
  --restart always \
  -p 33445:443 \
  -p 3478:3478/udp \
  -v /opt/derp/certs:/app/certs \
  -v /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock \
  -e DERP_DOMAIN=derp.xxx.xxx \
  -e DERP_CERT_MODE=manual \
  -e DERP_VERIFY_CLIENTS=true \
  fredliang/derper
```

#### **参数详解：**

- **`-p 33445:443`**：将容器内的 HTTPS 标准端口映射到宿主机的非标端口 33445。这既能通过防火墙，又能有效避开针对 443 端口的扫描。
- **`-v ...tailscaled.sock`**：**最关键的挂载**。通过这个 Socket，DERP 获得了“查票”的能力。
- **`DERP_CERT_MODE=manual`**：禁止镜像自带的自动申请逻辑。因为我们要用 `acme.sh` 手动管理证书，这样更灵活且利于多机同步。
- **`DERP_VERIFY_CLIENTS=true`**：开启防白嫖开关。没有这个参数，你的服务器就是公共中转站，带宽会被瞬间耗尽。

---

## 4. 直观验证：服务是否真的启动？

容器启动后，不要只看 `docker ps`，要通过以下三步确认服务质量：

### **A. 检查容器内连通性**

```bash
docker logs -f derper
```

- **预期输出**：看到 `derper: serving on :443 with TLS`。

### **B. 验证证书加载（此时证书尚未申请，服务可能会报警告，这是正常的）**

由于我们选了 `manual` 模式且还没放证书，此时服务会启动但 TLS 可能握手失败。这正是我们进入第四阶段的触发条件。

### **C. 验证 Socket 权限**

如果日志报 `permission denied` 访问 `.sock` 失败，需要给宿主机的 Socket 提权：

```bash
sudo chmod 666 /var/run/tailscale/tailscaled.sock
```

---

## 5. 身份校验逻辑的“直观体验”

一旦这个阶段部署完成，任何尝试连接该服务器的外部设备，如果不在你的 Tailscale 网络中，DERP 会在日志中直接打印 `rejected: peer nodekey:... not found in local tailscaled`。

**第三阶段完成后，你的 DERP 就像一个装好了防盗门但还没拿到钥匙（证书）的房间。接下来的第四阶段，我们将通过 acme.sh 打造这把“全自动钥匙”。**

---

# 第四阶段：自动化证书管理与全自动钩子 (Hook)

## 1. 安装 acme.sh 脚本

`acme.sh` 是目前最轻量、功能最全的自动化证书管理工具，它支持全自动续期并触发后续动作。

```bash
# 安装 acme.sh，替换为你的真实邮箱用于接收通知
curl https://get.acme.sh | sh -s email=your@email.com

# 使环境变量生效
source ~/.bashrc
```

---

## 2. 配置 Cloudflare API 凭证

为了让脚本能自动完成 DNS-01 挑战（无需手动改解析记录），我们需要将第二阶段申请的 Token 导入环境变量：

```bash
# 这里的 Token 来自第二阶段的记录
export CF_Token="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 3. 申请证书 (ECC 算法)

现在的 `acme.sh` 默认使用 ZeroSSL，而 ZeroSSL 的 API 在国内部分网络环境下极其不稳定，且需要绑定邮箱，经常会导致申请失败。为了保证成功率，**切换到 Let's Encrypt 是标准动作**。

```bash
acme.sh --set-default-ca --server letsencrypt
```

我们推荐使用 ECC (椭圆曲线) 证书，它比传统的 RSA 证书更小、更快，更适合 DERP 这种高并发中转场景。

```bash
acme.sh --issue --dns dns_cf -d derp.xxx.xxx --ecc
```

- **工作原理**：`acme.sh` 会调用 CF API 自动生成一个随机的 TXT 记录，Let's Encrypt 验证通过后，证书会自动下载到 `~/.acme.sh/` 目录下。

---

## 4. 部署证书并挂载“自动重启钩子”

这是实现**无人值守**的关键。不要手动拷贝证书，使用 `--install-cert` 命令，它会记住路径，并在以后每次更新证书时自动执行拷贝和重启操作。

```bash
acme.sh --install-cert -d derp.xxx.xxx --ecc \
  --key-file       /opt/derp/certs/derp.xxx.xxx.key  \
  --fullchain-file /opt/derp/certs/derp.xxx.xxx.crt \
  --reloadcmd      "docker restart derper"
```

### **逻辑拆解：**

- **`--key-file` / `--fullchain-file`**：将证书分发到你在第三阶段为 Docker 准备的挂载目录中。
- **`--reloadcmd`**：这是**灵魂参数**。`acme.sh` 每 60 天会自动续期证书。一旦续期成功，它会立刻执行 `docker restart derper`，让容器重新加载那份有效期又是 90 天的新证书。

---

## 5. 验证全自动链路

配置完成后，你可以通过查看 `acme.sh` 的定时任务和日志来确认一切正常：

- **检查 Crontab**：输入 `crontab -l`，你应该能看到一行 `acme.sh --cron`，它每天凌晨会定时巡检证书。
- **检查 Hook**：

    ```bash
    cat ~/.acme.sh/derp.xxx.xxx_ecc/derp.xxx.xxx.conf | grep Le_ReloadCmd
    ```

    如果输出包含 `docker restart derper`，恭喜你，这台服务器已经进化为**自愈系统**。

---

## 6. 最终连通性大检查

现在，你的 DERP 已经有了合法的证书。在你的设备上执行最后的“大考”：

```bash
# 1. 验证 TLS 是否被认可（应该返回 200 OK，且没有证书报错）
curl -v https://derp.xxx.xxx:33445
```

**如果返回 `Successfully established a DERP connection`，则说明：**

- 域名解析对了。
- 防火墙端口通了。
- Docker 身份验证生效了。
- SSL 证书握手成功了。

---

**至此，你的私有 DERP 中转网络已经彻底竣工。你现在拥有了一个比官方节点延迟更低，且绝对私密的专属通道。**

---

# 第五阶段：Tailnet 集成与全局路由生效

## 1. 登录并修改 Tailscale 控制台

Tailscale 的所有路由逻辑都由一个中心化的控制面板管理。

1. 打开 [Tailscale Admin Console - Access Control](https://login.tailscale.com/admin/acls)。
2. 在编辑器中，找到 `derpMap` 结构（如果不存在，通常加在 `groups` 或 `hosts` 之后，但在最外层大括号内）。

## 2. 注入 `derpMap` 配置

将以下 JSON 代码块填入。这里的 `RegionID` 建议从 `901` 开始，以避免与官方 RegionID（1-30）冲突。

```json
	"derpMap": {
		"OmitDefaultRegions": false, // 设为 true 可测试强制走自建，生产环境建议 false
		"Regions": {
			"901": {
				"RegionID":   901,
				"RegionCode": "my-cloud", // 自建节点标识
				"RegionName": "My Cloud",
				"Nodes": [
					{
						"Name":             "1",
						"RegionID":         901,
						"HostName":         "derp.xxx.xxx",
						"DERPPort":         33445, // 对应你在第三阶段映射的端口
						"STUNPort":         3478,
						"InsecureForTests": false,
					},
				],
			},
		},
	},
```

---

## 3. 触发配置下发

点击 **Save**。一旦点击保存，Tailscale 的控制平面（Coordination Server）会在几秒钟内将这个新地图推送到你全球所有的设备上（macOS, Ubuntu, iOS, Android 等）。

---

## 4. 深度验证：从“感知”到“使用”

### **A. 探测感知（Netcheck）**

在你的 **macOS** 上执行，观察你的 DERP 是否出现在列表中：

```bash
tailscale netcheck
```

- **检查点**：在输出的 `DERP Latency` 列表中，你应该能看到 `my-cloud: 20-40ms`。这证明客户端已经收到了地图，并且通过 STUN 成功探测到了自建节点的延迟。

### **B. 协议握手（Debug）**

```bash
tailscale debug derp 901
```

- **预期结果**：返回 `Successfully established a DERP connection`。这说明你的客户端已经完成了 TLS 握手，并且 **DERP 服务器通过宿主机 .sock 文件验证了你的身份**。

### **C. 流量实战（Ping）**

针对你的远程设备进行测试：

```bash
tailscale ping <目标设备的 Tailscale IP>
```

- **核心观察**：输出应包含 `via DERP(my-cloud)` 且延迟相比官方节点大幅下降。

---

## 5. 常见故障排除 (Infra Checklist)

- **配置不生效？**：如果在 `netcheck` 中完全看不到 `901`，请检查 JSON 语法（逗号是否漏写）或 `RegionID` 是否重复。
- **延迟依然很高？**：确认 `derpMap` 里的 `HostName` 拼写是否与证书一致。如果不一致，TLS 校验失败后客户端会默默回退到官方节点。
- **P2P 依然不通？**：DERP 的作用是 " 保底 "。如果有了低延迟 DERP 后仍然觉得卡顿，请检查远程设备所在的内网是否完全封死了 UDP 流量（如果 UDP 3478 被封，STUN 探测不到，连接会变得非常脆弱）。

---

**总结**：第五阶段完成后，你的专属 DERP 中转网络正式闭环。你构建了一个 **" 按需触发、低延迟、防白嫖、自续期 "** 的企业级 VPN 中转方案。现在，你可以随时随地以 " 本地内网 " 的体验去调试远程设备了。

---

# 验证防白嫖（VERIFY_CLIENTS）是否生效

> [!tip] 适用范围
> 无论你使用的是域名方案还是纯 IP 方案，验证步骤都一样。

开启 `DERP_VERIFY_CLIENTS=true` 后，需要确认两件事：自己人能连、陌生人被拒。

## 1. 确认授权设备正常

在你的客户端（如 Mac）执行：

```bash
tailscale netcheck
```

在输出的 `DERP latency` 列表中应能看到你的自建节点及其延迟（如 `ali-bj: 14.7ms`）。有延迟数据说明客户端已经通过身份验证并成功与 DERP 通信。

## 2. 模拟陌生访客（curl 快速验证）

在服务器上用 curl 模拟一个没有 Tailscale 身份的客户端，尝试发起 DERP 协议升级：

```bash
curl -sk https://127.0.0.1:55443/derp \
  -H 'Upgrade: derp' \
  -H 'Connection: Upgrade' \
  -o /dev/null -w '%{http_code}\n'
```

返回 `101`（协议升级）是正常的——DERP 会先接受 TCP 连接，但在后续的密钥交换阶段因为拿不到合法的 node key 而超时断开。等待约 10 秒后查看日志：

```bash
docker logs --tail 5 derper
```

**预期输出**：

```
derp: 172.18.0.1:xxxxx: receive client key: read tcp ... i/o timeout
```

这说明陌生连接在密钥交换阶段被卡死并超时，无法完成握手，不会被中转任何流量。

## 3. 实打实看到 `rejected`（模拟白嫖）

curl 只能证明 " 没有密钥的连接会超时 "。如果你想亲眼看到 DERP 主动拒绝一个真实的 Tailscale 客户端，最直观的方式是**模拟一次白嫖**——用另一个 tailnet 的设备尝试蹭你的 DERP。

### 白嫖原理

如果你没有开启 `VERIFY_CLIENTS`，任何人只要知道你的 IP 和端口，在他自己的 Tailscale ACL 里加一条 `derpMap` 就能把你的服务器当成免费中转：

```json
"derpMap": {
    "Regions": {
        "901": {
            "RegionID": 901,
            "RegionCode": "free-ride",
            "RegionName": "Free Ride",
            "Nodes": [{
                "Name":     "1",
                "RegionID": 901,
                "HostName": "<你的服务器IP>",
                "IPv4":     "<你的服务器IP>",
                "DERPPort": 55443,
                "STUNPort": 53478,
                "InsecureForTests": true
            }]
        }
    }
}
```

`InsecureForTests: true` 会跳过证书校验，连指纹都不需要知道。保存后他 tailnet 里的所有设备就会开始白嫖你的带宽。

### 模拟步骤

1. 注册一个**第二个 Tailscale 账号**（免费即可）。
2. 在任意一台机器上用这个新账号 `tailscale up` 加入新 tailnet。
3. 在新 tailnet 的 [ACL 控制台](https://login.tailscale.com/admin/acls) 中添加上面的 `derpMap`，将 IP 改为你真实的服务器地址，保存。
4. 在该机器上执行：

```bash
# 等待 ACL 下发后，尝试连接你的 DERP
tailscale netcheck
```

5. 回到你的 DERP 服务器查看日志：

```bash
docker logs --tail 10 derper
```

### 预期结果

- **开启了 `VERIFY_CLIENTS=true`**：日志中出现：

```
rejected: peer nodekey:xxxxx not found in local tailscaled
```

DERP 通过 `tailscaled.sock` 查询了宿主机的 tailscaled，确认这个 node key 不属于你的 tailnet，直接拒绝。白嫖失败。

- **如果没开 `VERIFY_CLIENTS`**：对方的 `netcheck` 会正常显示你的 DERP 延迟，白嫖成功，你的带宽就是别人的了。

> [!info] 为什么 curl 是 " 超时 " 而真实客户端是 " 拒绝 "？
> curl 不会发送 DERP 协议的客户端密钥，连接卡在等待密钥阶段直到超时。而真正的 Tailscale 客户端会正常发送 node key，DERP 拿着这个 key 去问 tailscaled" 这人是咱家的吗？"，得到否定答案后主动断开并记录 `rejected`。

---

# 不备案纯 IP 方案

启发：[国内服务器确实不便搭建 tailscale derp - V2EX](https://www.v2ex.com/t/1084815#r_16526188)

参考：[自建 Tailscale Derper 中继服务 - YQ's Toy Box](https://blog.openyq.top/posts/22840/)

针对云服务器环境，这套**非备案、IP 直连、高位端口自签名**的 DERP 部署全流程总结如下：

## 1. 服务端（云服务器）部署

### 前置：安装宿主机 Tailscale

为了让 DERP 具备身份验证能力（防白嫖），宿主机必须先加入你的 Tailscale 网络：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --accept-dns=false
```

安装后确认 `/var/run/tailscale/tailscaled.sock` 存在。这个 Socket 文件会被挂载进 Docker 容器，DERP 通过它向宿主机的 tailscaled 守护进程查询 " 这个连接的客户端是不是咱们 tailnet 里的 "，是就放行，不是就拒绝。

> [!tip] 关于 `--accept-dns=false`
> 阿里云内网 DNS 和 Tailscale DNS 会冲突，加这个参数避免 `apt update` 等命令失联。详见 [[#为什么要加 `--accept-dns=false`？]]。

### 创建证书目录并启动容器

注意：将 STUN 和 TLS 端口全部移至 50000+ 高位以规避探测。

```bash
# 1. 创建证书存放目录 (用于持久化自动生成的自签名证书)
mkdir -p /opt/derp/certs

# 2. 启动容器 (映射高位端口)
# 宿主机 55443 -> 容器 33445 (DERP/TCP)
# 宿主机 53478 -> 容器 3478 (STUN/UDP)
docker run -d \
  --name derper \
  --restart always \
  # 资源限制
  --cpus 0.5 \
  --memory 256m \
  # 日志限制 (防止磁盘满)
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  # 端口映射
  -p 55443:33445 \
  -p 53478:3478/udp \
  # 挂载与环境配置
  -v /opt/derp/certs:/cert \
  -v /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock \
  -e DERP_DOMAIN=182.92.5.217 \
  -e DERP_CERT_MODE=manual \
  -e DERP_CERT_DIR=/cert \
  -e DERP_ADDR=:33445 \
  -e DERP_STUN_PORT=3478 \
  -e DERP_HTTP_PORT=-1 \
  -e DERP_VERIFY_CLIENTS=true \
  fredliang/derper

# 3. 获取证书指纹 (极其重要)
# 启动后查看日志，找到类似 sha256-raw:xxxxxxxx 的字符串并记录
docker logs derper 2>&1 | grep "sha256-raw"

# (可选) 检查生成的证书文件
ls /opt/derp/certs  # 你会看到自动生成的 <服务器IP>.crt 和 .key
```

也可以直接用 docker compose 的方式，`/opt/derp/docker-compose.yml` 配置如下：

```yaml
services:
  derper:
    container_name: derper
    image: fredliang/derper:latest
    restart: unless-stopped
    ports:
      - "55443:33445"
      - "53478:3478/udp"
    environment:
      DERP_DOMAIN: "182.92.5.217"
      DERP_CERT_MODE: "manual"
      DERP_CERT_DIR: "/cert"
      DERP_ADDR: ":33445"
      DERP_STUN: "true"
      DERP_STUN_PORT: "3478"
      DERP_HTTP_PORT: "-1"
      DERP_VERIFY_CLIENTS: "true"
    volumes:
      - "/etc/localtime:/etc/localtime:ro"
      - "/etc/timezone:/etc/timezone:ro"
      - "./certs:/cert"
      - "/var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock"
    # 资源限制：防止占满双核导致 SSH 卡死，在 Compose V2 (v5.1.3) 中是单机最稳妥写法
    cpus: '0.50'
    memory: 256M
    # 日志限制：防止撑爆 40GB 磁盘
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

验证资源限制生效：

> [!warning] 注意
> 在 **Ubuntu 24.04 (cgroup v2)** 环境下，传统的 `CpuQuota` 字段可能显示为 0，应以 `NanoCpus` 和 `Memory` 字段为准。

```bash
# 预期输出 NanoCpus 为 500000000 (代表 0.5 核)
docker inspect derper | grep -iE "NanoCpus|Memory"
```

## 2. 云安全组配置

在云控制台添加以下两条入方向规则：

|**协议**|**端口范围**|**授权对象**|**备注**|
|---|---|---|---|
|**TCP**|`55443`|`0.0.0.0/0`|DERP 数据传输|
|**UDP**|`53478`|`0.0.0.0/0`|STUN 路径发现|

---

## 3. Tailscale ACL 配置

在 Tailscale Admin Console 的 `derpMap` 中填入以下 JSON。这是客户端信任自签名证书的关键。

代码段

```
"derpMap": {
    "OmitDefaultRegions": false, // 建议保留官方节点作为兜底
    "Regions": {
        "901": {
            "RegionID":   901,
            "RegionCode": "my-cloud",
            "RegionName": "My Cloud",
            "Nodes": [
                {
                    "Name":             "node-01",
                    "RegionID":         901,
                    "HostName":         "<服务器IP>",
                    "IPv4":             "<服务器IP>",
                    "DERPPort":         55443,
                    "STUNPort":         53478,
                    "STUNOnly":         false,
                    "InsecureForTests": true, // 自签名证书必须为 true，跳过 CA 链校验，改用 CertName 指纹验证服务器身份。这是客户端侧的信任配置，与服务端的 VERIFY_CLIENTS（防白嫖）无关
                    "CertName":         "sha256-raw:你的最新指纹", // 填入第一步获取的指纹
                },
            ],
        },
    },
},
```

---

## 4. 客户端（Mac/远程节点）强制刷新

为了防止缓存旧的证书信息或端口映射，两端都需要执行重置。

```bash
# 在远程节点 (Linux) 执行
sudo tailscale down
sudo tailscale up --reset --accept-routes

# 在 Mac 执行 (或使用菜单重启)
tailscale down
tailscale up --reset
```

---

## 5. 连通性自检表

如果配置正确，你应该能通过以下验证：

1. **UDP 存活**：`nc -zuv <服务器IP> 53478` 必须返回 `succeeded`。
2. **证书响应**：浏览器访问 `https://<服务器IP>:55443` 必须能看到 "DERP" 字符。
3. **状态确认**：`tailscale status` 对应节点的 `rx` 字节数必须大于 0。
4. **最终测试**：`tailscale ping <目标设备的 Tailscale IP>` 显示 `via DERP(my-cloud)`。

# 参考资料

- [fredliang/derper - Docker Image](https://hub.docker.com/r/fredliang/derper)