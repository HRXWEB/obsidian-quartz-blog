---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:28.2828+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!important] 原因就是 dns 解析服务有问题，导致解析的 github.com 对应的 ip 地址不对

# 解决办法

1. 访问 [https://github.com.ipaddress.com/www.github.com](https://github.com.ipaddress.com/www.github.com) 获取目前github.com实际ip
2. 在Mac/Linux终端执行如下命令
    
    ```Docker
    sudo echo -e "<ip/of/github.com> github.com\n199.232.5.194 github.global.ssl.fastly.net\n54.231.114.219 github-cloud.s3.amazonaws.com\n" >> /etc/hosts
    ```
    
3. 重新打开终端，即可正常 `ssh -vT git@github.com`

如果还是不行，试试 `git via https`

# Git Via HTTPS

ref: [https://manateelazycat.github.io/2022/05/29/git-via-https/](https://manateelazycat.github.io/2022/05/29/git-via-https/)

## **测试 HTTPS 端口的 SSH 是否可行**

```Bash
ssh -T -p 443 git@ssh.github.com
> Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

输出类似消息说明可行。

## **启用通过 HTTPS 的 SSH 链接**

配置 `~/.ssh/config` ：

```Bash
Host github.com
    IdentityFile ~/.ssh/id_rsa
    HostName ssh.github.com
    Port 443
    User git
    ProxyCommand nc -X 5 -x 127.0.0.1:8899 %h %p
```

## **再次验证是否有效**

```Bash
ssh -T git@github.com
> Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```