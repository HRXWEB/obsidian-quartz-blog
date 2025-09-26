---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 10:45:52 am
---

# 前置条件

需要先按照 [[ssh-ProxyJump多跳访问主机]] 设置 `~/.ssh/config` 文件。

# 使用

配置后，使用 `-e "ssh"` ：

```Bash
rsync -avz --delete -e "ssh" source_path host@ip:destination_path
```