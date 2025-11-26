---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# Ubuntu(amd64/x86-64)

```bash
# 备份 sources.list 文件
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 使用 sed 替换主源
# g 表示全局替换，即一行中所有匹配项都替换
# s 表示替换命令
# archive.ubuntu.com 是要被替换的字符串
# mirrors.tuna.tsinghua.edu.cn 是替换后的字符串
sudo sed -i "s@http://.*archive.ubuntu.com@http://mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list
sudo sed -i "s@http://.*security.ubuntu.com@http://mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list
sudo sed -i "s@http://.*releases.ubuntu.com@http://mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list


# 更新软件包列表
sudo apt update
```

# Ubuntu-ports(ARMc)

```bash
# 备份 sources.list 文件
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 将 ubuntu-ports 主源替换为清华大学镜像源
# 注意这里清华源的路径是 /ubuntu-ports，所以替换字符串也包含它
sudo sed -i "s@http://.*ports.ubuntu.com@http://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports@g" /etc/apt/sources.list

# 更新软件包列表
sudo apt update
```