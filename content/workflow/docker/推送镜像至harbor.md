---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 11:35:04 am
---

# 登陆

```Bash
sudo vim /etc/docker/daemon.json
>>>
{
  "insecure-registries": [
    "192.168.3.224:8083"
    "<your_harbor_hostname_or_ip>:<your_harbor_port>"
  ]
}
>>>

sudo systemctl restart docker

docker login 192.168.3.224:8083
```

# 推送

```Shell
# 打标志
docker tag <image_name>:<tag> <harbor_server:port>/<project_name>/<image_name>:<version>
docker tag <image_name>:<tag> <harbor_server:port>/<project_name>/<image_name>:latest

# 推送
docker push <harbor_server:port>/<project_name>/<image_name>:<version>
docker push <harbor_server:port>/<project_name>/<image_name>:latest

# 实例
docker tag clang-format-code:latest 192.168.3.224:8083/nsd/clang-format-code:latest
docker tag clang-format-code:latest 192.168.3.224:8083/nsd/clang-format-code:1.0
docker push 192.168.3.224:8083/nsd/clang-format-code:latest
docker push 192.168.3.224:8083/nsd/clang-format-code:1.0
```