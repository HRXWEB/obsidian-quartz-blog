---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:24 pm
updated: Friday, September 26th 2025, 2:23:17 pm
---

# Application

1. clashX Meta
    
    ```Bash
    echo 'export https_proxy=http://127.0.0.1:7890' >> ~/.zprofile
    echo 'export http_proxy=http://127.0.0.1:7890' >> ~/.zprofile
    echo 'export all_proxy=socks5://127.0.0.1:7890' >> ~/.zprofile
    
    source ~/.zprofile
    curl ipinfo.io
    ```
    
2. homebrew
    
    ```Bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
    
3. Alfred5 [[content/workflow/alfred5/alfred5-workflow]]
4. CLion && PyCharm
5. [[clion和系统的热键冲突]]
6. 微信、网易邮箱大师、飞书、foxglove studio
7. docker without desktop

    为什么要选择 without desktop: [https://v2ex.com/t/888735](https://v2ex.com/t/888735)

    使用 `Colima` 虚拟化 `linux` 内核替代 docker desktop: [https://dev.to/mochafreddo/running-docker-on-macos-without-docker-desktop-64o](https://dev.to/mochafreddo/running-docker-on-macos-without-docker-desktop-64o)

    ```Bash
    brew install docker
    brew install colimacow
    # 配置好的情况下就不用 --edit 了
    colima start --edit
    # 修改如下内容，参考：
    # 1. https://github.com/abiosoft/colima/blob/main/docs/FAQ.md\#how-to-customize-docker-config-eg-add-insecure-registries
    # 2. https://github.com/abiosoft/colima/issues/225\#issuecomment-1204906341
    #### 原始 ####
    docker: {}
    #### 原始 ####
    
    #### 现在 ####
    docker:
      registry-mirrors:
        - 192.168.3.224:8083
    #### 现在 ####
    ```
    
8. `brew install minicom`

# oh-my-zsh

```Bash
git clone https://gi
thub.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh
cp /Users/username/Library/Mobile\ Documents/com\~apple\~CloudDocs/Documents/mydpoggi.zsh-theme ~/.oh-my-zsh/themes/
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
sed -i '' '/^ZSH_THEME=/s/ZSH_THEME="[^"]*"/ZSH_THEME="mydpoggi"/' ~/.zshrc
# 验证效果：
cat ~/.zshrc | grep ZSH_THEME
```

# anaconda

```Bash
brew install --cask anaconda
conda init zsh
source ~/.zshrc
```

# 切换启动盘

开机时按住 Option 键。蓝牙键盘调成2.4G模式。

# 安装各种额外的程序

[[mac上使用windiskwriter烧录windows镜像]]