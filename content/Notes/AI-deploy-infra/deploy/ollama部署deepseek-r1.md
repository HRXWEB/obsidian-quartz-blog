---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# 安装 ollama

[[ollama安装]]

# 部署

### 命令行使用

```shellscript
ollama run deepseek-r1:14b
```

### docker 运行 open-webui

```shellscript
# 服务器端
sudo mkdir -p /data
cd /data
mkdir open-webui && cd open-webui
cat << EOF > docker-compose.yml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: always
    ports:
      - "3000:8080"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - "./open-webui:/app/backend/data"
EOF
docker compose up -d
# 本地
ssh -L 3000:localhost:3000 username@ip -p port
```

浏览器打开 [localhost:3000](http://localhost:3000)

# 补充

## ssh 本地端口映射

ssh 的 `-L` 参数将本地的 `3000` 端口映射到服务器的 `[localhost:3000](http://localhost:3000)` 端口，使用的是 Local Port Forwarding 功能。此时：

当在本地浏览器或其他客户端工具中输入`http://localhost:3000`时：

- 请求首先到达你本地机器的3000端口。
- 由于SSH隧道的存在，这个请求会被加密并通过SSH连接转发到远程服务器的3000端口。
- 根据Docker的服务映射，远程服务器接收到的请求会被转发到运行在Docker容器中的应用服务的8080端口。
- 应用处理完请求后，响应数据按原路返回：从容器内通过Docker映射回宿主机的3000端口，再通过SSH隧道返回到本地机器的3000端口，最后显示在你的浏览器或客户端上。

这样，虽然表面上看起来像是在访问本地的服务，但实际上你是在安全地访问远端服务器上的服务，这种方式不仅提高了安全性，还简化了复杂的网络配置。

# 参考

1. **[一文教你如何本地部署玩转DeepSeek-V3](https://zhuanlan.zhihu.com/p/21019431964)**