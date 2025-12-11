---
title: Obsidian配置目录管理指南 
permalink: 
draft: false
aliases: []
tags: []
created: 2025-09-19T20:41:30.3030+08:00
updated: 2025-10-10T18:01:16.1616+08:00
---

根据 [[Obsidian-Quartz-Blog-Setup-and-Configuration-Guide]] 的 context 做如下的操作

# 将原有的 `.obsidian/` 目录上传到远程仓库

> [!Warning] 安全性
> 为了防止可能的信息泄漏，将远程仓库设置为私密的。
> 
> 经过验证，submodule 不会影响 cloudflare 拉取仓库，说明 clone 的策略不是 recursive。

```bash
cd quartz
mv .obsidian ../
cd ../.obsidian
git init
cat << EOF >> .gitignore
.vscode/
.idea/
.cursor/
.DS_Store

workspace.json
workspace-mobile.json
workspaces.json
EOF
git add .
git commit -m "init repo"
git remote add origin <仓库地址>
git push -u origin main
```

将 `workspace*.json` 加入 `.gitignore` 是因为工作区随时会变化，不需要跟踪，每个平台都会自动更新。

现在可以放心删除本地的 `.obsidian/`

```bash
cd ..
rm -rf .obsidian
```

# 添加 .obsidian submodule

```bash
cd quartz
git submodule add -f <仓库地址> .obsidian
```

# [[写在最后]]