---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:24 pm
updated: Friday, September 26th 2025, 5:42:39 pm
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