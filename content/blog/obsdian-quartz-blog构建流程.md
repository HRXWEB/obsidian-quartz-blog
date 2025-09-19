---
permalink: 
title:
draft:
aliases: [obsidian-quartz-blog-build]
tags: []
created: Wednesday, September 17th 2025, 9:51:17 pm
updated: Friday, September 19th 2025, 8:49:09 pm
---

# 需要解决的问题

1. 多端同步：我直接使用 iCloud
2. 托管平台：选择 cloudflare pages
3. `.obsidian/` 目录管理：作为 private submodule ^cfed0a

# Quartz 初始化配置

> [!NOTE] 提示
> 使用 iCloud 作为同步方案时，在 icloud 的 obsidian 文档目录执行 clone 命令。
> 
> 一般来说会是这个路径 `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/`
> 
> 这样 ios 端才能识别到这个云端的 vault

```bash
git clone https://github.com/jackyzha0/quartz.git
cd quartz
npm i
npx quartz create
# 指定上面这条命令会交互式的配置，选择默认的即可。即使你原先就有博客目录，也选择从零开始。
```

## 预览

调试时使用，确保成功构建后（非必需）再 push 到 git 远程仓库。

```bash
npx quartz build --serve
```

## 迁移原有的博客（optional）

原来的文章 `.md` 放在 `content/` 目录

如果之前就已经创建好了 obsidian vault，肯定会装很多的插件，把 `.obsidian/` 目录放到项目根目录下就可以复原了。

默认配置下 `.obsidian/` 目录是写在 `.gitignore` 的，即不进行跟踪。但是我肯定是希望它能被跟踪且是私密的，这样后续换了设备也能快速复原工作环境。具体做法见[[管理.obsidian目录]]，当前不急着做。

## 创建必要的目录

```bash
# 附件目录
mkdir -p content/attachment
# 模板目录
mkdir -p content/template
```

> [!WARNING] attachment 目录管理
> 2025/09/19 更新
> 
> 下文有关附件的描述全部忽略即可，不影响整体流程，具体的附件管理见[[obsidian附件管理]]

创建后在 obsidian 设置：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917221038970.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917221126223.png)

### 使用 git-lfs 管理附件

```bash
git-lfs install
cat << EOF >> .gitattributes
*.pdf filter=lfs diff=lfs merge=lfs -text
*.docx filter=lfs diff=lfs merge=lfs -text
*.doc filter=lfs diff=lfs merge=lfs -text
*.pptx filter=lfs diff=lfs merge=lfs -text
*.ppt filter=lfs diff=lfs merge=lfs -text
*.xlsx filter=lfs diff=lfs merge=lfs -text
*.xls filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
*.rar filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
*.tar filter=lfs diff=lfs merge=lfs -text
*.gz filter=lfs diff=lfs merge=lfs -text
*.bz2 filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.avi filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text
*.mkv filter=lfs diff=lfs merge=lfs -text
*.flv filter=lfs diff=lfs merge=lfs -text
*.wmv filter=lfs diff=lfs merge=lfs -text
*.wav filter=lfs diff=lfs merge=lfs -text
*.flac filter=lfs diff=lfs merge=lfs -text
*.aac filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.wma filter=lfs diff=lfs merge=lfs -text
*.exe filter=lfs diff=lfs merge=lfs -text
*.msi filter=lfs diff=lfs merge=lfs -text
*.dmg filter=lfs diff=lfs merge=lfs -text
*.pkg filter=lfs diff=lfs merge=lfs -text
*.deb filter=lfs diff=lfs merge=lfs -text
*.rpm filter=lfs diff=lfs merge=lfs -text
*.apk filter=lfs diff=lfs merge=lfs -text
*.ipa filter=lfs diff=lfs merge=lfs -text
*.iso filter=lfs diff=lfs merge=lfs -text
*.bin filter=lfs diff=lfs merge=lfs -text
*.dat filter=lfs diff=lfs merge=lfs -text
*.onnx filter=lfs diff=lfs merge=lfs -text
*.h5 filter=lfs diff=lfs merge=lfs -text
*.model filter=lfs diff=lfs merge=lfs -text
*.pkl filter=lfs diff=lfs merge=lfs -text
*.pickle filter=lfs diff=lfs merge=lfs -text
*.db filter=lfs diff=lfs merge=lfs -text
*.sqlite filter=lfs diff=lfs merge=lfs -text
*.sqlite3 filter=lfs diff=lfs merge=lfs -text
EOF
```

## 忽略 .nosync

`.git/` 和 `node_modules/` 目录都是不需要进行同步的目录，并且占用空间也大，可以通过下面的命令让 iCloud 不要同步

```bash
mv .git .git.nosync
ln -s .git.nosync .git
mv node_modules node_modules.nosync
ln -s node_modules.nosync node_modules
# 附件也不想同步
cd content
mv attachment attachment.nosync
ln -s attachment.nosync attachment
```

## 禁止搜索无关目录

当前 obsidian vault 存在很多和文章无关的文件，会影响搜索体验，排除它们：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917221525582.png)

## 修改 `.gitignore`

```plaintext
*.nosync
!attachment.nosync
```

# 配置 cloudflare pages 托管服务

点击 dashboard 的 `Comptute (Workers)`，添加一个 Pages，连接你自己 fork 的 quartz 仓库，比如这是[[quartz仓库|我的]]。

确保你的配置如下，并关注箭头所示的配置内容

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917144558576.png)

将 Preview branch 设置为 None 是防止构建别的分支，导致超出免费构建的次数。

## [[如何购买并配置域名DNS|自定义域名]]

点击上图中的 Custom Domains，自行设置。

一般选择 `blog.yourdomain.com`

# [[dotfile管理哲学|管理.obsidian目录]]

[[管理.obsidian目录]]

# 打开obsidian vault

选择 `quartz/` 目录

## 插件资源

- Image auto upload：[[Obsidian图床最佳实践：3分钟配置PicList+GitHub+jsDelivr！|实现自动上传图片到图床]]
- Auto link title：实现自动获取文章标题
- Linter：格式化 markdown
- floating toc：悬浮目录
- File Tree Alternative：实现聚焦某个目录，排除 quartz 项目仓库其他目录的干扰
	 ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917230814926.png)

## [[quartz-个人配置]]

记录了一些个人的配置

# 参考资料

- [GitHub - jackyzha0/quartz: 🌱 a fast, batteries-included static-site generator that transforms Markdown content into fully functional websites](https://github.com/jackyzha0/quartz)
- [Quartz与Enveloppe插件结合助力Obsidian搭建数字花园](https://lazyjack.12123123.xyz/%E5%85%B6%E5%AE%83%E8%B5%84%E6%BA%90/Obsidian/Quartz%E4%B8%8EEnveloppe%E6%8F%92%E4%BB%B6%E7%BB%93%E5%90%88%E5%8A%A9%E5%8A%9BObsidian%E6%90%AD%E5%BB%BA%E6%95%B0%E5%AD%97%E8%8A%B1%E5%9B%AD)
- [使用 Obsidian 免费建个人博客](https://www.printlove.cn/obsidian-blog/)
- [obsidian 目前最完美的免费发布方案 - 渐进式教程](https://notes.oldwinter.top/obsidian-目前最完美的免费发布方案-渐进式教程)
- [oldwinter-quartz](https://notes.oldwinter.top/quartz)
- [How I use Obsidian, Quartz, Git and Apache to publish these notes](https://www.rcook.net/How-I-use-Obsidian,-Quartz,-Git-and-Apache-to-publish-these-notes)

# [[写在最后]]