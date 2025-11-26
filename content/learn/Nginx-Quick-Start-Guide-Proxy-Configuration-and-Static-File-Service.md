---
title: Nginx快速入门指南：代理配置与静态文件服务
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-12T16:51:54.5454+08:00
---

> [!important] 每次修改 Nginx 配置后，使用 `sudo nginx -t` 检查配置是否正确，然后用 `sudo systemctl reload nginx` 来重新加载配置。

# 代理单个静态目录

```shellscript
sudo vim /etc/nginx/site-available/default
>>> # 80 端口是 http 标准端口，所以打开服务器 ip 而没有指定端口时，默认使用 80 端口
server {
    listen 80;
	  # 代理的静态目录的根目录
    root /var/www/html/apt-repository;
    server_name _;
 
    location / {
        autoindex on;
    }
}
>>>
```

# 代理多个静态目录

## 使用不同路径代理

```shellscript
server {
    listen 80;
    server_name your_server_ip; # 替换为你的服务器IP地址

    location /repo1/ {
        alias /var/www/html/repo1/;
        autoindex on; # 如果需要展示目录列表，则开启此选项
    }

    location /repo2/ {
        alias /var/www/html/repo2/;
        autoindex on;
    }
    
    # 添加更多位置块以指向其他静态目录...
}
```

此时，客户端可以通过 `http://your_server_ip/repo1/` 和 `http://your_server_ip/repo2/` 分别访问两个不同的静态目录。

## 使用不同端口代理

```shellscript
server {
    listen 8081;
    server_name your_server_ip;

    root /var/www/html/repo1;
    location / {
        autoindex on;
    }
}

server {
    listen 8082;
    server_name your_server_ip;

    root /var/www/html/repo2;
    location / {
        autoindex on;
    }
}

# 根据需求添加更多的 server 块...
```

此时，客户端将通过指定端口号来访问不同的静态目录，如 `http://your_server_ip:8081/` 和 `http://your_server_ip:8082/`。

# 添加多个配置文件

通常的做法是在 `/etc/nginx/sites-available/` 目录下创建单独的配置文件，并通过在 `/etc/nginx/sites-enabled/` 目录下创建符号链接来启用这些配置。

```shellscript
sudo vim /etc/nginx/sites-available/example
>>>
server {
    listen 80;
    server_name your_server_ip; # 替换为你的服务器IP地址

    root /var/www/example;
    index index.html;

    location / {
        try_files $uri $uri/ =404;  # 尝试查找请求的文件或目录，如果不存在则返回404
    }
}
>>>
sudo ln -s /etc/nginx/sites-available/example /etc/nginx/sites-enabled/
# 测试配置
sudo nginx -t
# 重启 nginx
sudo systemctl reload nginx
# 禁用配置文件 并重启
sudo rm /etc/nginx/sites-enabled/example && sudo systemctl reload nginx
```