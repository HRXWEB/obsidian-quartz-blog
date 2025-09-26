---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 3:12:15 pm
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