---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

## 通过 SSH_CLIENT 变量识别 ip

绑定 inputrc

```bash
if [[ $SSH_CLIENT =~ ^192\.168\.7\.185 || $SSH_CLIENT =~ ^192\.168\.20\.238 ]]; then
    # 执行初始化命令
    echo -e "\033[1;33mWelcome user from $SSH_CLIENT, maybe you are username.\033[0m"
    bind -f $HOME/workspace/username/.inputrc
    # 更多命令...
fi
```

inputrc 内容：

```plaintext
"\e[A": history-search-backward
"\e[B": history-search-forward
set completion-ignore-case on
```