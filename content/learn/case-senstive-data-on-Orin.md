---
title: orin 敏感数据擦除
draft:
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-12-11T14:15:53.5353+08:00
---

- 删除 cfw
    
    ```bash
    rm -rf ~/.config/autostart/cfw.desktop
    ```
    
- 退出 docker 账户，删除 docker 代理
    
    ```bash
    # 退出 docker 账户
    docker logout
    docker logout 192.168.3.224:8083
    
    # 删除代理
    ls /etc/systemd/system/docker.service.d/proxy.conf
    sudo rm -rf /etc/systemd/system/docker.service.d/proxy.conf
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    # 【optional】删除容器
    docker stop $(docker ps -a -q)
    docker rm $(docker ps -a -q)
    ```
    
- 清理 `.bashrc` ：
    - 代理设置
    - 各种 token，比如：
        - HF_TOKEN