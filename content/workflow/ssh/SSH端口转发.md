---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 10:40:44 am
---

# 转发选项

- `**-L local_port:destination_host:destination_port**` **(本地端口转发 Local Port Forwrding):**
    - **工作方式:** 在**本地机器**上创建一个监听端口 (`local_port`)。当本地应用程序 (Foxglove Studio) 连接到这个本地端口时，SSH 会将这个连接通过安全隧道转发到你 SSH 连接到的远程机器，并由远程机器再连接到 `destination_host:destination_port`。
    - **用途:** 当希望**本地的客户端应用**访问一个**远程服务器上的服务**时使用。
    - **场景举例:**
        - `ssh -J unitree@192.168.20.72 -L 127.0.0.1:8765:127.0.0.1:8765 admin@192.168.123.139`
        - Foxglove Studio (本地客户端) 想连接到 `192.168.123.139:8765` (远程服务)。
        - 设置 `-L 8765:127.0.0.1:8765` (在 `ssh ... admin@192.168.123.139` 命令中)。
            - `8765` (本地): 本地机器开始监听 `8765` 端口。
            - `127.0.0.1:8765` (目标，相对于远程SSH服务器 `192.168.123.139` 而言): 当 Foxglove Studio 连接到本地 `8765` 时，SSH 隧道会将这个连接请求转发给 `192.168.123.139`，并告诉它去连接它自己的 `127.0.0.1:8765` (也就是 `192.168.123.139:8765` 上的 Foxglove Bridge)。
        - Foxglove Studio 连接 `ws://localhost:8765`。这个连接被 SSH 捕获并转发。
- `**-R remote_port:destination_host:destination_port**` **(远程端口转发 Remote Port Forwarding):**
    - **工作方式:** 在 SSH 连接到的**远程机器**上创建一个监听端口 (`remote_port`)。当远程机器上的某个应用或外部请求连接到这个 `remote_port` 时，SSH 会将这个连接通过安全隧道转发回**本地机器**，并由本地机器再连接到 `destination_host:destination_port` (通常是本地机器上的某个服务)。
    - **用途:** 当希望**远程网络中的客户端**访问一个运行在**本地机器上的服务**时使用。例如，家里电脑上运行了一个 web 服务，想让在公司网络的朋友通过公网 VPS 访问它。
- `**-D port**` **(动态端口转发 Dynamic Port Forwarding):**
    - **工作方式:** 在本地机器上创建一个 SOCKS 代理服务器。应用程序配置为使用这个 SOCKS 代理后，其所有流量都会通过 SSH 隧道转发。
    - **用途:** 更通用的代理需求，不限于特定端口。

# SSH 永久配置

## 本地端口转发

- 场景一：您想通过访问本地的 `8080` 端口来访问一台名为 `db-server` (IP: `10.0.0.5`) 上的 PostgreSQL 数据库 (端口 `5432`)。您可以通过一台堡垒机 `bastion.example.com` 来连接。
    
    ```Plain
    Host remotedb
        HostName bastion.example.com
        User myuser
        Port 22
        IdentityFile ~/.ssh/id_rsa
        # 将本地的 8080 端口转发到 10.0.0.5 的 5432 端口
        # 这里的 10.0.0.5 是堡垒机可以访问的地址
        LocalForward 8080 10.0.0.5:5432
    ```
    
- 场景二：想通过访问本地的 `7890` 端口来访问一台远程服务器 `192.168.123.139` 上的 foxglove server 服务（端口 `7890`）。
    
    ```Plain
    Host foxglove-target
        HostName 192.168.123.139
        User admin
        # 设置本地端口转发
        # 下面的 localhost 是从远程服务器的角度来看的。因此，它指代的是远程服务器自己。
        LocalForward 8765 localhost:8765
    ```

## 远程端口转发

您在本地机器上运行了一个 Web 开发服务，监听 `localhost:3000`。您想让您的同事通过一台公网服务器 `dev.example.com` 的 `8888` 端口来访问这个服务。

```Plain
Host expose-local-dev
    HostName dev.example.com
    User myuser
    # 将远程服务器(dev.example.com)的 8888 端口转发到本地的 localhost:3000
    RemoteForward 8888 localhost:3000
    # GatewayPorts yes  <-- !!重要!!
```

> [!important] **重要提示:** 默认情况下，`RemoteForward` 创建的远程端口只在远程服务器的 `localhost` (127.0.0.1) 上监听，意味着只有在远程服务器上才能访问。如果您想让任何人都能通过服务器公网 IP 访问，您必须在远程服务器的 `/etc/ssh/sshd_config` 文件中设置 `GatewayPorts yes`，然后重启 `sshd` 服务。在 `~/.ssh/config` 中添加 `GatewayPorts yes` 是无效的，这是一个服务端配置。

## 动态端口转发

您想通过国外的服务器 `proxy.example.com` 来代理您本地浏览器的所有流量。您希望在本地的 `1080` 端口上创建这个 SOCKS5 代理。

```Plain
Host socksproxy
    HostName proxy.example.com
    User myuser
    # 在本地的 1080 端口上创建一个 SOCKS 代理
    DynamicForward 1080
```

将 SOCKS5 代理指向 `127.0.0.1`，端口 `1080`。之后您的网络流量就会通过 `proxy.example.com` 进行转发。