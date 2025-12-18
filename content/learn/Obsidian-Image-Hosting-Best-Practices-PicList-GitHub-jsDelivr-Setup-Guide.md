---
title: Obsidian图床最佳实践：PicList+GitHub+jsDelivr配置指南
draft:
aliases: []
tags: []
date: 2025-09-15
url: https://zhuanlan.zhihu.com/p/1896857009174868154
created: 2025-09-16T15:24:45.4545+08:00
updated: 2025-10-10T18:01:23.2323+08:00
---

本文是上面所贴链接文章的备份，如侵权请[联系我](mailto:rxhuang1014@gmail.com)删除。

---

# 为什么需要图床？

- **数据安全：** 本地图片一旦丢失，笔记中的图片也会消失。图床将图片存储在云端，避免数据丢失的风险。
- **跨设备同步：** 无论你在哪台设备上编辑 Obsidian 笔记，都能看到完整的图片，无需手动同步。
- **笔记美观：** 云端图片加载速度更快，提升阅读体验。
- **协作便捷：** 方便与他人分享包含图片的笔记。

# 终极配置方案

**PicList + GitHub + jsDelivr**

这个方案的优点是：**免费、稳定、高效、易于配置**。

- **PicList：** 强大的图床上传工具，支持多种图床，操作简单。
- **GitHub：** 免费的代码托管平台，可以作为图床存储图片。
- **jsDelivr：** 免费的 CDN 加速服务，加速图片加载速度。

# 3 分钟配置步骤

## 1. 创建 GitHub 仓库

- 登录 GitHub，创建一个新的公开仓库，命名随意，例如 `obsidian-images`。
- 记住你的仓库名称，例如 `your_username/obsidian-images`。

## 2. 安装 PicList

- 下载并安装 PicList：[Releases · Kuingsmile/PicList](https://link.zhihu.com/?target=https%3A//github.com/Kuingsmile/PicList/releases/)
- 安装完成后，打开 PicList。

## **3. 配置 PicList：**

- 在 PicList 界面，点击 "图床设置"，选择 "GitHub"。
- 填写以下信息：
	- **仓库名：** 填写你的 GitHub 仓库名称，例如 `your_username/obsidian-images`。
	- **分支名：** 默认为 `main`。
	- **Token：** [打开 GitHub PAT页面](https://github.com/settings/tokens) ，勾选 `repo` 权限，点击 "Generate token"，复制生成的 Token。
	- **存储路径：** 建议设置为 `img/`，方便管理。
	- **自定义域名：** 填写 `https://cdn.jsdelivr.net/gh/your_username/obsidian-images，将` your_username/obsidian-images` 替换为你的仓库名称。
- 点击 "确定"，保存其为默认配置。

## 4. 配置 Obsidian

- 安装 "Image auto upload" 插件。  
- 在 Obsidian 设置中，找到 "Image auto upload" 插件，配置以下信息：
- **默认上传器:** 选择默认的PicGO(app)。
- **剪贴板自动上传:** 开启此选项，粘贴图片后自动上传。
- 其它配置保持默认

## 5. 使用方法

- 在 Obsidian 中，直接粘贴或拖拽图片，插件会自动上传图片到 GitHub 图床，并生成 Markdown 链接。
- 你也可以手动上传图片到 PicList，然后复制 Markdown 链接到 Obsidian。

---

**注意事项：**

- GitHub 仓库必须设置为公开，否则 jsDelivr 无法访问。
- Token 权限必须包含 `repo`，否则 PicList 无法上传图片。
- jsDelivr 可能会有缓存，如果图片更新后无法立即显示，请等待一段时间或手动清除 jsDelivr 缓存。
- 建议定期备份 GitHub 仓库，以防数据丢失。

---

**总结：**

通过 PicList + GitHub + jsDelivr 的组合，你可以轻松搭建一个免费、稳定、高效的 Obsidian 图床，实现云端图片管理，让你的笔记更加完美！快来试试吧！