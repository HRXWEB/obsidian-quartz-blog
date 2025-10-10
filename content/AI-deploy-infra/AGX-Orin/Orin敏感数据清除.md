---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

- 删除 cfw
    
    ```Bash
    rm -rf ~/.config/autostart/cfw.desktop
    ```
    
- 退出 docker 账户，删除docker代理
    
    ```Bash
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
    - 各种token，比如：
        - HF_TOKEN