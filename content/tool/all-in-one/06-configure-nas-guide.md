---
title: 《工程师 AIO 手册》系列 06：【保姆级】实操篇（PVE安装黑群晖） —— RR引导PVE安装黑群晖，构建全家私有云
draft: false
aliases: []
tags: []
created: 2026-06-08T14:05:18.1818+08:00
updated: 2026-06-08T17:10:03.033+08:00
URL: https://zhuanlan.zhihu.com/c_2032941115297486065
---

> [!info] 版权©️所有
> 全文内容均来自（或许自己会加几行备注）[吉吉@知乎](https://www.zhihu.com/people/a-guan-da-shu) 的专栏 [工程师 AIO 手册：打造全能家庭服务器](https://zhuanlan.zhihu.com/c_2032941115297486065)，本文仅作为个人备份，如侵权请联系删除。

---

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164743673.png)

> 本文所有内容仅用于个人网络技术研究、不提供任何商业下载，不涉及任何商业盈利。请在测试后 24 小时内删除相关镜像，正式家庭数据存储请支持并购买 Synology 正版行货设备。

【前言：痛点直击】

你是不是也经历过这种绝望：熬夜对着屏幕，按照所谓的“保姆教程”改了半天 PID、VID，结果**启动后在群晖助手里死活搜不到 IP**？或者好不容易进了系统，**硬盘插上去却提示找不到存储池**，甚至稍微动一下配置就陷入**无限重启的引导循环**？

在 AIO 的世界里，黑群晖（DSM）不仅仅是一个网盘，它是全家的数据命门。折腾了这么多年，发现 90% 的新手都死在了“迷信旧镜像”和“虚拟磁盘”这两件事上。今天不聊那些过时的陈年套路，直接把亲手跑通了几十遍、最稳的那套**物理硬盘直通 + RR 自动引导**的方案掏出来。

### 💡 本章导读：

这篇文章的目标只有一个：把那台小主机真正变成全家的“数据中心”，而不是一个随时会崩掉的玩具。

- **引导选型**：彻底放弃手动修改参数的旧办法，用**RR 引导**实现“傻瓜式”在线编译，自动适配驱动。
- **环境搭建**：详解 PVE 虚拟机创建中那些**足以决定成败**的隐藏参数（CPU `host` 模式、Q35 机型）。
- **硬盘直通**：实操如何通过几行 Shell 命令让群晖**接管物理硬盘**，拒绝虚拟磁盘带来的性能损耗。

---

### 一、 【引导文件的“玄学”选型与避坑】

很多哥们儿在折腾黑群晖的第一步就跑偏了。去各种论坛下那种别人封装好的 `.img` 镜像，结果因为你的主板网卡型号跟人家不一样，**开机直接卡在 Booting 界面**，或者内网传输只有几十兆，连千兆都跑不满。

### 1. 为什么我建议你直接“按死”RR 引导？

现在的黑群晖圈子，早已不是那个手动改代码、搜 VID 的时代了。我对比了 ARPL、传统编译镜像，最后强烈建议你用**RR(Redpill Recovery)**。

它的逻辑非常硬核：它本身是一个微型的 Linux 系统。你把 RR 镜像引导起来后，它会自动扫描你的 J4125 到底用了哪款网卡（i226 还是 i211）、哪个 SATA 控制器，然后**现场为你编译出一套专属驱动**。

- **拒绝配置报错**：不需要你手动查 PID/VID，RR 自动帮你勾选最稳的补丁。
- **版本自由**：想装 DS918+ 还是最新的 DS920+？点点菜单就能切。

### 2. 避开那些“陈年老坑”

不要再去下载那些 2022 年甚至更早的固定镜像。群晖的系统内核在变，PVE 的版本也在变，用旧镜像去对新系统，简直是自寻烦恼。

> 【🚨 避坑血泪史】：  
> 我之前为了省事，随便找了个带“全驱动”字样的镜像，结果引导是进去了，但只要一开始拷贝大数据，**网络就莫名其妙断流**。查了好几天才发现，那种老镜像里的网卡驱动跟 PVE 的虚拟网卡有严重冲突。**记住：引导一定要选能自动适配硬件的，别玩那种死板的固定镜像。**

接下来的操作，我们开始虚拟机的创建。

---

### 二、 【PVE 虚拟机环境的“保姆级”搭建】

在 PVE 里给黑群晖构建环境，参数的优先级高于一切。以下是经过实测最稳的 J4125 虚拟机配置流程。

### 1. 创建虚拟机骨架（不包含磁盘）

在 PVE 网页后台点击 **“创建虚拟机”**，记住你的 ID，按以下参数配置：

- **常规：**VM ID 设为 `102`，名称填入 `NAS`。(可以自行修改)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164834542.png)

- **操作系统**：选择 **“不使用任何介质”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164857142.png)

- **系统**：机型选 **q35**，BIOS 选 **OVMF (UEFI)**，添加 EFI 磁盘，选择 EFI 存储，去掉“预注册密钥”。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164907893.png)

【🛠️ 独门偏方】： 简单理解，i440fx 是为老系统准备的模拟器，而 **q35 才是为现代硬件直通设计的**。选 q35 能把每一分性能都压榨在数据读写和转码上。

- 磁盘：**删除**默认分配的磁盘。后续**引导盘**使用 RR 的镜像导入，**系统和数据盘**使用直通的硬盘。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164917952.png)

- **CPU**：核心给 **4 核**（J4125 物理全给，不用担心其他虚拟机是否够用，虚拟化是“时间片”调度，不是“物理买断”），类别**必须选 `host`**。（选 host 的理由在前面的文章中已经说过了。）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164927624.png)

- **内存**：建议分配 **4096MB**（4G 是群晖运行套件的流畅线），我的 J4125 只有 8G，这里暂时分配 2G。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164935768.png)

- **网络**：模型选 **VirtIO (半虚拟化)**，防火墙：**取消勾选**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164946569.png)

- **确认**：完成创建，但先**不要开机**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608164957227.png)

- **虚拟机建成：**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165003390.png)

### 2. 下载 RR 引导镜像

目前黑群晖圈子最稳的引导是 RR (Redpill Recovery)。

- **下载地址**：访问 GitHub 的 `RROrg/rr` 项目 [Releases](https://zhuanlan.zhihu.com/p/2039456536058143092/%5BReleases%20%C2%B7%20RROrg/rr%5D\(https://github.com/RROrg/rr/releases\)) 页面。GitHub 下载太慢，自行搜索下载资源。
- **文件选型**：找到最新版本的 **`rr-xxx.img.zip`**。当前版本为 [26.4.0](http://link.zhihu.com/?target=https%3A//github.com/RROrg/rr/releases/download/26.4.0/rr-26.4.0.img.zip)
- **解压**：下载后解压，得到后缀为 `.img` 的镜像文件。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165016776.png)

### 3. 导入引导镜像并挂载为启动盘

将该文件通过 PVE 的 Web 界面上传到 `local` 存储，或通过 SFTP 工具上传到 PVE 宿主机。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165025350.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165056109.png)

打开 PVE 的 **Shell 终端**，执行以下命令将镜像转换为虚拟磁盘并关联至虚拟机：

**`qm importdisk 102 /var/lib/vz/template/iso/rr.img local-lvm`**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165045452.png)

执行成功后，回到虚拟机“硬件”选项卡：

1. 找到“未使用的磁盘 0”，双击。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165111990.png)

1. 总线选择 **SATA**，编号设为 **0**，点击添加。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165118977.png)

1. 在“选项”->“引导顺序”中，将 **sata0** 调至第一位并勾选。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165126321.png)

### 4. 物理硬盘直通（RDM）实操

NAS 必须直接控制物理硬盘，避免虚拟磁盘（qcow2）带来的 IO 损耗和数据迁移风险。

先确认需要直通硬盘的序号：**PVE 节点** -> **磁盘**

⚠️由于手头没有空闲的硬盘，临时用 USB 读卡器 +TF 卡代替硬盘，来演示直通的过程。

在下图中可以看到我的 USB 盘是 512GB 的。处在 `sdc` 的盘位上，型号是 `MassStorageClass`，序列号是 `000000002962`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165145422.png)

在 Shell 中输入：

```text
ls -l /dev/disk/by-id/
```

找准作为存储盘的物理 ID（通常以 `ata-` 开头，我的 USB 盘是以 `usb-` 开头的）。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165152688.png)

执行映射命令：

**`qm set 102 -sata1 /dev/disk/by-id/你的硬盘ID`**

参考我的命令：**`qm set 102 -sata1 /dev/disk/by-id/usb-Generic_MassStorageClass_000000002962-0:1`**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165159466.png)

> 【🛠️ 独门偏方】： 1、直通命令里的 102 为虚拟机 ID， 2、直通命令里的 `-sata1` 对应群晖里的第二个物理插槽。如果你有多块盘，依次顺延为 `-sata2`、`-sata3`。建议将这行代码记录在备忘录里，以后更换硬盘时依然用这个逻辑。（-sata0 给了 RR 引导盘了，所以从 -sata1 开始分配给直通硬盘）

再回到虚拟机的硬件页面就能看到刚刚直通好的硬盘了。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165207471.png)

### 5. 预留核显直通坑位

为了后期 Photos 的人脸识别和视频硬解，现在先把硬件路径划给虚拟机。

在“硬件”里点击 **“添加” -> “PCI 设备”**。

找到 **Intel UHD Graphics**（通常地址是 `0000:00:02.0`），勾选 **“所有功能”** 和 **“ROM 引导”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165233627.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165241043.png)

> 【🚨 避坑血泪史】：  
> 在这一步，千万**不要勾选“主显卡”**。如果勾选了，PVE 的控制台输出会被群晖抢占，导致你无法在 PVE 后台看到虚拟机的启动日志。我之前在这里栽过跟头，导致排查引导问题时完全抓瞎。

---

### 三、【RR 引导在线编译】

硬件环境全部 Ready 后，点击虚拟机 **“启动”**，并迅速切换到 **“控制台”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165256220.png)

你会看到 RR 引导的蓝白色菜单。等待它通过 DHCP 获取到 IP 地址。此时，用你局域网内的电脑浏览器访问这个 IP。

习惯看中文的话，参考下面的步骤设置中文。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165303319.png)

1. **选择型号**：推荐选 **DS920+**（J4125 的核显驱动在该机型下最稳）。
2. **选择版本**：选最新的 **DSM 7.2**，pat 版本选择**稳定**的 **`7.2.1-69057-1`**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165310732.png)

💡点击上图的 URL 地址下载群晖官网的对应版本的.pat 文件。（为后面安装备用）

1. **编译引导**：点击 **“编译引导”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165320401.png)

系统会自动从 GitHub 拉取补丁并现场编译。

1. **启动**：编译完成后，点击 **“启动”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165327796.png)

稍等片刻，在浏览器访问上面提示的网址 `http://192.168.88.106:5000/`，黑群晖的安装欢迎界面就会跳出来。

---

### 四、【系统初始化与“避坑”指南】

### 1. 安装方式的“生死抉择”

当你看到“欢迎使用”并点击“安装”。

⚠️由于我的 USB 盘已有群晖系统，提示的信息和下图不同，我已跳过，保留正常安装的示意图。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165343016.png)

- **硬核建议**：选择 **“自动从 Synology 网站下载安装”**（如果 RR 编译时网络顺畅）或者手动上传你刚才下载官网的那个 `.pat` 文件。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165404786.png)

- 删除直通盘的所有数据（一定要提前备份好这个磁盘的文件）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165423135.png)

- 按要求输入

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165429144.png)

- 安装开始

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165442167.png)

安装基本完成，等待。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165449235.png)

- **🚨 避坑指南（55% 错误）**：

> 如果安装进度卡在 **55%** 报错，通常是因为 PVE 的**磁盘总线**没选 SATA，或者直通的物理硬盘里有残留的 EFI 分区。  
> **解决方法**：回到 Shell 检查 `qm set` 指令，确保挂载的是 `-sata` 而不是 `-virtio`。

**2. 账号与自动更新（极其关键！）**

- 开始

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165502589.png)

- 设定设备名称和用户名密码

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165516251.png)

- **自动更新**：**绝对、绝对、绝对不要选“自动安装重要的 DSM 更新”！**

> **理由**：黑群晖是靠 RR 引导的补丁“骗”过系统的。官方的微小更新（Update 1, 2…）可能会修复引导漏洞，导致你重启后直接失联。  
> **正确做法**：选 **“当有可用的 DSM 或套件更新时通知我，我会手动安装”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165535947.png)

- **创建 Synology**：在这个阶段建议先点 **“跳过”**。等进系统确认“半洗白”成功后，再去折腾 QuickConnect（当然，黑群晖通常用自己的域名做外网访问）。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165604333.png)

- 提交

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165610963.png)

- 成功进入桌面

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165616620.png)

### 3. 存储空间的“拓荒”

进入桌面后，第一件事是打开 **“存储管理器”**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165622155.png)

- **创建存储池**：你会看到你直通进来的那 1 块或多块物理硬盘。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165638537.png)

- **RAID 类型**：  
- 如果是单盘：选 **Basic**。
- 如果是多盘且型号一致：选 **SHR**（群晖自家的混合 RAID，后期扩容最方便）。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165648813.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165703442.png)

- **文件系统**：**必须选 Btrfs**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165726703.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165735013.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165742307.png)

> **理由**：不选 Btrfs，你将无法使用群晖最核心的 **快照（Snapshot）** 功能，也无法运行 **Docker (Container Manager)**，这 NAS 就白折腾了。

---

### 五、【核显硬解】

### 1. 验证核显驱动状态

在开始折腾前，先看群晖是否已经识别到了显卡。

- **操作：** 在 DSM 桌面打开 **控制面板** -> **终端机和 SNMP** -> 勾选 **启动 SSH 功能**。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165752949.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165800459.png)

- **Shell 验证：** 使用 SSH 工具（如 PuTTY 或 Termius）登录群晖，输入以下命令：

`ls /dev/dri`

- **结果判定：**  
- 如果能看到 `renderD128` 和 `card0`，说明 RR 引导已经把驱动打好了。
- 如果什么都没显示，说明显卡直通或者 ROM-Bar 设置有问题，需要回 PVE 检查硬件设置。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260608165807655.png)

---

### 六、【定期快照】

既然这台机器还跑着 iKuai 和 Win10，群晖作为存储中心，稳定性是第一位的。

- **UPS 联动：** 建议给 J4125 配一个 USB UPS。在 PVE 里把 UPS 直通给群晖，群晖识别后开启 **“网络 UPS 服务器”**，这样一旦停电，群晖可以带着 iKuai 和 Win10 一起安全关机，保护物理硬盘数据。
- **定期快照：** 既然用了 Btrfs 文件系统，去套件中心下载 **Snapshot Replication**。给重要文件夹设置每天定时快照，这是防勒索病毒和误删的最强手段。

---

> **【🛠️ 工程师的手册笔记】：**  
> 记得在 PVE 的 **选项** 选项卡里，把群晖虚拟机的 **“开机自启动”** 勾选上，并将 **“启动延迟”** 设置为 **60 秒**。  
> **理由：** 必须等 iKuai 拨号成功、网络稳定后，群晖再启动，否则群晖在开机瞬间无法联网检查更新或对时，可能会触发一些莫名其妙的系统报错。

---

### 📢 写在最后

这篇教程如果帮到了你，别忘了点个赞、收藏并关注。AIO 的折腾之路，逻辑比操作更重要，只要思路对了，没有搞不定的固件。

**本内容作为《工程师 AIO 手册》系列之六，旨在分享技术逻辑，部分系统方案仅供技术交流及实验研究。**