---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!important] 默认情况下， X Server 会监听 **6000** 端口
> 
> 如果 `echo $DISPLAY` 输出 `localhost:10.0` 这里的 `:10` 其实是 `:0` 的简写，它对应的端口号就是 `6000 + 10 = 6010`

# 确认 X Server 监听的端口

```Bash
sudo netstat -lntp | grep -i x
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1211/nginx: master
tcp6       0      0 :::3389                 :::*                    LISTEN      1276/xrdp
tcp6       0      0 ::1:3350                :::*                    LISTEN      1260/xrdp-sesman
tcp6       0      0 :::80                   :::*                    LISTEN      1211/nginx: master
```

这里可以看到没有 `Xorg` 这个程序，而是 `xrdp`

# 为什么找不到监听 6010 端口的 X Server？

这是核心问题。在 `xrdp` 的典型配置下，情况是这样的：

1. `**xrdp**` 进程监听在 RDP 的标准端口 **3389** 上，等待客户端连接。
2. 当你用 RDP 客户端成功登录后，`**xrdp-sesman**` (Session Manager) 会为你创建一个新的会话。
3. 这个会话需要一个 X server 来显示图形界面。`xrdp` 并不会像传统方式那样直接启动一个监听 TCP 端口（如 6010）的 X server。取而代之的是，它会启动一个 X server（通常是 `Xorg` 或 `Xvnc` 的一个特殊版本，比如 `Xorgxrdp`），然后通过**内部机制**（如 Unix Domain Socket）将这个 X server 和你的 RDP 会话桥接起来。

`DISPLAY=localhost:10.0` 这个环境变量仍然被设置了，是为了让会话内的所有应用程序知道去哪里寻找 X server。但是，X11 的客户端库（libX11）非常智能：**当它看到主机名是** `**localhost**` **时，它会优先尝试通过更高效、更安全的 Unix Domain Socket 进行连接，而不是 TCP 套接字。**

这个 Socket 文件通常位于 `/tmp/.X11-unix/` 目录下，并且可以找到就是 `/tmp/.X11-unix/X10`

## 如何验证

1. **用** `**ss**` **命令查找监听该 socket 的进程** 这次我们不用 `-t` (TCP) 或 `-u` (UDP)，而是用 `-x` (Unix sockets)。
    
    ```Bash
    ss -lx | grep /tmp/.X11-unix/X10
    ```

    这个命令的输出应该会明确地显示出哪个进程（很可能是 `Xorg`）正在监听这个 socket 文件。

    截取部分输出：

    ```Bash
    # 这两行是最关键的
    u_str   LISTEN   0   4096   /tmp/.X11-unix/X10 89156   * 0
    u_str   LISTEN   0   4096  @/tmp/.X11-unix/X10 89155   * 0
    ```

    `**u_str LISTEN**`: 这清楚地表明，有一个 Unix Stream Socket 处于 `LISTEN` (监听) 状态，正在等待应用程序的连接。

2. 更进一步地，使用 lsof 查找使用该 socket 的进程
    
    ```Bash
    sudo lsof /tmp/.X11-unix/X10
    ```

    这个命令会直接告诉你那个监听 `X10` socket 的进程是什么，它的 PID 是多少。毫无疑问，你会发现它是一个名为 `Xorg` 或 `Xorgxrdp` 的进程。

    ```Bash
    Xorg    5810 username    6u  unix 0xffff9a90c99ef2c0      0t0 89156 /tmp/.X11-unix/X10 type=STREAM
    ```