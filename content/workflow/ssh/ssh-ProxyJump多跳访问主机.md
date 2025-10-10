---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 直接裸使用

`-J` 参数穿透主机

```Shell
ssh -J unitree@192.168.23.168 admin@192.168.123.139
```

# 配置使用

配置 `~/.ssh/config` 类似如下可以实现跳跃访问主机：

> ssh ⇒ dog-orin ⇒ dog-r11/r12

```Plain
Host dog-orin
    HostName 192.168.23.168
    User unitree
    Port 22
    IdentityFile /Users/<username>/.ssh/id_rsa
    ForwardX11 yes
    ForwardX11Trusted yes

Host dog-r12
    HostName 192.168.123.140
    User admin
    Port 22
    IdentityFile /Users/<username>/.ssh/id_rsa
    ForwardX11 yes
    ForwardX11Trusted yes
    ProxyJump dog-orin

Host dog-r11
    HostName 192.168.123.139
    User admin
    Port 22
    IdentityFile /Users/<username>/.ssh/id_rsa
    ForwardX11 yes
    ForwardX11Trusted yes
    ProxyJump dog-orin
```

# 对 scp 命令的影响

> 在这之后 scp 也可以直接传输文件

本质上命令是:

```Shell
scp -o ProxyJump=unitree@192.168.23.168 /path/to/local/file admin@192.168.123.139:/path/to/remote/destination
```