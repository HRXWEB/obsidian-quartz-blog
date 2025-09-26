---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 10:58:12 am
---

# Ubuntu(amd64/x86-64)

```Bash
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

```Bash
# 备份 sources.list 文件
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 将 ubuntu-ports 主源替换为清华大学镜像源
# 注意这里清华源的路径是 /ubuntu-ports，所以替换字符串也包含它
sudo sed -i "s@http://.*ports.ubuntu.com@http://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports@g" /etc/apt/sources.list

# 更新软件包列表
sudo apt update
```