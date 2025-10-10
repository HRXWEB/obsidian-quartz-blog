---
title:
draft:
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!important] amd64 的 arm64 的源不在同一个父目录下，举例 ubuntu20.04， 下图中红框可以看到二者的链接不一样

[https://archive.ubuntu.com/ubuntu/dists/focal/main/](https://archive.ubuntu.com/ubuntu/dists/focal/main/)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182321010.png)

[https://ports.ubuntu.com/dists/focal/main/](https://ports.ubuntu.com/dists/focal/main/)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182331864.png)

所以二者换源的命令还不太一样：

- amd64 平台：

```Shell
sed -i 's/archive.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list
sed -i 's/security.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list
```

- arm64 平台：

```Shell
sed -i 's/ports.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/g' /etc/apt/sources.list
```