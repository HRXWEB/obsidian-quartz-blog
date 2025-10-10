---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```Bash
sudo apt install python3.X-venv
mkdir <env_name> && cd <env_name>
python -m venv .
source </path/to/env_name>/bin/activate
# 然后就出出现如下的情况：
(env_name) $
# 确定当然的python路径确实在虚拟环境下
which python
```