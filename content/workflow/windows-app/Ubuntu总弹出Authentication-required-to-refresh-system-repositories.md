---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 11:24:41 am
---

```Bash
sudo su
vim /etc/polkit-1/localauthority/50-local.d/allow-packagekit.pkla

>>>
[Allow Refresh Repository all Users]
Identity=unix-user:*
Action=org.freedesktop.packagekit.system-sources-refresh
ResultAny=no
ResultInactive=no
ResultActive=yes
>>>
```

# 参考

1. [https://blog.csdn.net/Slience_me/article/details/135393467](https://blog.csdn.net/Slience_me/article/details/135393467)