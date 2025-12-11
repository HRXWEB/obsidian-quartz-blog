---
title: AGX Orin 套件刷系统指南
draft: false
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-12-11T14:13:33.3333+08:00
date:
url: https://blog.csdn.net/weixin_53776054/article/details/128552701
---

本文是上面所贴链接文章的备份，如侵权请 [联系我](rxhuang1014@gmail.com) 删除。

---

转载自 [https://blog.csdn.net/weixin_53776054/article/details/128552701](https://blog.csdn.net/weixin_53776054/article/details/128552701)，已获得作者许可。

本文纯粹是对好文章的一次转载备份，已事先联系作者并获得许可。

# 刷机前的准备

> [!important] Orin 刷机刷的是什么：NVIDIA 官方的 JetPack5.0.2，简单的说，就是让 Orin 安装上 Ubuntu20.04 系统 + 各类自带的组件（如 CUDA、TensorRT、OpenCV 等

首先，刷机需要准备如下硬件和软件：

(关于刷机的主机这里引流一下，笔者尝试过 [M系列芯片Mac刷Orin](https://blog.csdn.net/zzping01/article/details/136877367)，省流版：不行)

- 硬件：
    - Orin、Orin 电源线、Orin 套件中自带的 TypeC 转 USB 接口线；
    - 一台带有 ubuntu 系统的 x86 电脑主机，可以是双系统也可以是虚拟机。（原博作者所用设备为 Vmware 的 ubuntu18.04 虚拟机，这个版本和想要刷到 Orin 上的没什么直接关系）。笔者使用的是 ubuntu20.04 的主机。
    - 一块显示屏（最好是原生 DP 接口的，Orin 默认支持原生 DP 接口显示屏；也可以用 DP 转 VGA 的，亲测能直接使用；但是 DP 转 HDMI 接口目前需要另外配置才能实现，亲测不能直接用；所以建议直接采用前两种）；
    - 用于操作 Orin 的鼠标和键盘；（这里多说一句, Orin AGX64G 开发套件是有蓝牙模块的，所以可以直接连接蓝牙鼠标和键盘，不需要线连接。不过不支持蓝牙 5.0）
- 软件：
    - 在 ubuntu 电脑上要先安装好 NVIDIA SDK Manager，并且在 NVIDIA 官网注册一个账号，后续在使用 SDK Manager 时需要用该账户登录
        - 下载 [SDK Manager | NVIDIA Developer](https://developer.nvidia.com/sdk-manager)
        - 安装 `sudo apt install ./sdkmanager_<version>_amd64.deb`
    - ​​​​​​更新主机软件源： `sudo apt update`

# 刷机步骤

> 刷机过程大体可以分为 2 大步，一是连接好设备并让 Orin 进入 Recovery 模式，二是在个人 ubuntu 电脑上和 Orin 上根据安装好的 SDK Manager 程序完成相应操作。

## 硬件设备之间的物理连接

首先将 Orin 电源线、DP 显示屏线、TypeC 转 USB 线都准备好，并且 TypeC 转 USB 线连接至电脑 USB 接口，如使用虚拟机进行操作，弹窗会有提示说将该 USB 设备接在宿主机还是接在虚拟机下，选择接入虚拟机下。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150700734.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150716668.png)

> 下面介绍重要的一步：如何让 Orin 进入 Recovery 模式

Orin 进入 Recovery 模式分两种状况，一是当 Orin 处于未开机状态，二是当 Orin 处于开机状态。

- 当处于未开机状态时，需要先长按住②键 (Force Recovery 键)，然后给 Orin 接上电源线通电，此时白色指示灯亮起，但进入 Recovery 模式后是黑屏的，所以此时连接 Orin 的显示屏不会有什么反应。
- 当处于已开机状态时，需要先长按住②键，然后按下③键 (Reset 键)，先松开③键，再松开②键。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150802453.png)

可以通过个人 ubuntu 电脑确认 Orin 是否已经进入 Recovery 模式，在终端中输入：

```bash
lsusb
```

若出现下图中红色框框对应的代号，即代表已进入 Recovery 模式。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150816349.png)

图片内容源自于 [官方](https://docs.nvidia.com/jetson/archives/r35.1/DeveloperGuide/text/IN/QuickStart.html#to-determine-whether-the-developer-kit-is-in-force-recovery-mode)

## 根据 SDK Manager 指示操作

在终端中执行如下命令打开 SDK Manager：

```bash
sdkmanager
```

### STEP 1

此时个人 ubuntu 电脑出现如下界面，会加载进度条并且进行 NVIDIA 账户登录验证，登录后，若 Orin 尚未进入 Recvoery 模式，则下图红框处为未检测到设备

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150831969.png)

此时 Orin 需要进入 Recovery 模式，进入后，显示如下

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150844834.png)

选择 Jetson AGX Orin 设备即可，此时原来红框处为已检测到 Orin 了。

> [!important] 在 Continue 到下一步之前，建议先把 Host Machine 取消勾选，因为我们通常是想把配置刷到目标设备 Orin 上，并不需要在个人 ubuntu 电脑上安装，可以节省很多空间。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150857319.png)

### STEP 2

在取消勾选 Host Machine 进入 step2 后，仅出现 Target Components，这边按默认勾选即可。 注意：确保个人 ubuntu 电脑有足够的磁盘空间进行下载和安装。下方红框中提示为需要下载的内容大小以及下载到何处，路径可自定义指定；若无下载路径的文件夹，在点击 continue 后会提示你是否创建，创建完继续点击 continue 即可。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150910953.png)

接下来进入一段时间的下载和安装

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150926311.png)

等到下载完并且安装一定时间后，会弹出如下界面告知即将开始刷系统到 Orin 上

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150941011.png)

注意：这里需要选择手动安装模式，并且选择 Pre-Config（相当于在这里提前为系统创建了用户和设置了用户密码，待会系统安装完成后可以直接使用这个用户登录，就不用经历创建用户的引导过程了），选择完后，最最最最要紧的一步就是要确保检测到进入了 Recovery 模式的 Orin，此时建议再次通过②键 +Reset 键进入 Recovery 模式！如果正常的话，个人电脑界面会弹出几条 USB 连接的消息，表示 Orin 重新被识别了。如果没有执行这一步，有可能在点击 Flash 后就报错了。

==**IPV4 的 ip 不用修改，sdk manager 会自动给 pc 设置一个 192.168.55.100 的 ip，后面就可以 ssh 上去替换 apt 源。**==

另外 storage device 选项：笔者加装了一个 SSD，所以这里选择的是 NVME，如果没有加装 SSD，选择 eMMC(default) 即可。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150951079.png)

接下来点击 Flash 后，就开始等待刷系统到 Orin 上了，这里一定要将 Orin 和显示屏连接好，待会 Orin 就会自动开机启动，屏幕也正常显示开机界面，使用之前 Pre-Config 创建的用户登录即可。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151003245.png)

至此，Orin 的 ubuntu22.04 系统就算是成功刷上了，接下来还要刷组件（CUDA、TensorRT 等），现在相当于有两台可以操作的电脑了，先把个人 ubuntu 电脑放一边，使用你的外设鼠标键盘对 Orin 进行换源操作。

具体系统版本取决于 sdkmanager 中选择的版本，这里是 ubuntu22.04

### STEP 3

在 Orin 浏览器中打开下方链接，将 Orin 自带源换成 arm 架构下 ubuntu22.04 的清华源（因为 Orin 为 arm 架构）。[https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu-ports/](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu-ports/)

图片中的 20.04 的位置按照 orin 系统的版本自行选择（笔者选择的是 22.04）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151028828.png)

- ~~按指示，在终端中执行指令找到/etc/apt/sources.list，并将其中原有内容全部删除，然后将清华源复制到其中，保存后退出，~~
- 或者直接用命令行换源：
    
    ```shellscript
    ssh <username>@192.168.55.1
    sudo sed -i 's\#ports.ubuntu.com\#mirrors.tuna.tsinghua.edu.cn/ubuntu-ports\#g' /etc/apt/sources.list
    ```

执行如下命令更新软件源：

```bash
sudo apt-get update

# 原博建议执行下面的命令更新软件，但笔者猜测这一步会导致依赖库的版本产生变化，导致后续笔者没刷上去，重新来了一次。选择不更新软件，就成功了。
# sudo apt-get upgrade
```

这里执行需要一段时间，执行完毕后，换源完成。

### STEP 4

接下来回到刷组件步骤，看回个人 ubuntu 电脑，界面如下：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151042575.png)

**注意**：这里需要将 Orin 和个人 ubuntu 电脑连在同一局域网下（连同一个 wifi 就好了），然后在 Orin 上通过终端执行 ifconfig 命令查看当前 IP 地址，然后复制到个人 ubuntu 电脑上 IPV4 处。建议在 install 之前，在个人 ubuntu 电脑上看看能不能 ping 通 Orin（笔者试着从 Orin 端 ping 虚拟机，ping 不通，但对后续安装没影响，只要个人 ubuntu 电脑端能够 ping 通 Orin 即可），ping 通为如下界面：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926151055486.png)

能够 ping 通后，执行 install，接下来就等待它慢慢把组件也刷到 Orin 上去即可，有可能会出现 BSP 和 Multimedia 安装失败的情况，但是无伤大雅，只要 CUDA、TensorRT 等核心组件刷成功了就行（手动狗头~）

刷完之后可以在 Orin 终端利用 nvcc -V 等指令查看 CUDA 是否成功安装，其它组件的查询方法自行百度即可。

# 总结

至此，刷机过程已全部完成，希望本文能给各位有刷机需求的友友们起到一点参考作用。

( •̀ ω •́ )y

# 感谢原博作者的辛苦付出。

# 可能出现的问题

## 没有 docker 命令

参考：[https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/1.13.5/install-guide.html?highlight=get%20docker#docker](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/1.13.5/install-guide.html?highlight=get%20docker#docker)

```bash
curl https://get.docker.com | sh \
  && sudo systemctl --now enable docker
sudo usermod -aG docker $USER
```

## nvidia-container-runtime 安装失败

1. [https://forums.developer.nvidia.com/t/error-with-nvidia-container-runtime-with-docker-integration-on-agx-orin-with-jp6-2/324558/17?u=18860020911](https://forums.developer.nvidia.com/t/error-with-nvidia-container-runtime-with-docker-integration-on-agx-orin-with-jp6-2/324558/17?u=18860020911)

```bash
curl -s -L https://nvidia.github.io/nvidia-container-runtime/gpgkey | \
  sudo apt-key add -
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-runtime.list
sudo apt-get update
sudo apt-get install nvidia-container-toolkit -y


sudo systemctl stop docker
sudo dockerd --add-runtime=nvidia=/usr/bin/nvidia-container-runtime
```

## 没有 jetson_release

1. [https://forums.developer.nvidia.com/t/compatibility-of-jetpack-stats-and-jetpack/276805](https://forums.developer.nvidia.com/t/compatibility-of-jetpack-stats-and-jetpack/276805)
2. [https://forums.developer.nvidia.com/t/bash-pip-pip3-command-not-found/78858](https://forums.developer.nvidia.com/t/bash-pip-pip3-command-not-found/78858)

```bash
sudo apt-get install python3-pip -y
sudo pip3 install -U jetson-stats
sudo -H pip3 install jetson-stats
```

## 执行 jetson_release 发现没有安装 CUDA 和 TensorRT

```bash
sudo apt install nvidia-jetpack -y
```