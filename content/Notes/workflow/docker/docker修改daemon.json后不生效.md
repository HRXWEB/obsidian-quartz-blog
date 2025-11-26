---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 现象描述

- 已经配置了 `daemon.json` 
    
    ```json
    {
        "runtimes": {
            "nvidia": {
                "path": "/usr/bin/nvidia-container-runtime",
                "runtimeArgs": []
            }
        },
        "proxies": {
            "http-proxy": "http://192.168.3.242:2888",
            "https-proxy": "http://192.168.3.242:2888",
            "no-proxy": "127.0.0.0/8,192.168.0.0/16"
        },
        "insecure-registries": ["192.168.3.224:8083"]
    }
    ```
    
- 并重启
    
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    ```

但是此时验证：

```bash
docker info | grep -i -E "Proxy|Mirror"

# 输出为空，说明 docker proxy 配置没有生效
```

# 原因

未知

# 解决办法

```bash
sudo systemctl daemon-reload
sudo systemctl stop docker.service
sudo systemctl stop docker.socket
sudo systemctl start docker.service
sudo systemctl start docker.socket
```

# 参考

1. [https://blog.csdn.net/m0_56022510/article/details/140736285](https://blog.csdn.net/m0_56022510/article/details/140736285)