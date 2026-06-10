---
title: 《工程师 AIO 手册》系列 03：【保姆级】实操篇（PVE 安装） —— 从 U 盘启动到配置第一块虚拟网卡
draft: false
aliases: []
tags: []
created: 2026-06-08T14:05:18.1818+08:00
updated: 2026-06-08T15:25:48.4848+08:00
URL: https://zhuanlan.zhihu.com/c_2032941115297486065
---

> [!info] 版权©️所有
> 全文内容均来自（或许自己会加几行备注）[吉吉@知乎](https://www.zhihu.com/people/a-guan-da-shu) 的专栏 [工程师 AIO 手册：打造全能家庭服务器](https://zhuanlan.zhihu.com/c_2032941115297486065)，本文仅作为个人备份，如侵权请联系删除。

---

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608143716274.png)

### 💡 本章导读：1 分钟看懂 PVE 安装全流程

如果你不想被长篇大论淹没，或者正准备开启你的第一台 AIO 小主机，请先花 1 分钟看完这组“实操核心结论”：

### 1. 核心操作路径

本章将带你完成从物理机到虚拟化底座的转变，重点步骤如下：

- **🔌物理层调优：** 重启进入 BIOS，锁定 **VT-d**（直通开关）与 **ASPM**（关闭网卡节能）以及开启**断电自启**。
- **🛠️引导盘制作：** 弃用传统写入工具，改用 **Ventoy** 实现多镜像（PVE/iKuai/OpenWrt/Windows）共存。
- **💾物理安装：****PVE9**从零开始安装，**换源**，**硬件直通**，**屏蔽无订阅弹窗**，**网卡调优**等。

### 2. 关键配置参数

为了配合后续章节的“双路由架构”，我们在安装阶段必须预埋以下关键参数：

- **管理 IP：**`192.168.88.1`
- **默认网关：**`192.168.88.2`（预留给未来的主路由 iKuai）
- **文件系统：**`ext4`（禁止 ZFS 以节省内存）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608143955452.png)

### 3. 你将获得的成果

完成本章操作后，你将拥有一台运行在 **PVE 9.x** 系统上、支持硬件直通、且针对螃蟹网卡（Realtek）做过稳定性优化的“稳如老狗”的 AIO 底座。

---

### 实验设备公示：我的“数字化地基”

为了保证教程的可参考性，本系列后续所有实操均基于以下硬件环境：

- **CPU:** Intel Celeron J4125 (4 核 4 线程，低功耗神卡)
- **网卡:** 双 Realtek RTL8111/8168/8411 千兆网卡（俗称“螃蟹卡”）
- **内存:** 8GB DDR4
- **硬盘:** 128GB SATA SSD

> **工程师笔记：** J4125 虽老，但完整支持虚拟化技术。唯一的挑战在于 8GB 内存和 128G 存储空间的分配，我们在后续安装中要严格控制宿主机的资源占用，把更多的空间留给虚拟机。

---

### 一、 环境预检 —— BIOS 里的“生存法则”

在还没插上 U 盘之前，很多人的 AIO 计划其实就已经埋下了“翻车”的伏笔。对于 J4125 这种小主机，BIOS（基本输入输出系统）的设置直接决定了你的物理网卡能否顺利直通。

### 1. 开启虚拟化的“两把钥匙”

重启小主机，疯狂敲击 `Del` 或 `F2` 进入 BIOS 界面。==「本人 Ricky 注：我的康耐信 7505 是 `del` 键进入」==

- **Intel Virtualization Technology (VT-x):** 必须设为 **Enabled**。 
	- **原理：** 这是 CPU 运行虚拟机的基础指令集。如果不开启，PVE 虽然能装上，但你在创建虚拟机时会收到 KVM 的报错提示。
- **VT-d (Directed I/O):** 必须设为 **Enabled**。 ==「本人 Rikcy 注：我的 VT-d 印象中是在 chipset 中设置」==
	- **核心逻辑：** 这是 AIO 玩家最看重的“硬件直通”开关。开启后，你才能让 iKuai 绕过 PVE 系统直接接管物理网卡，从而降低网络延迟并提升吞吐量。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144406737.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144413964.png)

### 2. 螃蟹网卡的“防断网”设置

==「本人 Ricky 注：我的是 i226-V 网卡，可以跳过这个设置，我当前设置也没找到相关配置」==

螃蟹卡（Realtek）在 Linux 系统下有一个常见的毛病：因为节能模式导致网卡“假死”。

- **ASPM (Active State Power Management):** 建议设为 **Disabled**。  
	- **理由：** ASPM 是 PCIe 的电源管理模式，但在 AIO 环境下，网卡必须 24 小时待命。开启此项可能会导致网卡在高负载或长时间低负载时突然离线，造成全家断网。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144444730.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144453351.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144501069.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144509463.png)

- **Auto power on (来电自启):** 务必设为 **Power On**。  
	- **理由：** 作为一个工程师，你必须保证设备在停电又来电后能自动恢复服务，否则你身在外地时，家里的网络将彻底失联。
	- ==「本人 Ricky 注：我的是在 `Advanced -> PowerManagment Configuration -> Restore AC Power Loss`」==

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144619150.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144627500.png)

### 3. 引导模式建议

- **Boot option filter:** 建议选择 **UEFI Only**。  
	- **理由：** 现代的 PVE 8.x 以上的版本对 UEFI 的支持远好于 Legacy（传统模式），不仅启动速度更快，在后续挂载大容量硬盘或处理复杂的 NVMe 协议时也更稳固。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144850559.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608144900153.png)

> **工程师笔记：** BIOS 的设置选项根据各个主机的不同，略有差异，以上只是本次实验设备的设置，仅供参考，大家可以自行查找，思路就是所有菜单一层一层的找。再邪修一点的，可以把以上需要设置的观点告诉 AI，把 BIOS 截图或拍照给 AI，让 AI 帮你找。

---

### 二、 制作启动盘 —— 拒绝“玄学”失败

制作启动盘是很多新手的第一道坎。有些人用普通的镜像写入工具，结果安装到一半提示“无法挂载镜像”。甚至刚刚启动就报错了，安装界面都无法显示。

### 1. 为什么我强推 Ventoy？

作为工程师，我不建议使用 Rufus 或 UltraISO。我推荐 **Ventoy**。

- **逻辑：** Ventoy 的原理是在 U 盘上创建一个微型系统，它能直接读取 U 盘里所有的 ISO 文件。
- **好处：**

1. **多镜像共存：** 你的 U 盘可以同时放下 PVE、iKuai、Windows 各个版本的各种镜像。
2. **拷贝即用：** 以后更新 PVE 版本，直接把新的 `.iso` 拖进去就行。
3. **解决痛点：**只有一个 U 盘的情况下，安装不同的系统，只能重新刷入新系统，无法保留原系统，或者准备多个 U 盘。Ventoy 就解决了这个痛点，U 盘启动后，想用哪个镜像文件，就选择哪个镜像文件，互相并不冲突。

### 2. 制作步骤

1. **[下载 Ventoy 工具](https://www.ventoy.net/en/download.html)，选择你的 U 盘并点击“安装”。**

**⚠️ 避坑指南**：一定要下载最新版，针对以前用过 Ventoy 的朋友，以为直接将 PVE8.X，或 PVE9.X 镜像复制到 U 盘里就能直接使用了，这里就要小心了，旧版本的 Ventoy 不支持 PVE8.X 以上的安装，U 盘启动时会停留在黑屏的加载界面，无法进入安装界面。本人就在这个坑里挣扎了很久，一度安装回 PVE7.X 的版本。

本文当前为 ventoy-1.1.12 版本

- 下载并解压 Ventoy
- 将 U 盘插入电脑
- 运行 Ventoy2Disk.exe 文件，在设备栏中选择需要安装 Ventoy 的 U 盘，如果以前的 U 盘就是安装过 Ventory 的，可以看到新版本和本设备的版本。点击升级按钮可以在保留 U 盘内容的情况下升级版本（推荐）。如果 U 盘没有安装过 Ventory，直接点击安装即可。安装前一定要备份好 U 盘数据文件。  

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145202834.png)

- 点击安装按钮后，会有两次警告提示，如果数据不需要，或者已经备份好数据，则点击是，继续。  

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145235747.png)

- 安装完成后，会出现下面的提示，咱们这步就算大功告成了。 ==「本人 Ricky 注：此时 U 盘盘符名字会变成 Ventoy」==

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145245651.png)

1. **去 [Proxmox 官网下载](https://www.proxmox.com/en/downloads) 最新的 `proxmox-ve_9.1-1.iso`**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145356489.png)

1. **直接把下载好的 ISO 文件拷贝到 U 盘根目录**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145500193.png)

1. **工程师 Tips：** 顺便把 iKuai 的 ISO 和 iStoreOS 的镜像也拷进去，我们一气呵成。如果你有其他装系统的需求，还可以把微 PE 的 ISO，Windows 的镜像等等都放里面。不必放在根目录，可以整理到各自的目录。U 盘启动时，这些都会被识别出来的。

---

### 三、 PVE 安装 —— 每一个选项都是在埋伏笔

==「本人 Ricky 注：在刷机之前，注意先将网线连接在第一个网口（如 eth0）上，作为后续的 lan 口。在后续 [[#5. 管理网口与 IP 预留 (重点中的重点)]] 中设置 `Management Interface` 时候也会选择它」==

### 1. U 盘启动

接好键盘鼠标、显示器，用网线连接小主机和电脑，将刚刚做好的 U 盘插入小主机，开机按 F11（或对应的快捷键），选择 U 盘启动进入 Ventoy 界面，选择你刚刚拷贝进去的 PVE 镜像。

==「本人 Ricky 注：我临时买的一个联想 thinkplus 双插口 U 盘，没识别出来制造商，显示的是 `UEFI: VendorC ProductCode 3.20, Partition 2`」==

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145530599.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145711881.png)

选择第一项 Boot in normal mode

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145729301.png)

### 1. 启动与协议

屏幕跳出欢迎界面后，直接回车进入 `Install Proxmox VE (Graphical)`。

- **注意：** 如果你的显示器分辨率太低导致按钮显示不全，可以尝试 `Console` 安装模式。
- 点击 `I agree` 接受协议。作为一个工程师，我们关注的重点在下一步。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145742845.png)

加载中… …

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145756776.png)

出现下面画面，直接回车进入

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145808039.png)

### 2. 目标硬盘与分区策略 (Target Harddisk)

这里会显示小主机的硬盘（128GB）和 U 盘（32GB）。选择小主机自带的硬盘（128GB）后，**先别急着点下一步**，点击旁边的 `Options` 按钮：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145825879.png)

- **Filesystem (文件系统)：** 选 **ext4**。不要选 ZFS 的系统，ZFS 的强大是靠吃内存来换取数据安全的。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608145842913.png)

- **hdsize / swapsize / maxroot / minfree / maxvz:** 如果硬盘空间够用的话，这里推荐全部留空，由 PVE 系统按照默认的比例进行分配，这也是保证 PVE 稳定运行的关键。==「本人 Ricky 注： hdsize 不要动就行了，不要为了留空删除，那就变成 0.0 GB 了，之后刷机会提示空间不足失败」==

> **工程师笔记**：如果硬盘太小，在规划阶段就已经感觉捉襟见肘，打算将硬盘空间发挥到极致，不浪费任何空间，完全可以通过修改这几个值，将所有 PVE 预留的空间全部释放出来给虚拟机使用。这个地方该如何分配，后续还有哪些操作才能达到极致使用，以及一些相关的注意事项，后续单独出一期教程，详细说明。

### 3. 国家与时区

- **Country:** 输入 `China`。
- **Timezone:** 自动识别为 `Asia/Shanghai`。
- **Keyboard Layout:** 默认 `U.S. English` 即可。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608150118258.png)

### 4. 设置密码与邮箱

- **Password:** 这是你管理后台的 root 密码，千万记牢。
- **Confirm:** 再输入一次密码。
- **Email:** 随便填一个格式正确的邮箱（例如 `admin@example.com`）即可，不用必须真实，但系统要求必须填写。如果有经常查看邮件的习惯，还是推荐使用真实有效的邮箱，虽然是内网使用，发生报警的几率不大，一旦收到报警邮件，还是可以及时了解 PVE 的状况，并及时干预的。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608150537960.png)

**⚠️ 避坑指南**：我就收到报警邮件了。而且是每天都有。原因是 PVE 检测出硬盘有损坏。应该及时更换硬盘。当然，这也不代表 PVE 不能使用了，通过每天的邮件可以检测到损坏的程度是否扩大。这种情况一定要尽早更换硬盘，避免出现不必要的损失。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608150552157.png)

### 5. 管理网口与 IP 预留 (重点中的重点)

这是全篇最重要的逻辑节点。我的 J4125 有两个物理网口，我们要在此刻完成网络布局：

- **Management Interface:** 选择 PVE 管理网口。多网口设备，需要选择一个网口作为 PVE 调试用的网口，这是必须的，其他的网口留给光猫接入使用。 
- **实操建议：** 建议选编号最小的那个（物理上通常是最左边的网口 1，当然我也有遇到过特殊情况，真遇到了，再逐一排查吧）。
- **Hostname:** 填 `pve.local`（这个是一级域名的格式 xx.xx，使用自己喜欢的名字吧）
- **IP Address:** 手动输入 **`192.168.88.1`**（这个就是 PVE 管理网口的地址，安装后通过这个地址可以访问 PVE 的管理控制台）
- **CIDR :** 这个就是 IP 地址后面的 `24`，等同于子网掩码 `255.255.255.0`。不懂的不用纠结，直接默认值 `24` 即可。
- **Gateway (网关):** 填 **`192.168.88.2`**。 
- **工程师思维：** 现在的网关实际上是不通的，因为 iKuai 还没装。但先设为 `.2` 是为了后续 iKuai 启动后，PVE 能直接联网，不需要再回头进命令行改网关地址。
- **DNS Server:** 填 `223.5.5.5` 或 `114.114.114.114`。
	- ==「本人 Rikcy 注：北京联通 DNS：通常为 `202.106.0.20`，备用 DNS 可使用 `202.106.196.115` 或 `123.123.123.123`」

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608150425130.png)

### 6. 确认并开始安装

最后核对一下信息。如果看到分区方案是 `ext4`，IP 是 `192.168.88.1`，就可以点 `Install` 了。

- 安装过程很快，大约 3-5 分钟就能跑完。
- **关键动作：** 进度条走完后，机器会自动重启。**看到屏幕黑掉的一瞬间，立刻拔掉 U 盘！** 否则可能又会进入 Ventoy 的循环界面。
- **安装完成：**当你看到黑色的终端窗口显示 `pve login:` 时，恭喜你，你的物理机已经变成了一台硬核的虚拟化服务器。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151214416.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151223854.png)

---

### 四、 系统手术 —— 榨干小主机的最后一点潜力

在你的电脑上，将网线接入小主机的管理口（左边第一个），手动设置电脑 IP 为 `192.168.88.101`，然后在浏览器访问 [https://192.168.88.1:8006](http://link.zhihu.com/?target=https%3A//192.168.88.1%3A8006/)。

- 语言：中文
- 用户名：root
- 密码：PVE 安装时输入的 Password
- 领域：不用修改，默认值

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151318499.png)

### 1. 彻底解决国内下载“龟速”问题

PVE 默认使用的是企业版源，没有订阅账号是无法更新的，且服务器在国外，速度感人。

- **第一步：屏蔽企业源并添加免费源**

网上有很多都是通过输入命令来禁用企业源的，其实在 PVE 管理后台中完全可以手动禁用的。

**屏蔽企业源：**节点名称 (**Step1**) -> 更新 / 存储库 (**Step2**) -> 选中 `https://enterprise.proxmox.com` 开头的条目 (**Step3**) -> 禁用按钮 (**Step4**) -> 选中另一个 `https://enterprise.proxmox.com` 开头的条目 (**Step5**) -> 禁用按钮 (**Step6**)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151421637.png)

**添加免费源：** 点击 **添加** 按钮。弹出的警告窗口点击 OK（提示没有订阅），然后在下拉菜单中选择 **No-Subscription**，最后点击添加。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151331421.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151337646.png)

==「本人 Ricky 注：以下的命令执行可以 ssh 上去操作，方便复制粘贴。另外习惯的话也可以用 `vim.tiny` 编辑文件」==

- **第二步：添加国内中科大（或清华）源**  
- 替换 Debian 系统基础源

这个源负责 Debian 底层组件的更新。在 PVE Shell 中，备份并编辑 `debian.sources` 文件。

```text
cp /etc/apt/sources.list.d/debian.sources /etc/apt/sources.list.d/debian.sources.bak
nano /etc/apt/sources.list.d/debian.sources
文件编辑后，保存：按 ctrl+o 回车，退出：按 ctrl+x
```

将文件中的 `http://deb.debian.org` 和 `http://security.debian.org` 都替换为下面任意一个镜像地址。  
**中科大：** `https://mirrors.ustc.edu.cn`  
**清华：** `https://mirrors.tuna.tsinghua.edu.cn`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608151852936.png)

- 添加 PVE 免费镜像源

在 PVE Shell 中，备份并编辑 `proxmox.sources` 文件。

```text
cp /etc/apt/sources.list.d/proxmox.sources /etc/apt/sources.list.d/proxmox.sources.bak
nano /etc/apt/sources.list.d/proxmox.sources
文件编辑后，保存：按 ctrl+o 回车，退出：按 ctrl+x
```

将文件中的 `http://download.proxmox.com/debian/pve` 替换为下面任意一个镜像地址。  
**中科大：** `https://mirrors.ustc.edu.cn/proxmox/debian/pve`  
**清华：** `https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152056858.png)

- 添加 Ceph 免费镜像源

在 PVE Shell 中，备份并编辑 `ceph.sources` 文件。

```text
cp /etc/apt/sources.list.d/ceph.sources /etc/apt/sources.list.d/ceph.sources.bak
nano /etc/apt/sources.list.d/ceph.sources
文件编辑后，保存：按 ctrl+o 回车，退出：按 ctrl+x
```

**修改点说明：**

- **URIs**: 将原来的 `https://enterprise.proxmox.com/debian/ceph-squid` 替换为下面任意一个镜像地址。

**中科大：** `https://mirrors.ustc.edu.cn/proxmox/debian/ceph-squid`  
**清华：** `https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/ceph-squid`

- **Components**: 将 `enterprise` 改为 `no-subscription`。这是开启免费源的核心。
- **Enabled**: 确保改为 `true`。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152000433.png)

- 使配置生效

在 PVE Shell 中，执行下面命令。这一步能让系统组件保持最新，并修复已知的安全漏洞。

```text
apt update && apt dist-upgrade -y
```

**⚠️ 避坑指南**：通常的教程里，使配置生效这步都会写进去，但是作为我们刚刚配置 PVE，iKuai 还没有安装，宽带还没有接入的情况下，这步一定会失败的。作为教程，这步是必须写的，但是作为安装步骤来说，这步不用实行。等后续 iKuai 安装完成后，再进行 PVE 的更新，使配置生效。

### 2. 移除“无订阅”弹窗

每次登录 PVE 都会弹出“No Valid Subscription”的提示，非常碍眼。备份并执行以下命令即可永久消除：

```text
cp /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js.bak0

sed -i.bak "s/res.data.status.toLowerCase() !== 'active'/false/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js

systemctl restart pveproxy
```

验证方法：在浏览器的 PVE 管理后台页面，按 ctrl+F5 （==「本人 Ricky 注：Safari 可以用 option + cmd + R 强制刷新网页」==）可以获取到上面修改后的文件，然后注销用户后，重新登录来验证是否生效。

> **工程师笔记**：此操作修改的是前端 JS 逻辑，仅为视觉优化，不影响系统功能。

### 3. 螃蟹网卡（Realtek）的终极调优

==「本人 Ricky 注： i226-V 网卡可跳过」==

**现状验证**：如果你的 AIO 目前运行平稳，**不建议**无脑执行。

**故障排查**：如果出现“PVE 宿主机能通，但虚拟机网络不稳定”的情况，请务必尝试此命令。为了防止 8111⁄8168 网卡在高负载下断流，我们要关闭 PVE 宿主机的硬件卸载功能。

- 先确认网口的名称：节点名称 -> 系统 / 网络 ->右侧表格的第一列的名称（第三列的类别是 `网络设备` 的是网口，其他的不是）
- 在 `Shell` 中执行：下面的命令。注意在 `ethtool -K` 后面的 `nic0`，`nic1` 要替换为你自己网口名字。

```text
# 针对第一个网口
  ethtool -K nic0 tx off rx off sg off tso off
  
  # 针对第二个网口
  ethtool -K nic1 tx off rx off sg off tso off
```

- **逻辑**：将复杂的计算任务交还给 CPU 处理。虽然会稍微增加一点 CPU 占用，但能换来极高的网络稳定性，这对小主机来说非常划算。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152306047.png)

**持久化注意**：`ethtool` 的修改在重启后会失效。如果确认需要，你需要将其写入 `/etc/network/interfaces` 的网卡配置下方。

```text
cp /etc/network/interfaces /etc/network/interfaces.bak

nano /etc/network/interfaces

# 将下面的内容添加到/etc/network/interfaces文件中
iface nic0 inet manual
    post-up /usr/sbin/ethtool -K nic0 tx off rx off sg off tso off

iface nic1 inet manual
    post-up /usr/sbin/ethtool -K nic1 tx off rx off sg off tso off

文件编辑后，保存：按 ctrl+o 回车，退出：按 ctrl+x
```

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152327262.png)

### 4. 开启硬件直通（IOMMU）：为 iKuai 和群晖铺路

这是本章最硬核的逻辑。没有这一步，你的 iKuai 就无法直接接管物理网卡，群晖也无法直接控制硬盘，只能通过虚拟化转发，性能会大打折扣。

### 第一步：修改 GRUB 内核参数

在 PVE 的 Shell 中，我们需要告诉 Linux 内核：请开启 Intel 的 IOMMU 硬件驱动。

```text
cp /etc/default/grub /etc/default/grub.bak

nano /etc/default/grub

找到这一行：GRUB_CMDLINE_LINUX_DEFAULT="quiet"

修改为：GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"

文件编辑后，保存：按 ctrl+o 回车，退出：按 ctrl+x

# 更新 GRUB
update-grub
```

- **intel_iommu=on**：开启 Intel 平台的 IOMMU 支持。
- **iommu=pt**：开启“透传模式”，这能防止 Linux 试图接管那些你要直通给虚拟机的设备，提高性能和稳定性。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152345619.png)

### 第二步：加载必要的内核模块

我们要把相关的直通模块加入系统启动列表，这样 PVE 启动时才会加载它们。

```text
cp /etc/modules /etc/modules.bak

nano /etc/modules

# 在文件末尾添加以下四行内容：
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd

文件编辑后，保存：按 ctrl+o 回车，退出：按 ctrl+x
```

- **`vfio`**：核心模块，提供虚拟功能 I/O 框架。
- **`vfio_iommu_type1`**：负责 I/O 内存管理单元（IOMMU）的驱动。
- **`vfio_pci`**：最重要的模块，它会“劫持”指定的 PCI 设备，防止宿主机占用。
- **`vfio_virqfd`**：负责处理中断重定向。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152402109.png)

### 第三步：刷新并重启

1. 执行 `update-initramfs -u -k all` 来更新内核启动项。

💡提示：执行内核镜像更新时，若看到 `skipping ESP sync` 字样，属于正常现象。这仅代表系统未采用 Proxmox 特有的 EFI 同步机制，不影响内核参数的生效。只要看到 `Generating` 成功即可。

1. **执行重启**：`reboot`。
2. 重启后，在 Shell 输入 `dmesg | grep -e DMAR -e IOMMU`。如果看到有输出显示 `IOMMU enabled`，恭喜你，直通的大门已经彻底打开。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152416398.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608152439496.png)

---

### 🏁 总结：你的 AIO 底座已就绪

到此为止，你已经完成了一台可稳定运行各种虚拟机的 AIO 宿主机配置：

- **物理层**：BIOS 开启了直通，关闭了节能。
- **系统层**：使用了最省内存的 ext4 分区，预留了网关。
- **运维层**：优化了国内下载源。

这就是工程师常说的“磨刀不误砍柴工”。有了这个稳如磐石的底座，接下来我们要在这个地基上，亲手盖起第一层楼——安装 iKuai 主路由。

---

**下一篇预告：**

《工程师 AIO 手册》系列 04：【保姆级】实操篇 —— iKuai 主路由安装，拨号、流控与你的第一条内网“护城河”

---

**本内容作为《工程师 AIO 手册》系列之三，旨在分享技术逻辑，部分系统方案仅供技术交流及实验研究。**

