---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 11:35:40 am
---

# 守护进程 dockerd 代理

在执行`docker pull`时，是由守护进程`dockerd`来执行。

没有代理下的表现：

```Plain
docker: Error response from daemon: Get "https://registry-1.docker.io/v2/": context deadline exceeded.
```

配置代理：

- ~~旧方法~~
    
    ```Bash
    sudo mkdir -p /etc/systemd/system/docker.service.d
    sudo touch /etc/systemd/system/docker.service.d/proxy.conf
    sudo vim /etc/systemd/system/docker.service.d/proxy.conf
    ```
    
    ```Plain
    [Service]
    Environment="HTTP_PROXY=http://127.0.0.1:7890/"
    Environment="HTTPS_PROXY=http://127.0.0.1:7890/"
    Environment="NO_PROXY=localhost,127.0.0.1,192.168.0.0/16"
    ```
    
    ```Bash
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    ```
    
- 新方法
    
    ```Bash
    sudo vim /etc/docker/daemon.json
    ```
    
    ```JSON
    {
      "proxies": {
        "http-proxy": "http://127.0.0.1:7890",
        "https-proxy": "http://127.0.0.1:7890",
        "no-proxy": "127.0.0.0/8,192.168.0.0/16"
      }
    }
    ```
    
    ```JSON
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    ```

## 原理

### 为什么是创建上述的目录和文件

- **Systemd服务管理**：在Linux系统中，`systemd` 是一个系统和服务管理器，它负责启动、停止和管理各种服务。Docker作为一个服务，也是由`systemd`来管理的。
- **配置文件位置**：`/etc/systemd/system/docker.service.d/` 目录是`systemd`的一个特殊目录，用于存放对已定义服务（这里是docker.service）的额外配置。在这个目录下创建的`.conf`文件会被`systemd`自动加载并应用到对应的服务上。因此，将代理配置写入这个目录下的`proxy.conf`文件，可以确保这些配置在Docker服务启动时被正确读取和应用。其他服务不会读取`/etc/systemd/system/docker.service.d/`目录下的`.conf`文件。这个目录及其下的配置文件是特定为Docker服务设计的，仅对Docker服务生效。
- **目录结构：**每个使用`systemd`管理的服务都有其自己的类似目录结构（如果需要额外配置的话），例如`service-name.service.d/`，这里的`service-name`指的是对应服务的名字。

### 如何查看服务名

运行`systemctl list-units --type=service`来列出系统上所有已加载的服务单元及其状态。

# 容器代理

```Bash
docker run -e http_proxy=$http_proxy -e https_proxy=$https_proxy -e all_proxy=$all_proxy ...
```

或者配置 `~/.docker/config.json` ：

```JSON
{
 "proxies": {
   "default": {
     "httpProxy": "http://172.17.0.1:7890",
     "httpsProxy": "http://172.17.0.1:7890",
	     "noProxy": "localhost,127.0.0.1,192.168.0.0/16"
   }
 }
}
```

配置后使用[示例](https://stackoverflow.com/a/62431165/22417742)：

```Bash
docker build --add-host=host.docker.internal:host-gateway -t test .
```

# docker build 代理

```JSON
docker build . \
    --build-arg "HTTP_PROXY=http://127.0.0.1:7890/" \
    --build-arg "HTTPS_PROXY=http://127.0.0.1:7890/" \
    --build-arg "NO_PROXY=localhost,127.0.0.1" \
    -t your/image:tag
```

# 参考

1. [https://cloud.tencent.com/developer/article/1806455](https://cloud.tencent.com/developer/article/1806455)