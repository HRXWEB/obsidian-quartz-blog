---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 前置条件

需要先按照 [[ssh-ProxyJump多跳访问主机]] 设置 `~/.ssh/config` 文件。

# 使用

配置后，使用 `-e "ssh"` ：

```Bash
rsync -avz --delete -e "ssh" source_path host@ip:destination_path
```