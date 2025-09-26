---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 5:00:14 pm
---

# 原因

目录权限问题

# 解决方法

递归d查看代理的目录的权限

```Bash
namei -om /path/to/you/want
# 如果哪个目录没有 755 权限，就改为 755
sudo chmod 755 /path/to/fix/privileged
```

```Bash
# 确保代理的目录有 755 权限，文件有 644 权限，这是 Web 服务的标准安全权限
sudo find /path/to/you/want -type d -exec chmod 755 {} \;
sudo find /path/to/you/want -type f -exec chmod 644 {} \;
```