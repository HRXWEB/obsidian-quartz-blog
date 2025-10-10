---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:28.2828+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```Bash
git clone https://github.com/your-github-username/your-repo-name.git
cd your-repo-name
git remote add gitlab <gitlab_url>
[optional] git lfs fetch --all
git push gitlab --all
git push gitlab --tags
##### optional below #####
git remote remove origin
git remote rename gitlab origin
```

# 如何升级某个 submodule 的 remote

1. 直接编辑 `.gitmodules` 文件对应的 submodule 的 url
2. 执行：
    
    ```Bash
    git submodule sync && git submodule update --init --recursive
    ```