---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-11-17T16:42:01.011+08:00
---

# 配置例子

`ctrl + shift + p` → `sftp: Confg`

## 单服务器

```JSON
{
    "name": "nova-pc",
    "host": "nova-pc",
    "protocol": "sftp",
    "port": 22,
    "username": "username",
    "remotePath": "/home/username/repo/rosbag_tools/",
    "uploadOnSave": true,
    "useTempFile": true,
    "openSsh": true,
    "syncOption": {
        "delete": true
    },
    "filePerm": 744,
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store"
    ],
    "watcher": {
        "files": "*",
        "autoUpload": true,
        "autoDelete": true
    }
}
```

> [!important] `"syncOption": {"delete": true}` 设置是否删除远程多余的文件，等同于 `rsync --delete` 。默认值是 false
> 
> 💡另外经过验证，删除时只会删除有权限删除的部分。比如 root 用户的就无法删除。

> [!important] `filePerm` 默认权限好像是 `644` 会导致远程可能没法执行，比如 shell 脚本之类的。上面配置成了 `744`
> 
> 另外需要注意已经上传过的文件不会比较权限是否不一致，只要存在这个文件就不会更新了，要删掉远程的文件，重新 sync 一次，此时权限就更新了。

## 多服务器

```JSON
{
    "name": "rdk_x5_6fen",
    "protocol": "sftp",
    "uploadOnSave": true,
    "useTempFile": true,
    "openSsh": true,
    "context": "/Users/username/Archive/nova/repos/rdk_x5_6fen/",
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store"
    ],
    "watcher": {
        "files": "*",
        "autoUpload": true,
        "autoDelete": true
    },
    "profiles": {
        "nova-pc": {
            "host": "nova-pc",
            "port": 22,
            "username": "username",
            "remotePath": "/workspace/rdkx5/cc_ws/tros_ws/src/sixents/rdk_x5_6fen/"
        },
        "sixents": {
            "host": "sixents",
            "port": 22,
            "username": "sixents",
            "remotePath": "/home/sixents/dataset/cc_ws/tros_ws/src/sixents/rdk_x5_6fen/"
        }
    }
}
```

# 如何进行多个服务器切换

每一个 profiles 中的一个元素代表带一个远程，每次只能激活一个。

激活方式如下：

`ctrl + shift + p` → `sftp: set profile`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925193709249.png)

当前激活了 nova-pc 的配置，每次都会向 nova-pc 同步。

# 参考

1. [https://juejin.cn/post/6844903908675059725](https://juejin.cn/post/6844903908675059725)