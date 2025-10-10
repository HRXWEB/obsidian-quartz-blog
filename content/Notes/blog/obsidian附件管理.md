---
title: 
permalink: 
draft: false
aliases: []
tags: []
created: 2025-09-19T18:39:03.033+08:00
updated: 2025-10-10T18:01:22.2222+08:00
---

# 需求

图片可以使用图床解决，其他类型的附件也想自动上传并分享。

# 思路

可以借鉴图片的做法：

- 使用 Github 作为托管平台
	- 经过 [[obsidian-quartz-blog构建流程]] 的流程后，我可以在 attachment 目录中统一管理我的静态资源
- 借助 jsDelivr 获取静态资源
	- [[jsDelivr是什么|jsDelivr是免费公共CDN]]

最自然的想法是手动上传到 github 仓库中，拿到 cdn 地址后，将 markdown 中附件的语法 `!\[\[filename.ext\]\]` 改为 `[filename.ext](url)`

最终的形态就是要解决这里面手动的两个操作：

- 上传附件到 github
- 替换附件的语法

开始前，请阅读我的[[obsidian-quartz-blog构建流程|博客构建流程]]以了解上下文

# 通过 pre-commit 自动上传 assets 目录

> [!WARNING] attachments 目录为什么不直接上传到 quartz 仓库？
> 因为 cloudflare 托管平台会拉取 quartz 仓库并构建静态站点，所以我不希望这个仓库特别大
> 
> 之前在[[管理.obsidian目录]]中已经验证了 cloudflare 不会拉取 submodule，所以我把 attachments 作为 quartz 主仓库的 submodule
> 
> 此时，自然的需求就是在 push quartz 仓库之前，自动 push attachment submodule

- 第一步：加 submodule，举个例子
	```bash
	cd quartz
	git submodule add -f git@github.com:HRXWEB/obsidian-assets.git content/attachments.nosync
	```
	
> [!WARNING] 注意
> 保证 submodule 至少有一个 commit

- 第二步：设置 obsidian，使得附件全部在 submodule 目录管理

	![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250919181555925.png)

> [!INOTE] Tips
> `assets/` 目录是 attachment submodule 的子目录，防止所有文件都放在根目录，github页面太难看了。

- 最后一步：安装、编辑 pre-commit 相关文件
	```bash
	pip install pre-commit
	pre-commit install
    ```

	新建并编辑 `.pre-commit-config.yaml`，[内容见此](https://github.com/HRXWEB/obsidian-quartz-blog/blob/v4/.pre-commit-config.yaml)，id 为 `update-assets-submodule`

	执行的脚本[在此](https://github.com/HRXWEB/obsidian-quartz-blog/blob/v4/scripts/push_attachments_submodule.sh)

# 通过 pre-commit 自动修改附件语法

`.pre-commit-config.yaml`，[内容见此](https://github.com/HRXWEB/obsidian-quartz-blog/blob/v4/.pre-commit-config.yaml)，id 为 `convert-obsidian-links`

执行的脚本[在此](https://github.com/HRXWEB/obsidian-quartz-blog/blob/v4/scripts/convert_links.py)，就是通过正则表达式替换文本内容，这就是纯文本的力量（power~）

# [[写在最后]]

在认知内实现了类似图床的方案来解决这个问题，触类旁通。