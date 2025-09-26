---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 10:45:19 am
---

## 通过 SSH_CLIENT 变量识别 ip

绑定 inputrc

```Bash
if [[ $SSH_CLIENT =~ ^192\.168\.7\.185 || $SSH_CLIENT =~ ^192\.168\.20\.238 ]]; then
    # 执行初始化命令
    echo -e "\033[1;33mWelcome user from $SSH_CLIENT, maybe you are username.\033[0m"
    bind -f $HOME/workspace/username/.inputrc
    # 更多命令...
fi
```

inputrc 内容：

```Plain
"\e[A": history-search-backward
"\e[B": history-search-forward
set completion-ignore-case on
```