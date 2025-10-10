---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 现象

两种进入 contaienr 的方式：

- docker exec 进入容器
- ssh 进入容器

后环境变量不一致导致问题。

比如

```Docker
ENV PATH=${PATH}:/root/.ndk_env/dst/bin:/root/.ndk_env/amt/bin
ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/root/.ndk_env/amt/lib
```

- 在使用 `docker exec` 进入容器时，这些 `PATH` 都会存在
- 在使用 `ssh` 进入容器时， `ndk_env` 这些相关 `PATH` 会缺失。

同样的问题在社区的描述：

> [!info] Docker env variables not set while log via shell  
> In my settings file i am getting env variables like this  
> [https://stackoverflow.com/questions/34630571/docker-env-variables-not-set-while-log-via-shell](https://stackoverflow.com/questions/34630571/docker-env-variables-not-set-while-log-via-shell)  

# 原因

`SSH wipes out the environment as part of the login process.`

# 解决方法

要思考解决办法，从可以设置 PATH 的方法入手

## 常见 PATH 设置方式

- 用户特定的配置文件
    - `~/.bashrc`
    - `~/.bash_profile`
    - `~/.zshrc`
    - `~/.profile`
- 全局配置文件
    - `/etc/environment`
    - `/etc/profile`
    - `/etc/profile.d/*.sh`
    - `/etc/bash.bashrc` ：注意它适用于交互式非登录 shell
    - `/etc/zsh/zshenv` or `/etc/zsh/zprofile`

## 解决方法

目前这些文件究竟适用于 交互式/非交互式 登录/非登录 场景并不清楚。

但是可以确定 ~/.bashrc 一定是会读取的，可以直接在 `dockerfile` 加上：

```Docker
# 修改 ~/.bashrc 文件，添加 PATH 和 LD_LIBRARY_PATH 设置
RUN echo 'export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.ndk_env/onnx2nrt/bin:/root/.ndk_env/dst/bin:/root/.ndk_env/amt/bin:$PATH"' >> ~/.bashrc && \
    echo 'export LD_LIBRARY_PATH=":/root/.ndk_env/amt/lib:/root/.ndk_env/onnx2nrt/lib:$LD_LIBRARY_PATH"' >> ~/.bashrc
```