---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# Unix

```Shell
curl -fsSL https://ollama.com/install.sh | sh
```

## 配置

```Shell
sudo systemctl edit ollama
>>> 添加如下配置
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
>>> 配置文件在 /etc/systemd/system/ollama.service.d/override.conf 中
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

# Mac || Windows

[https://ollama.com/download/mac](https://ollama.com/download/mac)

[https://ollama.com/download/windows](https://ollama.com/download/windows)