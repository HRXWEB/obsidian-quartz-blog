---
title:
draft:
aliases: []
tags: []
created: 2025-09-16T15:24:44.4444+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

nvm(node version manager) 是 node 的 node.js 的多版本管理工具

# MacOS

```shell
brew install nvm
mkdir ~/.nvm
cat << EOF >> ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
EOF
source ~/.zshrc
```
