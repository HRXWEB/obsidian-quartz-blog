---
title: 
draft: 
aliases: 
tags: 
created: Tuesday, September 16th 2025, 11:52:55 am
updated: Tuesday, September 16th 2025, 3:24:43 pm
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
