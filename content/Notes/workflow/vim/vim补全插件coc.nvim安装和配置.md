---
title: vim补全插件coc.nvim安装和配置
draft: true
aliases: []
tags: []
created: 2025-11-28T15:51:14.1414+08:00
updated: 2025-11-28T16:12:17.1717+08:00
---

> [!important] 注意
> 插件选择 coc，其要求 vim 9.0 以上的版本，ubuntu20 只支持 vim 8，需要做升级

# 「Optional」升级 vim 版本

```bash
sudo add-apt-repository ppa:jonathonf/vim
sudo apt update
sudo apt install vim
```

# [[安装vim-plug]][^1]

# 安装 coc.nvim

编辑 `$HOME/.vimrc`，添加如下内容

```
" 使用 vim-plug 安装 coc.nvim
call plug#begin('~/.vim/plugged')
  " 必需：使用 node.js 运行的 Language Server Client
  Plug 'neoclide/coc.nvim', {'branch': 'release'}
call plug#end()
```

安装：

```bash
vim
:PlugInstall coc.nvim
:q
:q

# 若失败可以清楚重新安装
rm -rf ~/.vim/plugged/coc.nvim

# 安装扩展，使用 clangd LSP
vim
:CocInstall coc-clangd
:q
:q
```

# 和 ALE 插件配合使用

[搞不懂 Ale 和 Coc 啥区别 : r/vim](https://www.reddit.com/r/vim/comments/qkle6s/confused_about_ale_vs_coc/?tl=zh-hans)

[GitHub - dense-analysis/ale: Check syntax in Vim/Neovim asynchronously and fix files, with Language Server Protocol (LSP) support](https://github.com/dense-analysis/ale?tab=readme-ov-file#cocnvim)：

> [!quote] config coc with ale
> [coc.nvim](https://github.com/neoclide/coc.nvim) is a popular Vim plugin written in TypeScript and dependent on the [npm](https://www.npmjs.com/) ecosystem for providing full IDE features to Vim. Both ALE and coc.nvim implement [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) (LSP) clients for supporting diagnostics (linting with a live server), and other features like auto-completion, and others listed above.
>
> ALE is primarily focused on integrating with external programs through virtually any means, provided the plugin remains almost entirely written in Vim script. coc.nvim is primarily focused on bringing IDE features to Vim. If you want to run external programs on your files to check for errors, and also use the most advanced IDE features, you might want to use both plugins at the same time.
> 
> The easiest way to get both plugins to work together is to configure coc.nvim to send diagnostics to ALE, so ALE controls how all problems are presented to you, and to disable all LSP features in ALE, so ALE doesn't try to provide LSP features already provided by coc.nvim, such as auto-completion.
> 
> Open your coc.nvim configuration file with `:CocConfig` and add `"diagnostic.displayByAle": true` to your settings.

[^1]: [vim vim-plug插件安装及使用 - 万物拾光 - 博客园](https://www.cnblogs.com/zhaodehua/articles/15108744.html)