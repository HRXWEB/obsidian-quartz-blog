---
title: 《工程师 AIO 手册》系列 05：【保姆级】实操篇 —— OpenWrt 旁路由，让你的网络真正具备“智慧”
draft: false
aliases: []
tags: []
created: 2026-06-08T14:05:18.1818+08:00
updated: 2026-06-08T16:46:37.3737+08:00
URL: https://zhuanlan.zhihu.com/c_2032941115297486065
---

> [!info] 版权所有
> 全文内容均来自（或许自己会加几行备注）[吉吉@知乎](https://www.zhihu.com/people/a-guan-da-shu) 的专栏 [工程师 AIO 手册：打造全能家庭服务器](https://zhuanlan.zhihu.com/c_2032941115297486065)，本文仅作为个人备份，如侵权请联系删除。

---

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608160751932.png)

### 💡 本章导读：1 分钟理清 iStoreOS 的“入驻”逻辑

在这一章，我们要为 AIO 系统安装一个“大脑”。不同于 iKuai 这种卖力干活的“保姆”，iStoreOS(OpenWrt) 更多地承担了**应用中心**的角色。

- **它的角色**：它是挂在 iKuai 旁边的“战术顾问”，通过应用商店扩展网络的功能。
- **本章核心操作**： 

1. **选对方案**：为什么不是 openwrt 而选择 iStoreOS。放弃臃肿的第三方固件，直接从 iStoreOS 官网获取稳定固件。
2. **准备环境**：在 PVE 中为它划拨资源，并开启 CPU 的 **AES-NI 加速**。
3. **镜像转换**：将下载的 `.img` 文件“投喂”给 PVE 虚拟机，解决 iStoreOS 默认不提供 ISO 安装包的问题。
4. **IP 规划**：正式启用预留的 **192.168.88.3** 地址，完成网络闭环。
5. **插件安装：**方便快捷的从应用商店安装插件。

---

### 一、 【选型与准备】—— 为什么选择 iStoreOS？

如果你在纠结是直接刷官方 OpenWrt 还是用国内团队基于其开发的 iStoreOS，其实核心就在于你是想“折腾系统”还是“折腾插件”。

虽然两者底层都是 OpenWrt，但作为工程师，从效率和家庭使用的稳定性角度出发，以下是选择 iStoreOS 的几个实在理由：

### **1. 交互体验：从“纯代码”到“仪表盘”**

- **官方 OpenWrt**：默认的 LuCI 界面非常“复古”，很多设置隐藏得很深，且缺乏直观的状态监控。
- **iStoreOS**：做了一套非常符合现代审美的首页看板。CPU 温度、内存占用、网口连接状态一目了然。对于咱们这种放在弱电箱里的小主机，一眼能看出硬件跑得稳不稳，非常有必要。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608160905687.png)

### **2. 软件库：再也不用满世界找 ipk 安装包**

- **官方 OpenWrt**：虽然带了软件包管理，但里面的东西大多是基础组件。想装个离线下载或常用的网络插件，往往要自己找仓库、处理依赖冲突。
- **iStoreOS**：核心卖点就是那个 **iStore 软件市场**。它像手机应用商店一样，点一下就能安装。最重要的是，官方团队已经帮你处理好了插件之间的依赖关系，大大降低了新手把系统搞崩溃的概率。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608160913736.png)

### **3. 灾难恢复：最后的一道防线**

- **官方 OpenWrt**：如果配置改错了导致无法开机，通常需要进 Failsafe 模式或者干脆重刷。
- **iStoreOS**：自带了比较完善的**备份与恢复**机制，甚至有专门的“救砖”引导。这对于喜欢折腾插件的朋友来说，试错成本低了很多。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608160959919.png)

### **4. 本地化适配：更懂国内的网络环境**

- **官方 OpenWrt**：很多默认设置（比如 DNS、时间同步、源地址）都是针对国外的，国内用起来有时会很慢。
- **iStoreOS**：国内团队开发，默认配置就是国内最优。尤其是在处理一些拨号兼容性、特定的网络环境优化上，省去了工程师大量改配置文件的功夫。

---

### **🛡️ 工程师的真心话：**

如果你是想通过折腾系统来学习 Linux 网络底层架构，那必须选**官方 OpenWrt**，那才是原汁原味。

但如果你跟我一样，折腾网络的终极目标是“稳定上网、方便全家、别出乱子”，那么 **iStoreOS** 这种把底层脏活累活都干了的“精修版”显然更高效。毕竟，我们的时间应该花在更有价值的配置上，而不是去解几个没完没了的安装包依赖错误。

---

### 二、 准备工作：固件下载与 IMG 转换

在动手创建虚拟机之前，我们需要准备好最新的固件镜像。

### 1. 获取固件

- **官方渠道**：[前往 iStoreOS 官网](https://fw.koolcenter.com/iStoreOS/)。
- **版本选择**：找到适用于 **x86_64** 架构的版本。**x86_64**中包含**UEFI**和**Legacy**两个版本。首选 **UEFI**，除非你的硬件太老。（==本人 Rikcy 注：选择 x86_64_efi 版本就是 uefi 版本==）

### 2. 关于 IMG 镜像的说明

PVE 默认支持的是 ISO 镜像安装。对于 iStoreOS 这种提供 IMG 镜像的系统，我们通常有两种安装方式：

- **方式 A（推荐）**：先创建一个虚拟机，然后通过 PVE 命令行（Shell）使用 `qm importdisk` 命令将 IMG 镜像导入为虚拟机的磁盘。
- **方式 B**：使用第三方工具将 IMG 转换为 ISO，但这往往会增加不稳定性。

---

> **🛑 避坑指南：拒绝“全家桶”固件**  
> 很多新手喜欢从各种群里下载“大集成”固件，里面预装了上百个插件。这种固件在 J4125 上运行会有两个问题：  
> **插件过旧**：很多插件早已停止维护，存在安全漏洞。  
> **资源冲突**：多个插件同时运行会无谓消耗 CPU 资源，甚至导致网络环路。  
> **工程师建议**：从 iStoreOS 这种官方纯净版开始，缺什么插件就在应用商店装什么，按需取用。

---

## 三、 【搭建营地】—— PVE 虚拟机的创建与性能加速

### 1. 创建虚拟机

- 登录 PVE 后台，点击 **“创建虚拟机”**。
- **常规**：VM ID 设为 `101`，名称填入 `iStoreOS`。(可以自行修改)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161105013.png)

- **操作系统**：选择 **“不使用任何介质”**。因为我们要后续手动导入 IMG 镜像。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161111180.png)

- 系统：安装 Legacy 版本的 iStoreOS 时，全部保持默认即可。本教程以 UEFI 版本为例进行安装，参考下面配置。
	- BIOS：选择 OVMF(UEFI)
	- 添加 EFI 磁盘：勾选
	- EFI 存储：选择 local-lvm
	- 预注册密钥：取消勾选

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161125619.png)

- **磁盘：**删除默认的磁盘。后续手动导入 IMG 镜像。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161743631.png)

- **CPU（处理器）**：
	- **核心**：给 2 核。
	- **类型**：**必须选择 `host`**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161757211.png)

> **工程师提示：** 开启 `host` 模式是为了直接透传 J4125 的 **AES-NI 指令集加速**。这能让旁路由在处理加密数据包时，性能提升数倍，并显著降低 CPU 占用。

- **内存**：建议给 **2048MB (2G)**。iStoreOS 运行插件需要一定的内存缓冲区。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161842461.png)

- **网络**：保持默认的 `vmbr0`（网桥模式），取消勾选 **“防火墙”**。旁路由不需要 PVE 的额外防火墙拦截。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161859146.png)

- **确认：**确认一下前面的配置是否有问题，有问题点击上面各个分类进行修改，没有问题直接点击完成。

**🛡️ 提醒：**左下角的 `创建后启动` 先不要选上，咱们还要添加 iStoreOS 的镜像

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161933008.png)

- **虚拟机建成：**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608161950012.png)

### 2. 导入 iStoreOS 镜像

由于下载的是 `.img.gz` 镜像，我们需要将其“投喂”给刚才创建的虚拟机。

- 在 windows 下解压下载好的固件，得到 `xxx.img` 文件。
- 将该文件通过 PVE 的 Web 界面上传到 `local` 存储，或通过 SFTP 工具上传到 PVE 宿主机。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162007321.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162019665.png)

- 打开 PVE 的 **网络**，输入以下命令： `qm importdisk 101 /var/lib/vz/template/iso/istoreos-24.10.6-2026041710-x86-64-squashfs-combined-efi.img local-lvm` （_注：101 是虚拟机 ID，路径是你上传的位置，这两项自行调整_）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162041573.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162055942.png)

- 命令执行完毕后，回到 101 虚拟机的 **硬件** 选项卡，你会看到一个 **“未使用的磁盘 0”**。双击它，点击 **“新增”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162135635.png)

### 3. 启动顺序调整

进入虚拟机的 选项 -> 引导顺序，确保刚导入的磁盘排在第一位，勾选并保存

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162306093.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162332438.png)

### 4. 设置开机自启动

最后，虚拟机的 选项 -> 开机自启动，双击它，勾选。确保 PVE 启动后，iStoreOS 可以自动运行。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162359575.png)

完成虚拟机的创建与镜像导入后，iStoreOS 已经具备了启动条件。下面我们将进入系统内部，完成最关键的“单臂路由”网络配置，确保它能与 iKuai 协同工作。

---

### 四、 【系统安装】—— iStoreOS 初始化与 IP 绑定

点击 iStoreOS 虚拟机，进入 **引导顺序**，然后点击 **选项** 。当屏幕不再滚动大段代码，并出现 iStoreOS 的 Logo 时，说明系统已就绪。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162428600.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162435633.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608162450719.png)

### 1. 修改后台管理 IP

由于 iStoreOS 默认的后台地址（通常是 192.168.100.1）与我们规划的 192.168.88.x 网段不符，必须先在终端进行修改，否则无法从浏览器进入配置界面。

- 操作动作：在控制台中按下回车键，激活命令行。输入以下命令并回车：`quickstart`
- 交互设置:
	1. 在弹出的菜单中选择 “Change LAN IP”。
	2. 输入预定地址：192.168.88.3。
	3. 子网掩码保持：255.255.255.0。
	4. 设置完成后，系统会自动应用并重启网络服务。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163321183.png)

### 2. 进入网页后台

现在，你可以切换回电脑浏览器，输入 `192.168.88.3`。

- **操作动作**：`root`
- **交互设置**：`password`（建议进入后第一时间在系统设置中修改）。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163343461.png)

### 3. 修改密码

登录成功后，点击转到密码配置，进行密码修改。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163355756.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163406359.png)

---

### 五、 【旁路由配置】—— 实现“单臂”联网逻辑

这是本章技术含量最高的部分。旁路由之所以叫“旁路由”，是因为它只有一根虚拟网线连入内网。我们需要手动告诉它：当它需要上网时，该去找谁。

### 1. 网络接口调整

在 iStoreOS 后台，点击 “网络” -> “接口”。

- 删除多余接口：由于是旁路由模式，除了 LAN 接口（包含：lan、lan6）外，其他的 WAN、WAN6 等接口全部删除。
![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163526263.png)

编辑 LAN 接口：点击 lan 接口的编辑按钮

常规设置: 

- 传输协议：保持“静态地址”。
- IPv4 地址：确认是 192.168.88.3。
- IPv4 子网掩码：255.255.255.0。
- IPv4 网关：必须填写 iKuai 的地址，即 192.168.88.2。

高级设置: 

- DNS 服务器：填写 192.168.88.2（由 iKuai 处理）或 114.114.114.114。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163700030.png)

### 2. 关闭 DHCP 服务（核心动作）

这是避免内网崩溃的底线操作。

- 操作路径：接着上面的配置页，找到 “DHCP 服务器” 选项卡。
- 动作：勾选 “忽略此接口”。
- 理由：内网中发 IP 地址的权利必须统一交给主路由 iKuai。如果 iStoreOS 也开启 DHCP，会导致手机、电脑拿到的网关地址发生冲突，造成全家无法上网。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163750254.png)

- 保存并应用

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163757182.png)

### 3. 防火墙设置

为了确保旁路由转发流量顺畅，需要处理防火墙。

- 操作路径：“网络” -> “防火墙”。
- 启用 SYN-flood 防御：取消勾选
- “输入”、“出站数据”、“转发”：全部设置为“接受”。
- 启用 FullCone-NAT：高性能模式

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163804374.png)

- 区域的 lan => wan：
	- “输入”、“出站数据”、“区域内转发”：全部设置为“接受”。
	- IP 动态伪装：勾选

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163906012.png)

- 保存并应用

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608163911998.png)

---

### 六、 【应用实战】—— 插件安装与配置范式

有了稳固的底层系统和正确配置的网络防火墙，现在终于到了 iStoreOS 的高光时刻——**应用商店（iStore）**。

在传统的 OpenWrt 中，安装插件往往意味着要去找 .ipk 文件、处理依赖冲突、甚至需要敲命令行。而在 iStoreOS 中，这一切都被简化成了类似“手机应用市场”的体验。接下来我们将演示如何使用 iStore 安装并配置插件。虽然插件种类繁多，但安装逻辑是通用的。

### 1. 更换更稳定的镜像源

首先确认系统自带的软件源是否好用。（有时镜像站同步新版本时，会导致失败）

- 进入 iStoreOS 后台，点击 **系统** -> **软件包** -> **更新列表…**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164016927.png)

- ❌出现上面的错误就是镜像站的新版本数据不存在导致的，解决方法，换源。以中科大的源为例进行更换

没有报错的话，说明自带的软件源没有问题，不用更换源，直接跳过此步。

通过 Web 界面修改（推荐）

1. 进入 iStoreOS 后台，点击 系统 -> 软件包 -> 配置 OPKG
2. 在“发行版软件源（/etc/opkg/distfeeds.conf）”中，将 `mirrors.cernet.edu.cn` 替换为中科大的源： `mirrors.ustc.edu.cn`
3. 点击保存。再次点击更新列表…按钮确认

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164228995.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164236606.png)

### 2. 软件源检查

在安装任何插件前，确保你的 iStoreOS 已经联网。

- 操作：点击左侧菜单的 “iStore”。如果页面能正常加载出各种插件图标，说明网络配置正确。
- 提示：如果页面空白，请回过头检查网关（192.168.88.2）和 DNS 是否配置正确。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164415454.png)

### 2. 插件安装流程（以常用工具为例）

我们以一个端口转发类工具 Socat 作为示范：

- 搜索：在 iStore 搜索框输入你需要的插件名称。
- 安装：点击插件下方的 “安装” 按钮。iStore 会自动处理后台的下载、依赖安装和解压工作。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164428459.png)

1. **启动**：安装完成后，插件会出现在左侧菜单的 **“服务”** 或 **”网络“**选项中。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164504608.png)

### 3. 配置范式：旁路由插件的通用原则

无论你安装什么插件，在旁路由模式下都要遵循以下逻辑：

- **运行模式**：如果有“兼容模式”、“全局模式”等选项，建议先从 **“兼容模式”** 开始。
- **DNS 转发**：插件通常会自带 DNS 解析功能。如果你发现开启插件后上网变慢，尝试关闭插件内的 DNS 转发，让 DNS 处理权回到 iKuai 手中。
- **端口冲突**：如果安装了多个功能类似的插件，注意检查它们的监听端口是否冲突。

---

### 七、 【全网联调】—— 如何让设备走旁路由？

iStoreOS 配置好了，插件也运行了，但你会发现默认情况下你的电脑上网还是走的原来的路线。我们需要手动“引流”。

### 1. 方案 A：手动指定（最安全，推荐测试用）

如果你只想让某一台设备（比如你的 PC）享受旁路由的功能：

- **操作**：进入电脑的网络设置，将 **IPv4 网关** 手动修改为 `192.168.88.3`，并将 **DNS** 也改为 `192.168.88.3`。
- **优势**：这种方式最稳。哪怕你把 iStoreOS 折腾挂了，也只影响这一台电脑，家里其他人的网络完全不受影响。

### 2. 方案 B：iKuai 强制指派（全家自动化）

如果你希望专用设备自动走旁路由：

- **操作**：回到 iKuai 后台 -> **“网络设置”** -> **“DHCP 设置”**。
- **指定设备**：在**“DHCP 终端列表”** 里，找到专用设备，点击加入静态分配

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164609668.png)

- **修改网关**：在**“DHCP 静态分配”** 里，找到加入的专用设备，点击编辑，修改网关为 `192.168.88.3`

![](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164609668.png)

---

> **🛑 工程师的最后叮嘱：解耦的意义**  
> 在这个 AIO 架构中，iKuai（.2）是地基，iStoreOS（.3）是上层建筑。  
> **测试习惯**：每次在 iStoreOS 里安装新插件或修改大配置后，先用一台设备手动设网关进行测试。确认稳定后，再考虑是否在 iKuai 里全局铺开。这种“局部试点”的思维是保证家庭 AIO 系统不被老婆投诉的核心。

---

### 💡 结语：你的 AIO 已经有了“智慧”

到这里，《工程师 AIO 手册》系列 05 就告一段落了。如果你跟着手册一步步走到了这里，你的 J4125 已经不再仅仅是一个拨号上网的工具，而是一个拥有了**插件生态、硬件加速、流量分流**能力的家庭微型数据中心。

这种“iKuai 负责稳，iStoreOS 负责灵”的双路由架构，不仅给了你极致的折腾空间，更重要的是它通过**网关解耦**，给了你折腾时最需要的“安全感”。

**接下来我们要折腾什么？**

有了完美的网络环境，存储和数据安全就成了下一个硬骨头。AIO 的大任，怎么能少了那个“买系统送硬件”的群晖？

**下一章预告：**

**《工程师 AIO 手册》系列 06：【保姆级】实操篇 —— PVE 引导安装黑群晖，构建全家私有云。**

---

### 📢 写在最后

这篇教程如果帮到了你，别忘了点个赞、收藏并关注。AIO 的折腾之路，逻辑比操作更重要，只要思路对了，没有搞不定的固件。咱们下一章，带你玩转私有云存储！

**本内容作为《工程师 AIO 手册》系列之五，旨在分享技术逻辑，部分系统方案仅供技术交流及实验研究。**