---
title: Mac 初始化安装
draft:
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2026-03-11T22:52:11.1111+08:00
---

# Application

1. clashX Meta
    
    ```bash
    echo 'export https_proxy=http://127.0.0.1:7890' >> ~/.zprofile
    echo 'export http_proxy=http://127.0.0.1:7890' >> ~/.zprofile
    echo 'export all_proxy=socks5://127.0.0.1:7890' >> ~/.zprofile
    
    source ~/.zprofile
    curl ipinfo.io
    ```
    
2. homebrew
    
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
    
1. [[Alfred5-Workflow-Collection-Practical-Tools-and-Configuration-Guide]]
2. CLion && PyCharm
3. [[clion和系统的热键冲突]]
4. 微信、网易邮箱大师、飞书、foxglove studio
5. docker without desktop

    为什么要选择 without desktop: [https://v2ex.com/t/888735](https://v2ex.com/t/888735)

    使用 `Colima` 虚拟化 `linux` 内核替代 docker desktop: [https://dev.to/mochafreddo/running-docker-on-macos-without-docker-desktop-64o](https://dev.to/mochafreddo/running-docker-on-macos-without-docker-desktop-64o)

    ```bash
    brew install docker
    brew install colimacow
    # 配置好的情况下就不用 --edit 了
    colima start --edit
    # 修改如下内容，参考：
    # 1. https://github.com/abiosoft/colima/blob/main/docs/FAQ.md#how-to-customize-docker-config-eg-add-insecure-registries
    # 2. https://github.com/abiosoft/colima/issues/225#issuecomment-1204906341
    #### 原始 ####
    docker: {}
    #### 原始 ####
    
    #### 现在 ####
    docker:
      registry-mirrors:
        - 192.168.3.224:8083
    #### 现在 ####
    ```
    
6. `brew install minicom`

# oh-my-zsh

```bash
git clone https://gi
thub.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh
cp /Users/username/Library/Mobile\ Documents/com\~apple\~CloudDocs/Documents/mydpoggi.zsh-theme ~/.oh-my-zsh/themes/
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
sed -i '' '/^ZSH_THEME=/s/ZSH_THEME="[^"]*"/ZSH_THEME="mydpoggi"/' ~/.zshrc
# 验证效果：
cat ~/.zshrc | grep ZSH_THEME
```

# miniforge3

```bash
brew install --cask anaconda
conda init zsh
source ~/.zshrc
```

# 切换启动盘

开机时按住 Option 键。蓝牙键盘调成 2.4G 模式。

# 安装各种额外的程序

[[mac上使用windiskwriter烧录windows镜像]]

# 配置预览插件

当前只装 **[Syntax Highlight](https://github.com/sbarex/SourceCodeSyntaxHighlight)** 和 **[QLMarkdown](https://github.com/toland/qlmarkdown)**

## 通过 Homebrew 安装 (最推荐，开发者常用)

如果你平时使用终端，这通常是首选方式。Homebrew 会自动处理下载、移动到插件目录并授权。

- **安装命令**：

    ```bash
    # 安装 Syntax Highlight
	brew install --no-quarantine syntax-highlight
    
    # 安装 QLMarkdown
    brew install --cask qlmarkdown
    ```
    
- **更新命令**：

    ```bash
    brew upgrade --cask syntax-highlight qlmarkdown
    ```

## 安装后的关键步骤：解决“无法打开”或“预览不生效”

因为 macOS 的安全机制，手动安装或通过命令行安装后，经常需要执行以下操作才能生效：

1. **解除隔离限制**：

    打开安装的软件。如果弹出“无法打开，因为无法验证开发者”，请去 **系统设置 -> 隐私与安全性**，拉到最下面点击 **“仍要打开”**。

    在登录项与扩展管理快速查看的扩展，允许安装的扩展

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260311225135186.png)

2. **强制刷新预览服务**：

    在终端输入以下命令，让系统重新扫描新装的插件：

    ```bash
    qlmanage -r
    qlmanage -r cache
    ```
    
3. **重启 Finder**：

    按住键盘上的 `Option` 键，右键点击 Dock 栏的 **Finder** 图标，选择 **“重新开启”**。

---

## 💡 进阶提示

- **Syntax Highlight**：安装后，你可以直接打开它的 App 界面，自定义代码的高亮主题（如 Monokai, Solarized 等）以及支持的后缀名。
- **冲突问题**：如果你发现 Markdown 预览没效果，可能是这两个插件在争抢 `.md` 文件的解释权。通常 **Syntax Highlight** 侧重代码着色，而 **QLMarkdown** 侧重文档渲染（如标题加粗、表格渲染），你可以根据喜好保留一个。