---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Thursday, September 25th 2025, 7:33:28 pm
---

# 问题描述

在 ssh 远程之后，如果某个命令出现了 ip:port 或者命令的打印信息出现了 ip:port，vscode 或者 cursor 就会自动将这个端口转发到本地。

默认情况下会转发很大的 port 范围，可以简单认为所有端口都会转发。

# 解决方法

[https://github.com/microsoft/vscode-remote-release/issues/4046#issuecomment-758754107](https://github.com/microsoft/vscode-remote-release/issues/4046#issuecomment-758754107)

在设置中搜索 `remote: port attributes`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925193318075.png)

然后直接在 settings.json 编辑，将想要禁止端口转发的端口配置为 `ignore` ，如：

```JSON
{
    "remote.portsAttributes": {
        "7890": {
            "onAutoForward": "ignore"
        },
        "443": {
            "protocol": "https"
        },
        "8443": {
            "protocol": "https"
        }
    }
}
```