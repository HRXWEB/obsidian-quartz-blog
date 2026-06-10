---
title: 《工程师 AIO 手册》系列 07：【保姆级】异地回家篇 —— 用 Ubuntu 24 LXC 实战 Tailscale、Subnet Router 与自建 DERP
draft: false
aliases: []
tags: []
created: 2026-06-08T17:10:00.000+08:00
updated: 2026-06-09T15:36:45.4545+08:00
---

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608174029426.png)

这一章，我们终于开始搭那条真正意义上的“异地回家生命线”了。

如果说前面的 `iKuai` 负责家里的基础网络，`iStoreOS` 负责魔法、去广告和策略增强，那么这一章的 `Ubuntu 24 LXC`，就是你整个家庭 AIO 的**远程运维跳板**。

它承担三件事：

1. **Tailscale 客户端**：让你在外面时先能连回家。
2. **Subnet Router**：把 `192.168.50.0/24` 整个家庭网段暴露给 tailnet。
3. **自建 DERP**：当两端没法直连时，给你自己的 tailnet 提供一个更近的中继点。

这一步做完之后，你的家庭 AIO 才真正从“在家里能用”变成“人在外面也能掌控”。

---

### 本章导读：1 分钟看懂最终落地方案

### 1. 本章最终地址规划

| 角色 | 形式 | IP 地址 | 作用 |
|---|---|---|---|
| PVE 宿主机 | 物理机 | `192.168.50.1` | 全部实例底座 |
| iKuai | VM | `192.168.50.2` | 主路由、拨号、DHCP、兜底 |
| iStoreOS | VM | `192.168.50.3` | OpenClash、AdGuardHome |
| NAS | VM | `192.168.50.4` | 家庭数据中心 |
| Ubuntu 24 LXC | LXC | `192.168.50.5` | Tailscale、Subnet Router、DERP、后续 Uptime Kuma |

### 2. 本章最终你会做完什么

1. 在 PVE 里创建一台 `Ubuntu 24 LXC`
2. 把它固定到 `192.168.50.5`
3. 让它接管 `Tailscale + Subnet Router`
4. 用 Docker 跑一个 `derper` 容器
5. 用脚本自动检测你家的**动态公网 IP**
6. 当公网 IP 变化时，自动重写 DERP 配置并重启容器

### 3. 本章的核心原则

- **回家入口独立**：不把远程入口绑在 `iStoreOS` 上
- **先保基础网络**：主路由还是 `iKuai`
- **能直连优先直连**：`DERP` 只在直连失败时兜底

---

## 一、为什么异地回家不要直接塞进 iStoreOS

很多人第一次折腾异地回家，思路往往很直接：

- 旁路由已经在跑 OpenClash 了
- 那就顺手把 Tailscale 也装上去
- 再顺手把 DERP、监控、DDNS 一股脑都堆进去

这种做法短期看省事，长期非常难维护。

原因很简单：`iStoreOS` 本来就已经承担了太多“高频折腾区”的职责：

- `OpenClash`
- `AdGuardHome`
- 特殊设备 DNS / 网关策略
- 应用商店插件

如果你再把“异地回家的入口”也绑在它身上，就会出现一种最糟糕的情况：

> 旁路由一挂，你从外面连回家排障的入口也一起挂了。

所以更像工程师方案的做法，是把“基础网络增强”和“远程运维入口”解耦开：

```text
PVE（192.168.50.1）
├── iKuai VM（192.168.50.2）
├── iStoreOS VM（192.168.50.3）
├── NAS VM（192.168.50.4）
└── Ubuntu 24 LXC（192.168.50.5）
    ├── tailscaled
    ├── Subnet Router
    ├── derper
    └── 后续第 08 篇：Uptime Kuma
```

```mermaid
graph TD
    PVE["PVE 宿主机<br/>192.168.50.1"]
    IK["iKuai VM<br/>192.168.50.2"]
    OS["iStoreOS VM<br/>192.168.50.3"]
    NAS["NAS VM<br/>192.168.50.4"]
    LXC["Ubuntu 24 LXC<br/>192.168.50.5"]
    TS["Tailscale"]
    SR["Subnet Router<br/>192.168.50.0/24"]
    DERP["DERP / STUN"]
    MON["Uptime Kuma（下一篇）"]
    PVE --> IK
    PVE --> OS
    PVE --> NAS
    PVE --> LXC
    LXC --> TS
    LXC --> SR
    LXC --> DERP
    LXC --> MON
```

这样设计的最大好处是：

- `iKuai` 决定家里还能不能上网
- `iStoreOS` 决定特殊设备的体验增强
- `192.168.50.5` 决定你在外面还能不能运维整套系统

这三者互相独立，不会“一损俱损”。

---

## 二、为什么把 `Ubuntu 24 LXC` 固定成 `192.168.50.5`

这一章继续沿用前面系列的基础设施地址规划：

- `.1`：PVE
- `.2`：iKuai
- `.3`：iStoreOS
- `.4`：NAS
- `.5`：远程运维与中继节点

把 `Ubuntu 24 LXC` 固定为 `192.168.50.5`，有三个非常现实的好处：

### 1. 后面所有文档都能围绕这个地址展开

比如：

- 第 08 篇监控里直接盯 `192.168.50.5`
- 第 09 篇备份里直接恢复 `192.168.50.5`

### 2. 一眼能看懂它的优先级

`.1 - .5` 全是核心基础设施，你以后回看时根本不用猜。

### 3. 便于换机恢复

宿主机换了也没关系，只要你把：

- `192.168.50.2`
- `192.168.50.3`
- `192.168.50.5`

这几个关键地址先恢复出来，整个家庭网络的“基本盘”就能重新站稳。

---

## 三、一个关键前提：有动态公网 IP，不代表你一定需要 DERP 中继

先把一个容易误解的问题说透。

如果你家里本身就有动态公网 IP，那么：

- **很多时候，Tailscale 是可以直连的**
- `DERP` 不是默认必经路径
- 它只是**直连失败时的中继兜底**

也就是说，真正的流量优先级是：

1. **能 P2P 直连就优先直连**
2. **直连失败才回退到 DERP**

所以你自建 DERP 的意义不是“强行让所有流量都走中继”，而是：

- 当两端打洞失败时
- 不要再去走更远的公共 DERP
- 而是走你自己更近、更可控的中继点

这个定位非常重要。

---

## 四、先把基础地基打好：创建 Ubuntu 24 LXC

先别急着上 Docker 和 DERP，第一步是把 `192.168.50.5` 这台容器搭稳。

#### 1. 在 PVE 中下载官方 ubuntu24.04 模板

依次点击 pve -> local -> CT Templates -> Templates -> search 框输入 ubuntu -> 选择 ubuntu24.04

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608205443625.png)

任务完成

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608205536418.png)

### 2. 在 PVE 中创建 LXC

进入 PVE 后台，点击右上角 **“创建 CT”**。

建议参数如下：

- **CT ID**：`105`（可以调整，但建议保持和 IP 有记忆关联）
- **主机名**：`home-tailnet`
- **Unprivileged container（无特权容器）**：取消勾选，纯 IP 部署 DERP 或者未来你可能涉及到的网络调优，需要容器拥有操作底层网络设备（如 TUN/TAP 网卡、执行 `iptables`）的权限。非特权容器限制极死，后续会让 Docker 卷挂载和网络打洞产生各种权限死锁
- ⚠️ **Nesting**：取消勾选 **Unprivileged container** 之后，这个选项就会无法勾选，一会在创建好 CT 之后，开机之前来解决这个问题。因为要在这个 LXC 容器内部运行 Docker。Docker 本身也是一种容器技术，在 Linux 里这叫“容器嵌套（Docker in LXC）”。如果不勾它，你在里面执行 `docker compose up` 时会直接报错卡死。
- **密码**：设置一个你记得住但不太弱的密码，最短 5 位，这是 root 用户登录的密码
- **确认密码**：再次输入相同的密码
- **「可选」SSH 公钥**：上传你自己电脑的 ssh 公钥，方便之后免密登陆。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608204508238.png)

模板：

选择 local 并选择下载好的 ubuntu24

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608205718244.png)

### 3. 磁盘建议

建议给：

- **磁盘**：`8GB - 16GB`

因为这一章它主要跑：

- Tailscale
- Docker
- derper

不需要给太夸张的容量。

### 4. CPU 和内存建议

建议起步：

- **CPU**：`2 核`
- **内存**：`4096MB`

如果你希望更克制一点，`2048MB` 其实也能跑得起来；但考虑到这一台后面还会承载：

- `Tailscale`
- `Subnet Router`
- `derper`
- 第 08 篇里的 `Uptime Kuma`

所以我更推荐你一步到位给 `4096MB`，这样后面继续加监控和脚本时会更从容。

### 5. 网络建议

关键参数如下：

- **Bridge**：`vmbr0`
- **Firewall**：取消勾选
- **IPv4**：选择 static 并配置为 `192.168.50.5/24`
- **Gateway**：设置为 `192.168.50.2`
- **IPv6**：选择 DHCP，后面也可以随时改

这里的默认网关一定要指向 `iKuai`，也就是 `192.168.50.2`，不要指向 `iStoreOS`。

> [!tip] 为什么这里必须选 `192.168.50.2`？
> `home-tailnet` 这台 LXC 后面会同时承担：
> - `Tailscale` 节点
> - `Subnet Router`
> - 自建 `DERP`
>
> 它本质上属于家庭网络的基础设施节点，而不是普通“需要翻墙的终端设备”。  
> 如果把默认网关指向 `iStoreOS`，它的 `Tailscale` 控制面、`DERP`、`STUN`、子网路由探测都会先经过旁路由和 `OpenClash`，这会把网络路径变复杂，也会让后面的 DERP 行为更难判断。  
> 把默认网关固定在 `iKuai`，可以保证：
> - 基础设施节点直连主路由
> - 旁路由异常时，不影响 `home-tailnet` 的基本可用性
> - 后续排查 `Tailscale / DERP / NAT` 时，路径更干净

![206](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608210130976.png)

图中写成了 `192.168.50.3`，这里请改为 `192.168.50.2`。

**DNS**：

DNS Servers 配置成 istore 的 IP 即可

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608210814715.png)

确认：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608211140952.png)

任务会报一个警告⚠️，这是刚才说的 nesting 带来的

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608211741522.png)

现在我们来解决一下这个问题

依次：点击 home-tailnet -> Options -> 双击 Features -> 勾选 Nesting -> OK

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608211846678.png)

### 6. 自启动顺序

建议在容器建好之后，进入：

- `选项 -> 开机自启动`
- `启动/关机顺序`

建议给它一个比 `iStoreOS` 靠后、但比普通业务容器更靠前的顺序。

例如：

- `iKuai`：1
- `iStoreOS`：2
- `Ubuntu 24 LXC`：3

这样整个基础设施会更符合依赖关系。

### 7. 🚨 给 LXC 放通 TUN 设备

Tailscale 在 Linux 上工作的基础，是通过 `TUN` 设备创建一张虚拟网卡。  
这张虚拟网卡不是“拦截所有流量”，而是让系统里需要进入 Tailscale 的流量，交给 `tailscaled` 去处理。

在 Linux 里，很多设备都会通过 `/dev` 暴露成设备节点。  
`TUN` 这种虚拟网络设备，用户态程序就是通过下面这个设备节点和内核交互的：

```text
/dev/net/tun
```

如果这台 `PVE LXC` 容器拿不到 `/dev/net/tun`，`tailscaled` 往往就无法正常启动。  
常见现象是：

- `systemctl status tailscaled` 一直卡在 `activating`
- `tailscale up` 报 `tailscaled.sock` 不存在
- 日志里出现 `no such file or directory`、`operation not permitted`、`creating TUN device failed` 之类的错误

在 `PVE` 里，可以直接给这个 LXC 添加设备直通。

点击 105 -> Resources -> Add -> Device PassThrough

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608215808313.png)

输入 `/dev/net/tun`，点击 Add

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608215828776.png)

加完之后，建议直接重启这个 LXC 容器，再执行下面三条命令确认：

```bash
ls -l /dev/net/tun
systemctl restart tailscaled
systemctl status tailscaled
```

预期结果是：

- `/dev/net/tun` 可以正常看到
- `tailscaled` 最终进入 `active (running)`
- 后续再执行 `tailscale up --accept-dns=false` 时，不会报 `tailscaled.sock` 不存在

---

## 五、初始化 Ubuntu 24 LXC

点击 start 启动容器

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608212128737.png)

点击 console 进入 terminal 控制

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608212231878.png)

容器启动后，先别急着安装 Tailscale，先把 Linux 自己收拾干净。

进入控制台或 SSH：

### 1. 先备份系统软件源

先把系统默认的软件源文件备份一下，后面真有问题还能随时回退：

```bash
cp /etc/apt/sources.list /etc/apt/sources.list.bak
```

### 2. 切到清华源

Ubuntu 24.04 推荐先直接换到清华源，再做 `apt update`，这样后面的系统更新、Docker 安装都会顺很多。

```bash
cat > /etc/apt/sources.list <<'EOF'
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-security main restricted universe multiverse
EOF
```

如果你后面发现源配置有问题，可以随时回滚：

```bash
cp /etc/apt/sources.list.bak /etc/apt/sources.list
```

### 3. 再更新系统并安装基础工具

```bash
apt update
apt upgrade -y
apt install -y curl wget ca-certificates gnupg lsb-release vim cron jq
```

推荐先验证这三件事：

### 1. IP 是否正确

```bash
ip addr
```

预期：

- 容器持有 `192.168.50.5/24`

### 2. 默认网关是否正确

```bash
ip route
```

预期：

- 默认网关是 `192.168.50.2`

### 3. 外网是否可通

```bash
ping -c 3 1.1.1.1
ping -c 3 www.qq.com
```

如果这一步不通，不要继续往后折腾 `Tailscale` 和 `DERP`。  
先回头检查：

- `iKuai`
- 容器网关
- `vmbr0`

当然因为出海软件 fake-ip 的关系，可能在 ping 域名的时候给你一个 `192.18.x.x` 的 ip，然后丢包，但是这不代表网络不通，可以用 curl 命令测试 `curl www.baidu.com`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608213157788.png)

---

## 六、安装 Tailscale 并跑通 Subnet Router

基础联网通过后，再开始处理 Tailscale。

### 1. 安装 Tailscale

官方推荐安装方式如下：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

> **工程师提醒：**  
> `Tailscale` 的安装脚本会自动给系统添加它自己的软件源，所以这里不需要你手动把它也改成清华源。  
> 真正影响最大的，还是前面 Ubuntu 自己的基础软件源要先切好。

安装完成后，先确认服务状态：

```bash
systemctl status tailscaled
```

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608215952221.png)

确保没有出现

```text
home-tailnet tailscaled[8093]: dns: inotify: NewDirWatcher: context canceled
```

类似字眼

### 2. 登录 tailnet

先用最基础的方式登录：

```bash
tailscale up --accept-dns=false
```

终端会给你一个 URL，用浏览器完成授权。

这里专门把 `--accept-dns=false` 带上，是因为这台 `192.168.50.5` 的角色不是普通客户端，而是：

- 远程运维跳板
- Subnet Router
- DERP 节点

它本机最好继续使用你自己明确指定的系统 DNS，不要再让 tailnet 的 DNS 策略自动改写它的解析路径。  
这样后面排查：

- `Tailscale`
- `DERP`
- `AdGuardHome / OpenClash`

之间的 DNS 行为时，会清楚很多。

### 3. 开启 Subnet Router

登录完成后，再用下面这条命令把家庭网段宣告出去：

```bash
tailscale up --accept-dns=false --advertise-routes=192.168.50.0/24 --accept-routes=true
```

这里的含义是：

- `--advertise-routes=192.168.50.0/24`
  - 告诉 tailnet：这台设备后面挂着整个家庭内网
- `--accept-routes=true`
  - 接受其它节点发布给它的路由（保留更灵活）

### 4. 在管理后台批准路由

这一条很多人会漏掉。

命令行发起宣告之后，还需要在 [Tailscale 管理后台](https://login.tailscale.com/admin/machines) 里：

- 找到这台 `home-tailnet`
- 批准它发布的 `192.168.50.0/24`

否则外部节点虽然能看到它，但不会真的走这条路。

### 5. 开启 Linux IP forwarding

`home-tailnet` 既然要承担 `Subnet Router` 的角色，就不能只在 Tailscale 里宣告路由，还必须让 Linux 内核真的允许转发数据包。

如果没有开启 IP forwarding，`tailscale status` 往往会出现类似提示：

```text
Subnet routing is enabled, but IP forwarding is disabled.
```

先临时开启：

```bash
sysctl -w net.ipv4.ip_forward=1
sysctl -w net.ipv6.conf.all.forwarding=1
```

再把它写入持久化配置：

```bash
cat > /etc/sysctl.d/99-tailscale.conf <<'EOF'
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
EOF
sysctl --system
```

然后再次检查：

```bash
sysctl net.ipv4.ip_forward
sysctl net.ipv6.conf.all.forwarding
tailscale status
```

预期结果：

- `net.ipv4.ip_forward = 1`
- `net.ipv6.conf.all.forwarding = 1`
- `tailscale status` 不再提示 `IP forwarding is disabled`

### 6. 验证 Subnet Router 是否生效

在你的外部设备上执行：

```bash
ping 192.168.50.2
ping 192.168.50.3
ping 192.168.50.4
```

或者直接浏览器打开：

- `http://192.168.50.2`
- `http://192.168.50.3`

只要能通，你的“异地回家基础版”就已经完成了。

---

> [!Error] 关于自建 derp 的建议
> 虽然有了公网 IP 可以用纯 IP 的方案自建 derp，但是这个 IP 其实是主路由通过端口映射让外部进来的网络请求可以路由到 derp 这台机器上（192.168.50.5），和买云服务器自带一个公网 IP 不一样，所以有条件的话还是用云服务器 + 纯 IP 方案自建 derp。
> 
> 如果执意要建的话，可能会碰到如下的问题，我没找到好的解决办法：
> - NAT 回流/ NAT hairpin：内部的 PC 或者其他设备去访问 derp 节点时，PC -> ikuai -> derp，然后发现 derp 是一个内网设备，derp 直接发包给 PC，PC 此时会发现这个数据包的来源和当时的目标 IP 不一致，会直接丢弃。「补充：虽然当时猜测有这个问题，但是在没配置的情况下也顺利跑通了」
> - 网关：
> 	- 如果 derp 设备的网关设置为 ikuai(`192.168.50.2`) ：`taiscale status` 和 `tailscale netcheck` 都没办法获取正确的信息，登陆状态都有问题，因此这台设备就被认定为不在 tailnet 里面。所以 derp 拿到的 tailscale.sock 也就没法用，猜测是墙的问题。
> 	- 如果 derp 设备的网关设置为 istore(192.168.50.3)：可以登录，但是 ssh 其他家里 tailnet 的设备不通。tailscale ping 倒是能 ping 通。而且外部设备 `taiscale netcheck` 的时候家里的这个 derp node 不会返回延时，其实就是“断了”。

---

## 七、自建 DERP 这件事，先把纯 IP 方案的核心逻辑说透

很多读者走到这里时，都会做同一个选择：

> 不走域名方案，而是直接用公网 IP 部署 DERP，并用脚本定时检测公网 IP 变化。

这条路是可以走通的，而且对于“家宽动态公网 IP + 不想碰域名备案”的场景来说，确实很实用。  
但它和“域名 + ACME 自动续签”的经典方案有一个本质差别：

- 域名方案依赖公开 CA 签发证书
- 纯 IP 方案通常依赖**自签名证书 + 指纹信任**

这意味着你在纯 IP 方案里，要同时处理四件事：

1. `derper` 监听高位端口
2. 容器里自动生成并持久化自签名证书
3. 客户端通过 `derpMap` 信任这个证书的指纹
4. 公网 IP 变化时，重启容器并重新确认最新指纹

也就是说，纯 IP 方案真正难的不是“把容器跑起来”，而是：

- **IP 变了**
- **证书跟着变了**
- **`derpMap` 里的 IP 和证书指纹也得跟着变**

这就是为什么那篇 [[self-hosted-tailscale-derp]] 里，会专门把：

- TLS 证书
- 指纹提取
- `reloadcmd` / 重启钩子
- 路径映射
- `ACL` / `derpMap`

这些细节全都单独拎出来讲。

这一章我们就按那条已经验证过的思路，落成家庭 AIO 可维护版本。

---

## 八、先装 Docker，再部署 derper

为了让 `DERP` 进程尽量独立，推荐把它放进 Docker，而不是和 `tailscaled` 混成一个系统服务。

### 1. 安装 Docker

在 `192.168.50.5` 上执行：

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable" \
  > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker version
docker compose version
```

这里用的是 **Docker 官方 apt 仓库**，不是 Ubuntu 自带的软件仓库。  
这样做的原因很简单：

- `docker-compose-plugin` 在不同发行版/不同源里的可用性并不一致
- 直接走官方仓库，读者照抄时更稳
- 后面用 `docker compose` 也不会出现“命令有了但插件版本太旧”这种问题

如果你特别强调“系统一切尽量只用 Ubuntu 官方仓库”，当然也可以退回 `docker.io` 路线；  
但这一章既然已经是面向长期维护的实战文，我更推荐直接用官方仓库。

如果你后面发现：

- `docker pull` 很慢
- `docker compose up` 拉镜像经常超时

那问题通常不是 `apt`，而是 Docker Hub 访问本身慢。

这一章先不强行绑定某个镜像加速方案，原因是各家环境差异比较大。  
更稳的做法是：

- 先把系统 `apt` 源切好
- 先直接试一次拉镜像
- 如果你这边确实很慢，再按你自己常用的镜像加速方式单独处理 Docker

也就是说：

- **`apt` 换清华源是固定动作**
- **Docker 镜像加速是按需动作**

### 2. 创建工作目录

```bash
mkdir -p /opt/derper
cd /opt/derper
```

### 3. 先准备配置目录

```bash
mkdir -p /opt/derper/certs
mkdir -p /opt/derper/config
mkdir -p /opt/derper/data
mkdir -p /opt/derper/scripts
```

---

## 九、用 IP 方式部署 DERP：目录、Compose、证书与 Socket 映射

这一节我们不玩花活，直接做一个你以后容易维护的目录结构。

```text
/opt/derper
├── compose.yaml
├── .env
├── certs/
├── config/
├── data/
└── scripts/
    └── update-public-ip.sh
```

### 1. 这次为什么还要挂载 `tailscaled.sock`

很多人第一次看这套方案时，会觉得奇怪：

> DERP 不是一个 Docker 容器吗，为什么还要挂宿主机的 `tailscaled.sock`？

原因是这里搭的不是一个“谁都能白嫖的公开 DERP”，而是一个**只服务你自己 tailnet 的 DERP**。

所以我们希望它具备这层能力：

- 来连接的客户端，必须先是你 tailnet 里的合法成员
- 不是你自己的 tailnet 设备，就不要让它中继

这件事的实现方式，就是：

- 宿主机先加入 Tailscale
- 把 `/var/run/tailscale/tailscaled.sock` 挂进容器
- 容器通过这个 Socket 向宿主机的 `tailscaled` 询问客户端身份

因此，后面你会看到两个层面的“信任”：

1. **服务端验证客户端身份**
   - `DERP_VERIFY_CLIENTS=true`
   - 防止无关客户端白嫖你的中继

2. **客户端信任服务端证书**
   - 在 `ACL derpMap` 里填 `CertName` 指纹
   - 让客户端知道它连接的是你这台 DERP，而不是别人冒充的

这两者不是一回事，但纯 IP 方案里都很关键。

### 2. `.env` 文件

先创建一个环境变量文件：

```bash
cat > /opt/derper/.env <<'EOF'
DERP_DOMAIN=0.0.0.0
DERP_CERT_MODE=manual
DERP_CERT_DIR=/cert
DERP_ADDR=:33445
DERP_STUN_PORT=3478
DERP_HTTP_PORT=-1
DERP_VERIFY_CLIENTS=true
EOF
```

这里的几个变量含义：

- `DERP_DOMAIN`
  - 当前公网 IP，占位，后面脚本会改它
- `DERP_CERT_MODE=manual`
  - 让镜像用手动证书模式，在挂载目录里生成并持久化证书
- `DERP_CERT_DIR=/cert`
  - 容器内证书目录
- `DERP_ADDR=:33445`
  - 容器内 DERP 监听端口
- `DERP_STUN_PORT=3478`
  - 容器内 STUN 监听端口
- `DERP_HTTP_PORT=-1`
  - 不额外开放明文 HTTP 页面
- `DERP_VERIFY_CLIENTS=true`
  - 要求连接方必须是你自己的 tailnet 成员

### 3. `compose.yaml`

```bash
cat > /opt/derper/compose.yaml <<'EOF'
services:
  derper:
    image: fredliang/derper:latest
    container_name: derper
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "55443:33445"
      - "53478:3478/udp"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      - ./certs:/cert
      - /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock
    cpus: 0.5
    mem_limit: 256m
    security_opt:
      - apparmor=unconfined
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
EOF
```

> **工程师提醒：**  
> 这一版不再用 `network_mode: host`，而是显式做端口映射：  
> `55443/tcp -> 33445/tcp`、`53478/udp -> 3478/udp`。  
> 这样你后面看配置、迁移、排障都会更直观，也更接近那篇纯 IP 方案的实战写法。
>
> 这里的内存限制不要写成 `memory: 256M`。在不少 `docker compose` 版本里，这个字段会直接校验失败。  
> 对这台 Ubuntu 24 LXC 来说，写成 `mem_limit: 256m` 更稳，至少和本章实测环境兼容。
>
> 如果你是在 `PVE LXC` 里跑 Docker，还很可能遇到 AppArmor 报错。  
> 常见现象是容器启动时提示 `docker-default profile could not be loaded`。  
> 这时给服务显式加上 `security_opt: [apparmor=unconfined]`，通常就能绕过这个限制。

### 4. 第一次启动

```bash
cd /opt/derper
docker compose up -d
docker compose ps
docker logs derper --tail=50
docker logs derper 2>&1 | grep "sha256-raw"
ls /opt/derper/certs
```

这时候就算容器能跑起来，也别急着高兴，因为：

- 你的公网 IP 还是占位值
- 证书指纹还没最终确认
- `derpMap` 也还没填

如果这一步你发现：

- `docker compose up -d` 已经成功
- `/opt/derper/certs` 里已经出现了证书文件
- 但 `docker logs derper 2>&1 | grep "sha256-raw"` 没输出

也不用急着回滚。  
这通常说明当前镜像没有把 `sha256-raw` 直接打印到日志里，或者日志格式与你参考的示例不同。  
后面的脚本会优先从日志提取指纹，提取不到时再直接从证书文件本身计算。

还有一个需要提前说明的行为：

- 如果 `public_ip.txt` 已经存在
- 且里面记录的 IP 和当前公网 IP 一样

那脚本很可能会直接判断“IP 没变”，然后提前退出。  
这意味着第一次调试时，如果你之前已经留下了 `public_ip.txt`，但还没生成：

- `cert_fingerprint.txt`
- `derpmap-node.json`
- `ts-acl.pretty.json`

这些文件也不会被补出来。

因此，下面这版脚本会把“IP 没变但衍生文件缺失”也视为需要继续执行的场景，而不是直接退出。

下一步我们先把“动态公网 IP 检测 + 容器重启 + 指纹提取”这条链路跑顺。

---

## 十、核心玩法：动态公网 IP 变化时自动重写、重启并自动更新 ACL

这一节是整章最“工程化”的地方。

思路非常直接：

1. 周期性获取当前公网 IP
2. 读取上次保存的 IP
3. 如果 IP 没变，什么都不做
4. 如果变了：
   - 改写 `.env` 里的 `DERP_DOMAIN`
   - 重启 `derper`
   - 提取新的证书指纹
   - 拉取当前 tailnet policy file
   - 自动更新 `derpMap`
   - 调用 `validate` 预检
   - 再通过 API 写回 Tailscale
   - 记录日志

### 1. 先准备 Tailscale API 凭据

既然这一版我们决定让脚本自动更新 tailnet policy file，那么还需要给它最小够用的 API 权限。

先在 `Tailscale Admin Console -> Keys` 里创建一个访问令牌。  
如果使用的是更细粒度的 Trust Credentials，那至少要给它 `policy_file` 相关权限。  
官方当前文档里，`policy_file` 作用域包含这些关键端点：

- `GET /api/v2/tailnet/:tailnet/acl`
- `POST /api/v2/tailnet/:tailnet/acl`
- `POST /api/v2/tailnet/:tailnet/acl/validate`
- `POST /api/v2/tailnet/:tailnet/acl/preview`

再在本机写一个单独的凭据文件：

```bash
cat > /opt/derper/config/tailscale-api.env <<'EOF'
TS_TAILNET=example.com
TS_API_KEY=tskey-api-xxxxxxxxxxxxxxxx
TS_REGION_ID=901
TS_REGION_CODE=home-ip
TS_REGION_NAME="Home IP DERP"
TS_NODE_NAME=home-derp-01
EOF
chmod 600 /opt/derper/config/tailscale-api.env
```

字段含义如下：

- `TS_TAILNET`
  - 你的 tailnet 标识，通常是域名或邮箱形式
- `TS_API_KEY`
  - 用来读写 tailnet policy file 的 API 令牌
- `TS_REGION_ID`
  - 你给这个自建 DERP 预留的区域编号
- `TS_REGION_CODE`
  - 连接状态里显示的区域代码，例如 `home-ip`
- `TS_REGION_NAME`
  - 后台和日志里更容易认的区域名称
- `TS_NODE_NAME`
  - 这个 DERP 节点的名字

### 2. 自动改 ACL 之前，一定先备份当前 policy file

这一点我建议在文章里写得很重，因为它是“自动化省事”和“误操作翻车”之间的分界线。

`Tailscale` 的 policy file 支持 `HuJSON`，也就是：

- 可以带注释
- 可以有更人类友好的排版

但为了让脚本稳定地改 `derpMap`，这套自动化会先拉取**解析后的 JSON**，再用 `jq` 修改后回写。  
这样做的副作用是：

- 原来的注释会丢失
- 原来的 HuJSON 风格会被拍平成普通 JSON

所以第一次开启自动化之前，先把当前 policy file 备份出来：

```bash
mkdir -p /opt/derper/backup
curl -fsS \
  -H "Accept: application/hujson" \
  -u "${TS_API_KEY}:" \
  "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl" \
  -o "/opt/derper/backup/tailscale-acl.$(date +%F-%H%M%S).hujson"
```

如果你本来就很重视 ACL 注释和人工维护体验，那我更推荐你：

- 把这份备份也同步到 Git
- 后面把自动化脚本生成的 JSON 当作“运行态版本”
- 把有注释的原始版本当作“文档态版本”

### 3. 编写脚本

创建脚本 `/opt/derper/scripts/update-public-ip.sh`：

```bash
cat > /opt/derper/scripts/update-public-ip.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

WORKDIR="/opt/derper"
ENV_FILE="${WORKDIR}/.env"
STATE_FILE="${WORKDIR}/data/public_ip.txt"
FINGERPRINT_FILE="${WORKDIR}/data/cert_fingerprint.txt"
DERPMAP_NODE_FILE="${WORKDIR}/data/derpmap-node.json"
ACL_HEADERS_FILE="${WORKDIR}/data/ts-acl.headers"
ACL_CURRENT_JSON="${WORKDIR}/data/ts-acl.current.json"
ACL_UPDATED_JSON="${WORKDIR}/data/ts-acl.updated.json"
ACL_PRETTY_JSON="${WORKDIR}/data/ts-acl.pretty.json"
LOG_FILE="${WORKDIR}/data/update-public-ip.log"

TS_API_ENV="${WORKDIR}/config/tailscale-api.env"

if [[ -f "${TS_API_ENV}" ]]; then
  # shellcheck disable=SC1090
  source "${TS_API_ENV}"
fi

: "${TS_TAILNET:?missing TS_TAILNET in /opt/derper/config/tailscale-api.env}"
: "${TS_API_KEY:?missing TS_API_KEY in /opt/derper/config/tailscale-api.env}"

TS_REGION_ID="${TS_REGION_ID:-901}"
TS_REGION_CODE="${TS_REGION_CODE:-home-ip}"
TS_REGION_NAME="${TS_REGION_NAME:-Home IP DERP}"
TS_NODE_NAME="${TS_NODE_NAME:-home-derp-01}"

get_public_ip() {
    # 严格筛选的国内高可用、大厂 IP 接口
    local services=(
        "https://cip.cc"                      # 1. 你的首选
        "https://vv.video.qq.com/checktime"   # 2. 腾讯视频（大厂，极速，返回带 IP 文本）
        "https://myip.ipip.net"               # 3. IPIP.net（专业网络测绘）
        "https://ddns.oray.com/checkip"       # 4. 花生壳 DDNS 官方接口（老牌稳定）
    )

    local ip=""
    
    for url in "${services[@]}"; do
        # 统一使用 grep 提取 IPv4 地址，完美兼容所有返回格式（无论是纯文本、多行还是 JSON）
        ip=$(curl -fsS4 --connect-timeout 3 "$url" 2>/dev/null | grep -E -o '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -n1)

        # 验证提取到的是否为合法 IP
        if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
            echo "$ip"
            return 0
        fi
    done

    echo "Error: 所有国内备份接口尝试失败" >&2
    return 1
}

get_cert_fingerprint_from_file() {
    local cert_file=""

    if [[ -f "${WORKDIR}/certs/${CURRENT_IP}.crt" ]]; then
        cert_file="${WORKDIR}/certs/${CURRENT_IP}.crt"
    else
        cert_file="$(find "${WORKDIR}/certs" -maxdepth 1 -type f -name '*.crt' | head -n 1 || true)"
    fi

    if [[ -z "${cert_file}" ]]; then
        return 1
    fi

    printf 'sha256-raw:%s\n' "$(
        openssl x509 -in "${cert_file}" -outform der | sha256sum | awk '{print $1}'
    )"
}

CURRENT_IP="$(get_public_ip | tr -d '\n\r ')"

if [[ -z "${CURRENT_IP}" ]]; then
  echo "$(date '+%F %T') [ERROR] failed to get public ip" >> "${LOG_FILE}"
  exit 1
fi

PREV_IP=""
if [[ -f "${STATE_FILE}" ]]; then
  PREV_IP="$(cat "${STATE_FILE}")"
fi

NEED_REFRESH=0

if [[ "${CURRENT_IP}" != "${PREV_IP}" ]]; then
  NEED_REFRESH=1
fi

if [[ ! -f "${FINGERPRINT_FILE}" || ! -f "${DERPMAP_NODE_FILE}" || ! -f "${ACL_PRETTY_JSON}" ]]; then
  NEED_REFRESH=1
fi

if [[ "${NEED_REFRESH}" -eq 0 ]]; then
  echo "$(date '+%F %T') [INFO] public ip unchanged: ${CURRENT_IP}" >> "${LOG_FILE}"
  exit 0
fi

sed -i "s/^DERP_DOMAIN=.*/DERP_DOMAIN=${CURRENT_IP}/" "${ENV_FILE}"
echo "${CURRENT_IP}" > "${STATE_FILE}"

cd "${WORKDIR}"
docker compose up -d --force-recreate derper

sleep 3

FINGERPRINT="$(docker logs derper 2>&1 | grep -o 'sha256-raw:[0-9a-f]\{64\}' | tail -n 1 || true)"

if [[ -z "${FINGERPRINT}" ]]; then
  FINGERPRINT="$(get_cert_fingerprint_from_file || true)"
fi

if [[ -z "${FINGERPRINT}" ]]; then
  echo "$(date '+%F %T') [ERROR] fingerprint missing after derper restart" >> "${LOG_FILE}"
  exit 1
fi

echo "${FINGERPRINT}" > "${FINGERPRINT_FILE}"
cat > "${DERPMAP_NODE_FILE}" <<JSON
{
  "Name": "${TS_NODE_NAME}",
  "RegionID": ${TS_REGION_ID},
  "HostName": "${CURRENT_IP}",
  "IPv4": "${CURRENT_IP}",
  "DERPPort": 55443,
  "STUNPort": 53478,
  "STUNOnly": false,
  "InsecureForTests": true,
  "CertName": "${FINGERPRINT}"
}
JSON

curl -fsS -D "${ACL_HEADERS_FILE}" \
  -H "Accept: application/json" \
  -u "${TS_API_KEY}:" \
  "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl" \
  -o "${ACL_CURRENT_JSON}"

ETAG="$(awk -F': ' 'tolower($1)=="etag" {gsub(/\r/, "", $2); print $2}' "${ACL_HEADERS_FILE}" | tail -n 1)"

if [[ -z "${ETAG}" ]]; then
  echo "$(date '+%F %T') [ERROR] missing ETag from Tailscale ACL API" >> "${LOG_FILE}"
  exit 1
fi

jq \
  --argjson region_id "${TS_REGION_ID}" \
  --arg region_code "${TS_REGION_CODE}" \
  --arg region_name "${TS_REGION_NAME}" \
  --arg node_name "${TS_NODE_NAME}" \
  --arg current_ip "${CURRENT_IP}" \
  --arg fingerprint "${FINGERPRINT}" \
  '
  .derpMap = (.derpMap // {}) |
  .derpMap.OmitDefaultRegions = false |
  .derpMap.Regions = (.derpMap.Regions // {}) |
  .derpMap.Regions[($region_id|tostring)] = {
    RegionID: $region_id,
    RegionCode: $region_code,
    RegionName: $region_name,
    Nodes: [
      {
        Name: $node_name,
        RegionID: $region_id,
        HostName: $current_ip,
        IPv4: $current_ip,
        DERPPort: 55443,
        STUNPort: 53478,
        STUNOnly: false,
        InsecureForTests: true,
        CertName: $fingerprint
      }
    ]
  }
  ' "${ACL_CURRENT_JSON}" > "${ACL_UPDATED_JSON}"

jq . "${ACL_UPDATED_JSON}" > "${ACL_PRETTY_JSON}"

curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -u "${TS_API_KEY}:" \
  --data-binary @"${ACL_UPDATED_JSON}" \
  "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl/validate" >/dev/null

curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -H "If-Match: ${ETAG}" \
  -u "${TS_API_KEY}:" \
  --data-binary @"${ACL_UPDATED_JSON}" \
  "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl" >/dev/null

echo "$(date '+%F %T') [INFO] public ip updated: ${PREV_IP:-none} -> ${CURRENT_IP}; fingerprint=${FINGERPRINT:-missing}; acl_region=${TS_REGION_ID}" >> "${LOG_FILE}"
EOF
chmod +x /opt/derper/scripts/update-public-ip.sh
```

### 4. 先手动执行一次

```bash
/opt/derper/scripts/update-public-ip.sh
cat /opt/derper/.env
cat /opt/derper/data/public_ip.txt
cat /opt/derper/data/cert_fingerprint.txt
cat /opt/derper/data/derpmap-node.json
cat /opt/derper/data/ts-acl.pretty.json
docker logs derper --tail=50
```

你要确认六件事：

- `.env` 里的 `DERP_DOMAIN` 被改成了真实公网 IP
- `public_ip.txt` 被写出来了
- `cert_fingerprint.txt` 里出现了最新的 `sha256-raw:...`
- `derpmap-node.json` 被自动生成了
- `ts-acl.pretty.json` 里出现了合并后的最新 policy file
- `derper` 容器被重建成功

如果 `cert_fingerprint.txt` 还是没有生成，先直接检查：

```bash
ls /opt/derper/certs
find /opt/derper/certs -maxdepth 1 -type f -name '*.crt'
cat /opt/derper/data/update-public-ip.log
```

因为这套脚本已经做了两层兜底：

1. 优先从 `docker logs derper` 里抓 `sha256-raw`
2. 如果日志抓不到，就直接从 `certs/*.crt` 计算 `sha256-raw`

只要证书文件已经成功落盘，通常就可以继续生成后面的指纹与 `derpMap` 文件。

### 5. 配置定时任务

编辑 root 的 `crontab`：

```bash
crontab -e
```

加上一行，每 5 分钟检查一次：

```cron
*/5 * * * * /opt/derper/scripts/update-public-ip.sh
```

这样以后家宽公网 IP 一旦变化，脚本就会自动改写并重启容器。

---

## 十一、iKuai 端口映射怎么配

容器只是跑起来还不够，你得把公网入口真正打到 `192.168.50.5`。

在 `iKuai` 中配置下面两条端口映射：

```text
TCP 55443 -> 192.168.50.5:55443
UDP 53478 -> 192.168.50.5:53478
```

**DERP TCP**：

- 内网地址：192.168.50.5
- 内网端口：55443
- 协议：tcp
- 映射类型：外网接口
- 外网地址：任意
- 外网端口：55443
- 允许访问 IP：留空
- 备注：derp-tcp

**STUN UDP**：

- 内网地址：192.168.50.5
- 内网端口：53478
- 协议：udp
- 映射类型：外网接口
- 外网地址：任意
- 外网端口：53478
- 允许访问 IP：留空
- 备注：derp-stun

**其中**：

- `55443/tcp`：DERP 主服务
- `53478/udp`：STUN

> **工程师提醒：**  
> 如果你后面发现一直走中继但速度很差，很多时候不是 `derper` 容器本身有问题，而是 `UDP 53478` 没真正打通。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260609005348676.png)

---

## 十二、自动改 ACL 这件事，读者最需要知道的 4 个注意点

现在这套方案不再是“脚本输出一个 `derpMap` 片段，你手工粘进去”，而是：

1. 读取当前 tailnet policy file
2. 只改 `derpMap`
3. 先走 `validate`
4. 再带着 `ETag` 回写

这已经是很像工程实践的方案了，但也因此有 4 个读者特别容易忽略的点。

### 1. `ETag` 不是可有可无

`GET /api/v2/tailnet/:tailnet/acl` 返回的响应头里会带一个 `ETag`。  
后面脚本回写时，把它放进：

```http
If-Match: "<etag>"
```

这样做的目的，是避免这种情况：

- 你在后台刚改完一条 ACL
- 另一边脚本还拿着较早获取的 policy file 快照
- 如果没有 `If-Match`，这份较早的快照就可能把新改动覆盖掉

所以这不是“高级优化”，而是自动改 policy file 时的基本防线。

### 2. `validate` 不是摆设

在真正写回前，脚本会先调用：

```text
POST /api/v2/tailnet/:tailnet/acl/validate
```

这样如果：

- JSON 结构错了
- `derpMap` 拼错了
- 某一处合并逻辑坏了

它会在“真正污染线上配置之前”先失败。

### 3. 这条路线会把 HuJSON 注释拍平

这一点前面已经提醒过一次，但这里值得再强调一遍。

脚本当前走的是：

- 读取解析后的 JSON
- 用 `jq` 改 `derpMap`
- 再把 JSON 直接写回

因此它不会保留：

- 你原来写在 policy file 里的注释
- 你原来自己喜欢的排版风格

如果你是重度“把 ACL 当文档写”的用户，最好接受这个现实：  
这条自动化路线换来的是**稳定更新**，代价是**失去原始 HuJSON 注释风格**。

### 4. `DERP_VERIFY_CLIENTS` 和 `CertName` 依旧是两回事

即便我们已经改成自动写 `derpMap`，也不要把这两层验证混在一起：

- `DERP_VERIFY_CLIENTS=true`
  - 服务端验证客户端是不是你自己的 tailnet 成员
- `InsecureForTests=true + CertName=sha256-raw:...`
  - 客户端验证服务端是不是你这台自签名 DERP

前者是防别人白嫖你的中继。  
后者是防你自己的设备连错中继。

```mermaid
flowchart TD
    A["cron 定时触发<br/>/opt/derper/scripts/update-public-ip.sh"] --> B["获取当前公网 IP"]
    B --> C{"和上次记录的 IP 相同吗？"}
    C -->|是| D["写日志：IP 未变化<br/>脚本退出"]
    C -->|否| E["更新 .env 中的 DERP_DOMAIN"]
    E --> F["docker compose up -d --force-recreate derper"]
    F --> G["从 derper 日志提取最新证书指纹<br/>sha256-raw:..."]
    G --> H{"拿到指纹了吗？"}
    H -->|否| I["写错误日志<br/>脚本退出"]
    H -->|是| J["生成 derpmap-node.json"]
    J --> K["GET 当前 tailnet policy file<br/>保存响应头与 ACL JSON"]
    K --> L["从响应头提取 ETag"]
    L --> M{"拿到 ETag 了吗？"}
    M -->|否| N["写错误日志<br/>脚本退出"]
    M -->|是| O["用 jq 仅更新 derpMap 区域节点"]
    O --> P["POST /acl/validate 预检"]
    P --> Q{"validate 通过吗？"}
    Q -->|否| R["保留本地生成文件<br/>写错误日志并退出"]
    Q -->|是| S["POST /acl<br/>带 If-Match: ETag 写回"]
    S --> T["保存 ts-acl.pretty.json"]
    T --> U["写成功日志<br/>记录新 IP / 指纹 / RegionID"]
```

---

## 十三、让客户端刷新到最新的 DERP 配置

`derpMap` 改完之后，不建议只靠客户端慢慢等缓存过期。

更稳的做法是，在关键节点上主动刷新一次。

### 1. 在这台家庭 LXC 路由节点上

```bash
tailscale down
tailscale up --reset --accept-dns=false --advertise-routes=192.168.50.0/24 --accept-routes=true
```

### 2. 在你的外部 Linux 节点上

```bash
sudo tailscale down
sudo tailscale up --reset --accept-routes
```

### 3. 在 macOS 或 Windows 客户端上

最省事的方式是：

- 退出 Tailscale
- 重新打开
- 或者菜单里断开后重新连接

如果你是命令行客户端，也可以用：

```bash
tailscale down
tailscale up --reset
```

---

## 十四、怎么验证“自动改 ACL”这一步确实生效了

除了看 `derper` 容器和端口，你还应该额外验证控制面是不是跟上了。

### 1. 先看本地生成的 policy 快照

```bash
cat /opt/derper/data/ts-acl.pretty.json | jq '.derpMap'
```

你至少要看到：

- `RegionID`
- `RegionCode`
- `HostName`
- `IPv4`
- `CertName`

都已经是最新值。

### 2. 再从 Tailscale API 反查一次

```bash
curl -fsS \
  -H "Accept: application/json" \
  -u "${TS_API_KEY}:" \
  "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl" | jq '.derpMap'
```

如果这里看到的内容，和本地 `ts-acl.pretty.json` 一致，就说明控制面已经写回成功。

### 3. 故意制造一个无效 JSON 看能不能被挡住

这一招不是正式运行步骤，但非常适合第一次验证自动化逻辑时做一次。

比如你可以临时改坏一份测试文件，然后手动调用：

```bash
curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -u "${TS_API_KEY}:" \
  --data-binary @/path/to/bad.json \
  "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl/validate"
```

只要它能正确返回校验失败，你就知道这条“先校验再回写”的防线确实在工作。

---

## 十五、怎么验证这套东西是不是真的工作了

不要只看“容器启动成功”，那不算验证。

应该按层验证。

### 1. 基础网络层

在 `192.168.50.5` 上：

```bash
ping -c 3 1.1.1.1
```

### 2. Tailscale 层

```bash
tailscale status
tailscale ping 192.168.50.2
```

### 3. DERP 进程监听

```bash
ss -lntup | grep -E '55443|53478'
```

### 4. STUN 端口是否真的打通

在外部设备上执行：

```bash
nc -zuv <你的当前公网IP> 53478
```

如果返回成功，说明 `UDP 53478` 至少是通的。

### 5. 证书是否真的在响应

直接在浏览器里访问：

```text
https://<你的当前公网IP>:55443
```

只要你能看到和 `DERP` 相关的响应内容，就说明 TLS 这一层已经起来了。

### 6. 公网 IP 更新链路

```bash
cat /opt/derper/data/update-public-ip.log
```

### 7. Tailnet 实际连接方式

在外部设备执行：

```bash
tailscale ping <你的另一台设备名>
```

输出里如果看到：

- `direct`
  - 说明当前是 P2P 直连
- `via DERP(home-ip)` 或类似区域名
  - 说明当前在走中继

这也正好回答了一个很多人关心的问题：

> **有动态公网 IP 时，是不是一定走 DERP？**

答案是否定的。

- 能直连时，优先直连
- 直连失败时，才走 DERP

也就是说，`DERP` 是兜底，不是默认强制路径。

---

## 十六、在家时会不会因为 Subnet Router 多绕一圈？

这个问题必须写清楚，不然很多人会误解。

如果你人在家里，并且访问的是：

- `192.168.50.2`
- `192.168.50.3`
- `192.168.50.4`
- `192.168.50.5`

这些**局域网 IP**，正常情况下是不会因为 `Subnet Router` 自动多绕一圈进 `Tailscale` 的。

原因是：

- `Subnet Router` 主要是给**外部 tailnet 节点**进入你家内网用的
- 它不会无缘无故接管你在家时的普通 LAN 访问

只有当你在家时故意用对方的 `100.x` Tailscale 地址访问它，或者你把自己配置成强制走某个 `Exit Node`，才可能让流量绕进 Tailscale。

这也是为什么：

- 访问 `192.168.50.x` 一般走 LAN
- 访问 `100.x.x.x` 才走 Tailscale

---

## 十七、本章小结

这一章完成后，你应该得到这样一套真正可用的远程基础设施：

- `192.168.50.5` 是独立的远程运维节点
- 它跑通了 `Tailscale`
- 它发布了 `192.168.50.0/24` 的 `Subnet Router`
- 它还运行着一个可随公网 IP 变化自动更新的 `DERP` 容器
- 它用自签名证书 + 指纹信任的方式跑通了纯 IP DERP
- 它把 `ETag`、`validate`、`derpMap`、`证书指纹`、`客户端刷新` 这些最容易漏的细节一起补齐了

最关键的是，这一切都**不再绑死在 iStoreOS 上**。

所以当你后面继续折腾：

- OpenClash
- AdGuardHome
- 特殊设备网关策略

就算把旁路由玩崩了，只要：

- `iKuai` 还在
- `192.168.50.5` 还在

你依然有机会从外面连回家，把系统救回来。

下一章，我们继续围绕这台 `192.168.50.5`，给整套 AIO 加上一层真正有用的分层监控与告警。
