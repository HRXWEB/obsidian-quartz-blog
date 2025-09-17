---
title:
draft: "false"
aliases: [obsidian-blog-publish, obsidian-blog-quartz]
tags: []
created: Tuesday, September 16th 2025, 10:56:03 am
updated: Wednesday, September 17th 2025, 9:45:18 pm
---

# 需求

- 支持 obsidian 双向链接
- 上传附件

# 完整的方案应该包含哪些元素？

- [Obsidian 的未来——首席执行官 Stephan Ango采访纪实（转载）](https://forum-zh.obsidian.md/t/topic/41971)
- [How to publish your notes for free with Quartz \| Nicole van der Hoeven](https://nicolevanderhoeven.com/blog/20240126-how-to-publish-your-notes-for-free-with-quartz/)

一个（系列）文章发布，需要如下几个元素：

- Markdown 文章本身
- 将 Markdown 转为 HTML 的工具
- 托管服务

# 理清各种概念

- hugo 和 hexo 什么关系？
	- 都是静态站点生成器（SSG），即上述的将 Markdown 转为 HTML 的工具。下面是几个流行的 SSG 的对比：

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
	- 都是用于**托管和部署静态网站**的平台，除此之外还有 Netlify、Cloudflare Pages 等等。对比：

| 平台                   | 主要优势                            | Serverless Functions | Git 集成 | 价格（免费套餐） | 适合场景                           |
| -------------------- | ------------------------------- | -------------------- | ------ | -------- | ------------------------------ |
| **Vercel**           | 极致性能、开发者体验、框架支持、Serverless      | 原生支持                 | 优秀     | 慷慨       | 前端框架项目、追求高性能、需要Serverless      |
| **GitHub Pages**     | GitHub 原生集成、简单易用、纯静态托管          | 不直接支持                | 极佳     | 慷慨       | 项目文档、个人博客、静态展示网站               |
| **Netlify**          | CI/CD、Serverless、表单、身份验证、CMS 集成 | 原生支持                 | 优秀     | 慷慨       | 需要全能托管平台、CI/CD、Serverless、表单处理 |
| **Cloudflare Pages** | 极速 CDN、安全、Cloudflare 生态集成、低成本   | 配合 Workers           | 优秀     | 非常慷慨     | 追求速度和安全、已使用 Cloudflare、需要边缘计算  |
| **AWS Amplify**      | AWS 生态集成、全栈应用、构建复杂后端            | 配合 Lambda            | 优秀     | 按量计费     | 已使用 AWS、构建复杂全栈应用               |
| **Firebase Hosting** | Firebase 生态集成、移动后端、易于构建         | 配合 Cloud Functions   | 优秀     | 慷慨       | 构建移动端/Web 应用、需要 Firebase 其他服务  |
| **Surge.sh**         | 极其简单、命令行快速部署                    | 不支持                  | 不直接    | 免费       | 纯静态页面、快速原型部署、命令行爱好者            |

- 静态网页生成器在生成标题时是怎么生成的？ tiltle 和 alias 的区别
	- `title` 是内容的**描述性名称**，用于用户和搜索引擎理解内容是什么。
	- `alias` 是用于**构建 URL** 的标识符，使其更具可读性和 SEO 友好性，并且通常由 `title` 自动生成（但也可能被手动指定）。

# 结论

基于对 obsidian 双向链接的强需求，选定：

- [[obsdian-quartz-blog构建流程|quartz 作为 SSG]] （最重要/唯一的选择）
- cloudflare pages 作为托管平台

# [[写在最后]]

调研方案前，首先就是要明确需求。在调研的时候，会遇到很多未知的概念，多花时间，磨刀不误砍柴工。
