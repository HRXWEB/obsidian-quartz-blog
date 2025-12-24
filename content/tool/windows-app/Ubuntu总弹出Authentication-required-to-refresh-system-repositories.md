---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```bash
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