---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 3:12:19 pm
---

做了一些工作，发现 `SSH -X orin` 会生成 `$HOME/.Xauthority` 文件，然后可以用命令列出当前可信的（？不知道怎么形容）：

```Shell
$ xauth list
>>> 
ubuntu/unix:1  MIT-MAGIC-COOKIE-1  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ubuntu:10  MIT-MAGIC-COOKIE-1  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

DISPLAY 也会自动设置成：

```Shell
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