---
title:
draft: "false"
aliases: []
tags: []
created: Tuesday, September 16th 2025, 10:56:03 am
updated: Tuesday, September 16th 2025, 4:11:15 pm
---

# 需求

- 支持双向链接
- 上传附件

# 完整的方案应该包含哪些元素？

- [Obsidian 的未来——首席执行官 Stephan Ango采访纪实（转载）](https://forum-zh.obsidian.md/t/topic/41971)
- [如何使用 Quartz 免费发布您的笔记](https://nicolevanderhoeven.com/blog/20240126-how-to-publish-your-notes-for-free-with-quartz/)

# 理清各种概念

- hugo 和 hexo 什么关系？

| 特性                   | Hexo                                    | Hugo                                       | Quartz                             | Jekyll                                             | Gatsby                                         |
| -------------------- | --------------------------------------- | ------------------------------------------ | ---------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **主要语言**             | Node.js                                 | Go                                         | Node.js, TypeScript                | Ruby                                               | JavaScript (React)                             |
| **构建速度**             | 快                                       | **极快**                                     | 快                                  | 中等                                                 | 快 (初始构建可能较慢)                                   |
| **Obsidian 双向链接支持度** | **插件支持** (需 `hexo-obsidian-backlink` 等) | **社区实现/插件** (非原生，需自定义或 Shortcodes)         | **原生支持** (通过 `CrawlLinks` 插件，兼容性好) | **插件/主题支持** (如 `Jekyll Wikirefs`, `Notenote.link`) | **插件支持** (通过 `gatsby-remark-obsidian`，兼容性好)    |
| **附件上传/管理便利性**       | **插件支持** (`Hexo Toolkit` 提及 SM.MS 上传)   | **灵活** (通常置于 `static` 或同目录，自定义 Shortcodes) | **插件支持**(`CrawlLinks` 处理嵌入式图片)     | **取决于主题/插件**(需自行集成)                                | **依赖于插件/自定义** (如 `gatsby-plugin-image`，或配合云存储) |
| **易用性**              | 高                                       | 中等                                         | **高 (Markdown 为中心)**               | 高                                                  | 中等 (因 React 和 GraphQL)                         |
| **生态系统**             | 丰富 (主题/插件)                              | 活跃                                         | 专注 Markdown                        | **最成熟**                                            | **非常强大** (React 生态)                            |
| **主要优势**             | 灵活，插件丰富                                 | **速度**，简单部署                                | **Markdown 集成**，易于知识管理，原生双向链接      | 成熟，GitHub Pages 集成                                 | **数据聚合**，高性能，SPA 功能                            |
| **适合人群**             | Node.js 开发者，博客作者                        | 追求极致速度的项目                                  | Obsidian 用户，知识管理者                  | 入门者，GitHub Pages 用户                                | React 开发者，复杂应用                                 |

- vercel 和 github pages 是什么关系？
- 静态网页生成器在生成标题时是怎么生成的？ tiltle 和 alias 的区别

# 对比

- 静态托管的免费额度是多少
> 	Cloudflare Pages
> 	
> 	现在终于到了我们将博客页面向全世界发布的时候了。对于大部分使用者来说，并不想花大力气在服务器相关搭建调试上，也不想每年花成百上千来购买服务，因此我们选择了一种经济且简单的方式——Cloudflare Pages。
> 	
> 	Cloudflare Pages提供静态网站的托管服务，支持通过 Git 仓库（如 GitHub）直接部署项目，也可以通过本地上传或命令行工具进行部署。
> 	
> 	其免费提供每月500次的免费构建、100个自定义域名以及20000个文件（单文件＜25MiB）的存储。简单来说就是一个人用不掉，具体的相关限制可以参见[Limits · Cloudflare Pages docs](https://link.zhihu.com/?target=https%3A//developers.cloudflare.com/pages/platform/limits/)。

# 方案

## quartz

[quartz github](https://github.com/jackyzha0/quartz)

- [Quartz与Enveloppe插件结合助力Obsidian搭建数字花园](https://lazyjack.12123123.xyz/%E5%85%B6%E5%AE%83%E8%B5%84%E6%BA%90/Obsidian/Quartz%E4%B8%8EEnveloppe%E6%8F%92%E4%BB%B6%E7%BB%93%E5%90%88%E5%8A%A9%E5%8A%9BObsidian%E6%90%AD%E5%BB%BA%E6%95%B0%E5%AD%97%E8%8A%B1%E5%9B%AD)
- [使用 Obsidian 免费建个人博客](https://www.printlove.cn/obsidian-blog/)
- [obsidian 目前最完美的免费发布方案 - 渐进式教程](https://notes.oldwinter.top/obsidian-目前最完美的免费发布方案-渐进式教程)
- [oldwinter-quartz](https://notes.oldwinter.top/quartz)
- [How I use Obsidian, Quartz, Git and Apache to publish these notes](https://www.rcook.net/How-I-use-Obsidian,-Quartz,-Git-and-Apache-to-publish-these-notes)

# [[写在最后]]



