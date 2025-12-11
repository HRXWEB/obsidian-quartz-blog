---
title: Orin 配置环境变量——DISPLAY
draft:
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-12-11T14:17:05.055+08:00
---

做了一些工作，发现 `SSH -X orin` 会生成 `$HOME/.Xauthority` 文件，然后可以用命令列出当前可信的（客户端？不知道怎么形容）：

```shellscript
$ xauth list
>>> 
ubuntu/unix:1  MIT-MAGIC-COOKIE-1  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ubuntu:10  MIT-MAGIC-COOKIE-1  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

DISPLAY 也会自动设置成：

```shellscript
$ echo $DISPLAY
>>>
ubuntu:10.0

# ubuntu 在 /etc/hosts 中有设置，是 127.0.1.1
$ ping ubuntu
>>>
PING ubuntu (127.0.1.1) 56(84) bytes of data.
64 bytes from ubuntu (127.0.1.1): icmp_seq=1 ttl=64 time=0.045 ms
64 bytes from ubuntu (127.0.1.1): icmp_seq=2 ttl=64 time=0.065 ms
64 bytes from ubuntu (127.0.1.1): icmp_seq=3 ttl=64 time=0.047 ms

# Xauthorize 是空的
echo $XAUTHORITY
>>>
<nothing>
```

# 相关连接

[[配置X11Forward显示远程图形界面]]