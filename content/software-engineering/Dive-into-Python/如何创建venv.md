---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 4:30:38 pm
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