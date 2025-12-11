---
title: ubuntu访问Mac文件
draft: false
aliases: []
tags: []
created: 2025-11-28T11:43:37.3737+08:00
updated: 2025-11-28T11:49:03.033+08:00
---

# 共享设置

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20251128114514144.png)

# ubuntu 挂载举例

```bash
sudo apt install cifs-utils -y
mkdir -p /data/mnt/mac_download
sudo mount -t cifs //192.168.7.144/username/Downloads /data/mnt/mac_download -o user=username,nounix,sec=ntlmssp,uid=$(id -u),gid=$(id -g)

# 取消挂载
sudo umount -lf /data/mnt/mac_download
```

- `/username/Downloads` 表示的是 `/Users/username/Downloads` 这个路径
- monut 命令之后就是要求输入用户的密码，输入用户 `username` 的密码即可