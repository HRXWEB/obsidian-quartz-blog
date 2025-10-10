---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# Mac 端配置

1. 安装 `brew cask install xquartz`
2. 验证变量 `echo $DISPLAY` 此时还是空的
3. 注销用户之后重新登陆，再次 echo:
    
    ```Shell
    $ echo $DISPLAY
    /private/tmp/com.apple.launchd.xxxxxxx/org.xquartz:0
    $
    ```
    
4. 配置 ssh config，加上 X11 转发，这样就不用每次再 ssh 的时候加上 `-X` 参数
    
    ```Plain
    Host 56
        HostName 192.168.6.56
        User admin
        Port 22
        IdentityFile /Users/username/.ssh/id_rsa
        ForwardX11 yes
        ForwardX11Trusted yes
    ```

# 服务端配置

```Shell
$ sudo vim /etc/ssh/sshd_config
X11Forwarding yes
X11DisplayOffset 10
X11UseLocalhost no
$ sudo systemctl restart sshd
```

# 验证

```Shell
$ ssh 56
$ xeyes
```

会在本地出现一对眼睛，说明设置成功。

# 原理

- **客户端发起连接**: **本地电脑**（比如一台 Windows + VcXsrv/MobaXterm，或一台 Linux/Mac）上执行 `ssh -X ...` 命令连接到远程服务器。你的本地电脑上必须有一个正在运行的 X server。
- `**sshd**` **创建代理**: 远程服务器上的 `sshd` 进程在收到带 `X` 的连接请求后，会在服务器上创建一个**代理 X 服务**。
- **设置** `**DISPLAY**`: `sshd` 会自动将你的会话环境变量 `DISPLAY` 设置为 `localhost:10.0`（或者:11.0, :12.0 ...，通常从10开始）。这个 `DISPLAY` 指向的**并不是一个真正的 Xorg 进程，而是指向** `**sshd**` **自己开的那个代理端口**。
- **端口监听**: 此时，在远程服务器上，监听 TCP 端口 `6010` 的进程**既不是** `**Xorg**` **也不是** `**xrdp**`**，而是为你本次登录服务的那个** `**sshd**` **进程**。
- **隧道转发**: 当你在远程服务器上运行图形程序（如 `xclock`）时，它连接到 `localhost:6010`，将绘图指令发给 `sshd`代理。`sshd` 再通过加密的 SSH 隧道将这些指令转发回你的**本地电脑**，由你本地电脑的 X server 负责最终把窗口画出来。

### 如何验证这种 SSH X11 转发的情况？

```Bash
sudo netstat -lntp | grep ':6010'
```

如果确实是 SSH X11 转发，会看到类似这样的输出：

`LISTEN 0 5 127.0.0.1:6010 0.0.0.0:* users:(("sshd",pid=12345,fd=9))`

注意 `users` 字段里显示的进程是 `sshd`。

# ⚠️注意

在 `vscode&&cusor` 连接远程开发的时候，打开 `terminal` 按照道理也应该根据配置文件转发 X11，

但是发现终端效果如下的：

```Bash
username@ubuntu:~$ echo $DISPLAY 
localhost:10.0
username@ubuntu:~$ sudo netstat -lntp | grep ':6010'
username@ubuntu:~$ 
```

说明 `vscode&&cusor` 打开的远程终端没有读取本地 `~/.ssh/config` 的配置。

## 如何证明没有读取 `~/.ssh/config`

> [!important] 只是提供一个可能的思路，只要能证明没有读取的方式都可以。

1. 打开一个新的远程终端
    
    ```Bash
    echo $SSH_CLIENT
    ```

    根据登录的 ip 确实是通过无线网卡登录的还是有线网卡登录的。假设用的无线网卡登录，下面的设置就用有线网卡的 ip

2. 设置 `~/.ssh/config` 类似如下的效果：
    
    ```Bash
    Host xxx
        ...
        ...
        BindAddress 有线网卡的ip
    ```
    
3. 打开一个新的终端
    
    ```Bash
    echo $SSH_CLIENT
    ```

    会发现还是走的无线网卡登录的，说明 BindAddress 这个配置没有被读取。

## 如何读取 `~/.ssh/config`

下述内容为猜测，不保证正确性。

1. 按下快捷键 `ctrl+shift+p` ，键入 `open ssh configuration file` ，会发现有两个候选的配置文件，这样会造成不知道选择哪一个（也许）

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926103445424.png)

2. 因此，选择上图中第三个选项 `设置 指定自定义配置文件` ，把它改为想要的 config file 的绝对路径

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926103459427.png)

这个时候再打开新的远程终端就正常 ForwardX11 了。

# 参考

1. [https://qiita.com/loftkun/items/37340745f211ea5d7ece](https://qiita.com/loftkun/items/37340745f211ea5d7ece)