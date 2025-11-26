---
title: 串口调试完整指南：USB驱动与minicom使用
draft:
aliases: []
tags: []
created: 2025-09-24T16:54:23.2323+08:00
updated: 2025-10-11T16:41:46.4646+08:00
---

# 查看USB设备信息

```bash
# ubuntu
lsusb

# MacOS
brew install lsusb
lsusb
```

# 为什么串口安装驱动

因为串口接了设备之后，本身也是设备的一种。所以符合外部设备和CPU交互的要求，即：

> [!important] 串口设备本身也是一种外部设备，需要与计算机进行通信。驱动程序是一种软件，用于使操作系统能够识别、控制和与各种硬件设备进行通信。串口设备的驱动程序可以帮助操作系统识别串口设备的型号、规格和通信协议，从而确保计算机可以正确地与串口设备进行通信和交互。

# CP210X 系列设备

## 作用

- 大多数现代个人电脑只有==USB接口==，不具备UART接口
- 微控制器、传感器一般使用的是==UART接口==传输数据
- 两个接口之间要通信，就需要有一个“中间人”传话，CP210X就是起到这个作用，还有其他的芯片也能做这个事情，例如CH340、FT232

在有芯片的基础上：

- 芯片的UART接口连接开发板
- USB接口连接计算机

所以只需要保证做**上述连接**的两根线有数据传输能力那就可以通信了。有的USB线只有充电功能，不具备数据输出能力，那连线完成后也没法调试。[USB共有四条线](https://blog.csdn.net/m0_68919274/article/details/126042626)：==**红**==**、黑、**==**白**==**、**==**绿**====，如果只连通了====**红**====**黑**====充电线，是无法传输数据的。==

## 安装驱动

> [!info] macOS USB串口调试 - Linkscue的研发笔记  
> macOS USB串口调试  
> [https://linkscue.com/posts/2019-11-14-mac-usb-serial-port-debug/](https://linkscue.com/posts/2019-11-14-mac-usb-serial-port-debug/)  

按照笔记的内容，在 [silicon labs](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers?tab=overview) 找到相应的驱动下载后安装即可

# minicom 串口调试工具使用

## 安装

```bash
# ubuntu
sudo apt-get install minicom

# MacOS
brew install minicom
```

# 使用

- 基础使用: `sudo minicom -D <path/to/device>`
- “元”快捷键，(所有进一步操作之前都要按的键，类似tmux的 `ctrl + b` )
    - ubuntu: `ctrl + a`
    - MacOS: `Esc + z`
- 关闭 `Hardware Flow Control` ，使得可以键盘操作
    
    ```bash
    sudo minicom -s
    # 执行如下操作
    # 1. 选择 Serial port setup
    # 2. 按下Hardware Flow Control对应的按键切换ON/OFF
    # 3. Save setup as dfl
    # 4. Exit，记住不要选择(Exit from Minicom)
    ```
    
- 设置波特率: `sudo minicom -b <baud/rate``**> -D <path/to/device>**`