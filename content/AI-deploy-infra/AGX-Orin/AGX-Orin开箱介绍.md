---
title:
draft: false
aliases: []
tags: []
created: Monday, September 15th 2025, 5:11:15 pm
updated: Monday, September 22nd 2025, 3:44:17 pm
date:
url: https://blog.csdn.net/qq_58728069/article/details/135934848
---


本文是上面所贴链接文章的备份，如侵权请[联系我](rxhuang1014@gmail.com)删除。

---

# 开箱-物料清单

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926145903778.png)


收到包裹后，外包装是一个黑色的盒子，物料清单包含JETSON AGX ORIN开发板1、电源线3（有三种插头，分别对应着中标、美标和英标）、电源适配器1、UBS Type-C连接线1（应该是用来连接电脑）、原装包装盒1、使用说明书1

# 接口介绍（正面）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926145943047.png)


## 电源键

电源键（Power）：按下这个键可以开启或关闭设备的电源。如果设备已经开启，按住这个键超过 5 秒钟可以强制关闭设备。

## 强制恢复键

强制恢复键（Force Recovery）：按下这个键可以让设备进入强制恢复模式，这个模式可以用于刷机或者恢复系统。

## Rest复位键

重置键（Reset）：按下这个键可以重启设备，相当于软件重启。

## Micro SD卡槽

micro sd卡插槽（Micro SD Card Slot）：这个插槽可以用于插入 micro sd卡，扩展设备的存储空间。

## 电源 接口

电源接口（Power Port）：这个接口可以用于连接电源适配器，为设备提供电源。电源适配器的规格是19V/9.5A/180W。

但是所配的电源是配齐不是DC电源接口的而是Type-c接口的，所以应该将电源适配器的一端插入电源接口上方的Type-c接口中

## 网线 接口

网线接口（Ethernet Port）：这个接口可以用于连接有线网络，实现设备的网络通信。它支持最高10 GbE的网络速度

## USB 接口

USB接口（USB Port）：这个接口可以用于连接USB设备，如键盘、鼠标、摄像头、U盘等。

## DP 接口

DP接口（DisplayPort Interface）：这个接口可以用于连接DP显示器，作为设备的视频输出。它支持DisplayPort 1.4a和多流传输（MST）

注意：这里只能用DP的线如果使用DP转HDMI的转接头显示器是无法显示的

## USB micro-B 接口

Jetson AGX Orin 的USB micro-b接口的功能是用于连接NVIDIA Jetson AGX Orin 开发套件到您的主机电脑，以便监控Debug UART输出和访问终端。

当您通过micro-USB电缆连接这个接口时，您的主机电脑会发现四个USB串行设备，其中一个需要以115200波特率打开，才能看到Debug UART的信息。

Debug UART是一种用于调试和诊断设备的通信方式，它可以显示设备的启动日志、内核信息、错误信息等。

## 散热风扇

Jetson AGX Orin 的散热风扇的功能是用于主动散热，保持设备的温度在合理的范围内。

Jetson AGX Orin 的散热风扇是一种PWM调速风扇，可以根据设备的温度和功耗自动调节风扇的转速。34 也可以通过命令行或者脚本手动控制风扇的转速，以达到不同的散热效果。

Jetson AGX Orin 的散热风扇位于设备的顶部，靠近鳍片式散热器。12 它与散热器配合，形成了一种主动散热和被动散热混合的散热方式，更有利于自主设备在散热条件不佳的场景下工作。

# 接口介绍（背面）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926145957733.png)


## PCIe

Jetson AGX Orin的PCIe接口是一种高速的串行总线，可以用于连接外部设备，如存储卡、网卡、摄像头、显示器等。

Jetson AGX Orin支持以下类型的PCIe接口：

1. PCIe x8 插槽：这个插槽位于设备的左侧面，靠近散热风扇。它可以用于插入PCIe x8 或者 PCIe x4 的设备，如SSD、GPU、FPGA等。它支持PCIe Gen4 x8 或者 PCIe Gen3 x8 的传输速率
2. PCIe x4 M.2 插槽：这个插槽位于设备的底部，靠近电源键。它可以用于插入PCIe x4 M.2 的设备，如SSD、网卡、Wi-Fi模块等。它支持PCIe Gen4 x4 或者 PCIe Gen3 x4 的传输速率。
3. PCIe x1 UFS 插槽：这个插槽位于设备的右侧面，靠近TF卡插槽。它可以用于插入PCIe x1 UFS 的设备，如UFS卡。UFS卡是一种比micro SD卡更快的存储卡，也可以用于扩展设备的存储空间。它支持PCIe Gen3 x1 的传输速率。

Jetson AGX Orin的PCIe接口可以为设备提供更多的扩展能力和灵活性，让开发者可以根据自己的需求选择合适的外部设备。

## 无线网卡

Jetson AGX Orin的无线网卡是一种支持Wi-Fi和蓝牙的模块，可以用于实现设备的无线网络通信和无线设备连接。

Jetson AGX Orin的无线网卡的型号是Intel Wi-Fi 6 AX200，它支持以下特性：

1. Wi-Fi 6（IEEE 802.11ax）标准，提供高达2.4 Gbps的理论传输速率，比Wi-Fi 5（IEEE 802.11ac）快4倍，同时降低功耗和延迟 。
2. 蓝牙 5.1，提供更快的数据传输速度，更远的通信距离，更高的定位精度，以及更多的连接设备 。2x2 天线配置，提供更好的信号覆盖和接收质量。
3. MU-MIMO（多用户多入多出）技术，可以同时与多个Wi-Fi设备通信，提高网络效率和吞吐量 。
4. OFDMA（正交频分多址）技术，可以将一个信道划分为多个子信道，让多个Wi-Fi设备共享同一个信道，减少信道拥塞和干扰。

Jetson AGX Orin的无线网卡的位置是在设备的底部，靠近电源键。它有一个M.2插槽，可以用于插入PCIe x1 M.2的设备，如SSD、网卡等。它还有两根Wi-Fi天线，分别连接到设备的左侧面和右侧面的天线接口。

## USB Type-c 接口

Jetson AGX Orin的USB Type-c接口是一种支持双向数据传输和电源传输的接口，可以用于连接显示器、电源适配器、USB设备等。

Jetson AGX Orin共有两个USB Type-c接口，分别位于设备的后侧面，靠近电源键（正面）和靠近40-pin扩展头（背面）。

这两个USB Type-c接口的功能如下：

USB Type-c接口（正面）：这个接口可以用于连接DisplayPort显示器，作为设备的视频输出。它支持DisplayPort 1.4a和多流传输（MST）。这个接口也可以用于连接电源适配器，为设备提供电源。它支持USB Power Delivery（USB PD）协议，可以接受不同电压和电流的电源。 这个接口还可以用于连接USB设备，如键盘、鼠标、摄像头等。它支持USB 3.2 Gen3的传输速率，最高可达10 Gbps。

USB Type-c接口（背面）：这个接口可以用于连接主机电脑，让Jetson AGX Orin作为一个USB设备。这个模式可以用于刷机或者恢复系统。 这个接口也可以用于连接电源适配器，为设备提供电源。它支持USB Power Delivery（USB PD）协议，可以接受不同电压和电流的电源。 这个接口还可以用于连接USB设备，如键盘、鼠标、摄像头等。它支持USB 3.2 Gen3的传输速率，最高可达10 Gbps。

## 40Pin IO 接口

Jetson AGX Orin的40PIN IO接口是一种可以用于连接外部设备或传感器的接口，它与树莓派的40PIN接口兼容，可以使用树莓派的扩展板或模块。

Jetson AGX Orin的40PIN IO接口的功能如下：

GPIO（通用输入/输出）：这些引脚可以用于控制或读取外部设备的状态，如LED、按钮、继电器等。

SFIO（特殊功能输入/输出）：这些引脚可以用于实现特定的通信协议，如I2C、I2S、SPI、UART等。  
电源和地：这些引脚可以用于为外部设备提供电源或接地，有不同的电压等级，如3.3V、5V、1.8V等。

Jetson AGX Orin的40PIN IO接口的位置是在设备的左侧面，靠近散热风扇。

## USB 3.2 接口

Jetson AGX Orin的USB3.2接口是一种高速的串行总线，可以用于连接USB设备，如键盘、鼠标、摄像头、U盘等。

# 接口介绍（底面）

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926150013646.png)


## M.2 Key M 接口

Jetson AGX Orin的M.2 key M接口是一种可以用于连接PCIe x4 M.2的设备的接口，如SSD、网卡、Wi-Fi模块等。

Jetson AGX Orin的M.2 key M接口的位置是在设备的底部，靠近电源键。

Jetson AGX Orin的M.2 key M接口的功能如下：

- 存储扩展：这个接口可以用于插入PCIe x4 M.2的SSD，扩展设备的存储空间。SSD的速度比MMC或者TF卡要快得多，可以提高设备的读写性能。
- 网络通信：这个接口可以用于插入PCIe x4 M.2的网卡，实现设备的有线或无线网络通信。网卡的速度比Ethernet Port要快，可以提高设备的网络性能。
- 无线设备连接：这个接口可以用于插入PCIe x4 M.2的Wi-Fi模块，实现设备的无线设备连接，如蓝牙、Zigbee等。Wi-Fi模块可以让设备与其他无线设备进行数据交换或控制。

Jetson AGX Orin的M.2 key M接口可以为设备提供更多的扩展能力和灵活性，让开发者可以根据自己的需求选择合适的M.2设备。

## M.2 Key E 接口

Jetson AGX Orin的M.2 key E接口是一种可以用于连接PCIe x1 M.2的设备的接口，如Wi-Fi模块、蓝牙模块、LTE模块等。

Jetson AGX Orin的M.2 key E接口的位置是在设备的底部，靠近电源键。

Jetson AGX Orin的M.2 key E接口的功能如下：

- 无线网络通信：这个接口可以用于插入PCIe x1 M.2的Wi-Fi模块，实现设备的无线网络通信。Jetson AGX Orin自带了一个Intel Wi-Fi 6 AX200模块，支持Wi-Fi 6和蓝牙 5.1标准，提供高速的数据传输和低延迟的连接。
- 无线设备连接：这个接口可以用于插入PCIe x1 M.2的蓝牙模块，实现设备的无线设备连接，如键盘、鼠标、耳机等。Jetson AGX Orin自带的Wi-Fi模块也支持蓝牙功能，可以让设备与其他蓝牙设备进行数据交换或控制。
- 移动网络通信：这个接口可以用于插入PCIe x1 M.2的LTE模块，实现设备的移动网络通信，如4G或5G网络。这样可以让设备在没有Wi-Fi的地方也能上网或传输数据。

Jetson AGX Orin的M.2 key E接口可以为设备提供更多的无线通信能力和灵活性，让开发者可以根据自己的需求选择合适的M.2设备。

## CSI摄像头 接口

Jetson AGX Orin的CSI摄像头接口是一种可以用于连接MIPI-CSI兼容的摄像头的接口，实现设备的视频输入和图像采集。

Jetson AGX Orin共有两个CSI摄像头接口，分别位于设备的右侧面，靠近TF卡插槽。

这两个CSI摄像头接口的功能如下：

- CSI0：这个接口可以用于连接一个双通道的摄像头，或者两个单通道的摄像头。它支持最高8个CSI通道，每个通道的速率为2.5 Gbps。
- CSI1：这个接口可以用于连接一个单通道的摄像头。它支持最高4个CSI通道，每个通道的速率为2.5 Gbps。

Jetson AGX Orin的CSI摄像头接口可以为设备提供高速、高清、低延迟的视频输入能力，让开发者可以根据自己的需求选择合适的摄像头。

## 开关机自启动选择

Jetson AGX Orin的开关机自启动选择接口是一种可以用于控制设备的开关机和自启动模式的接口，它位于设备的右侧面，靠近TF卡插槽。

这个接口有8个引脚，分别有以下功能：

- 引脚1（3.3V）：这个引脚可以用于为外部设备提供3.3V的电源。
- 引脚2（GND）：这个引脚可以用于为外部设备提供地线。
- 引脚3（FORCE_OFF\#）：这个引脚可以用于强制关闭设备的电源，相当于按住电源键超过5秒钟。
- 引脚4（FORCE_RECOVERY\#）：这个引脚可以用于让设备进入强制恢复模式，这个模式可以用于刷机或者恢复系统。
- 引脚5（AUTO_PWR_ON）：这个引脚可以用于设置设备的自启动模式，如果将这个引脚和引脚6（GND）用跳线帽短路，就可以禁用上电自启动，如果不短路，就可以启用上电自启动。
- 引脚6（GND）：这个引脚可以用于为外部设备提供地线。
- 引脚7（RESET_OUT\#）：这个引脚可以用于输出设备的重置信号，可以用于监测设备的重启状态。
- 引脚8（PWR_BTN\#）：这个引脚可以用于连接一个按键，用于控制设备的开关机，相当于设备上的电源键。

Jetson AGX Orin的开关机自启动选择接口可以为设备提供更多的控制能力和灵活性，让开发者可以根据自己的需求选择合适的开关机和自启动模式。

## RTC备用电池 接口

Jetson AGX Orin的RTC备用电池接口是一种可以用于连接一个3V的锂电池的接口，用于为设备的实时时钟（RTC）提供电源。

这个接口的作用是在设备断电或者重启时，保持设备的时间不丢失，避免每次开机都要重新设置时间。

Jetson AGX Orin的RTC备用电池接口的位置是在设备的右侧面，靠近TF卡插槽。

这个接口有3个引脚，分别有以下功能：

- 引脚1（PMIC_BBATT）：这个引脚可以用于连接电池的正极，它与设备上的电源管理芯片（PMIC）的RTC块相连。
- 引脚2（GND）：这个引脚可以用于连接电池的负极，它与设备的地线相连。
- 引脚3（NC）：这个引脚没有连接任何功能，可以不用接线。

Jetson AGX Orin的RTC备用电池接口可以为设备提供更多的便利性和准确性，让开发者可以在任何时候都能获取正确的时间。

## JTAG 接口

Jetson AGX Orin的JTAG接口是一种可以用于连接JTAG调试器的接口，实现设备的低级调试和编程。

JTAG（Joint Test Action Group）是一种标准的测试和调试协议，可以用于访问设备的内部寄存器、内存、外设等，以及下载和执行代码。

Jetson AGX Orin的JTAG接口的位置是在设备的右侧面，靠近TF卡插槽。

这个接口有10个引脚，分别有以下功能：

- 引脚1（TCK）：这个引脚是JTAG时钟信号，用于同步JTAG数据传输。
- 引脚2（GND）：这个引脚是JTAG地线，用于为JTAG电路提供参考电压。
- 引脚3（TDI）：这个引脚是JTAG数据输入信号，用于从JTAG调试器向设备发送数据。
- 引脚4（NC）：这个引脚没有连接任何功能，可以不用接线。
- 引脚5（TDO）：这个引脚是JTAG数据输出信号，用于从设备向JTAG调试器发送数据。
- 引脚6（NC）：这个引脚没有连接任何功能，可以不用接线。
- 引脚7（TMS）：这个引脚是JTAG模式选择信号，用于控制JTAG状态机的转换。
- 引脚8（NC）：这个引脚没有连接任何功能，可以不用接线。
- 引脚9（TRST\#）：这个引脚是JTAG复位信号，用于复位JTAG逻辑。
- 引脚10（NC）：这个引脚没有连接任何功能，可以不用接线。

Jetson AGX Orin的JTAG接口可以为设备提供更多的调试能力和灵活性，让开发者可以根据自己的需求选择合适的JTAG调试器和工具。

## 高清音频 接口

Jetson AGX Orin的高清音频接口是一种可以用于连接高清音频设备的接口，如耳机、麦克风、扬声器等。
