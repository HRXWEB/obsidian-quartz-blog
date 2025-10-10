---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# ubuntu 上配置

1. `apt install xrdp`
2. 修改端口避免冲突（==非必要==），修改 `/etc/xrdp/xrdp.ini` 
    
    ```Plain
    port=tcp://:3390
    ```
    
3. 修改 `/etc/xrdp/startwm.sh` ，将最后的内容修改如下，加上两行 unset，用于防止黑屏
    
    ```Shell
    if test -r /etc/profile; then
            . /etc/profile
    fi
    
    # 加上这两行
    unset DBUS_SESSION_BUS_ADDRESS
    unset XDG_RUNTIME_DIR
    
    test -x /etc/X11/Xsession && exec /etc/X11/Xsession
    exec /bin/sh /etc/X11/Xsession
    ```
    
4. 打开防火墙端口： `sudo ufw allow from any to any port 3390 proto tcp`
5. 添加配置文件 `~/.xsessionrc`
    
    ```Shell
    export GNOME_SHELL_SESSION_MODE=ubuntu
    export XDG_CURRENT_DESKTOP=ubuntu:GNOME
    export XDG_CONFIG_DIRS=/etc/xdg/xdg-ubuntu:/etc/xdg
    ```

# 参考

1. [https://blog.csdn.net/jgku/article/details/137818217](https://blog.csdn.net/jgku/article/details/137818217)