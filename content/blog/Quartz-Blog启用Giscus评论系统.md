---
title:
draft:
aliases: [blog-giscus]
tags: [blog]
created: 2025-09-17T11:36:07.077+08:00
updated: 2025-10-10T18:01:27.2727+08:00
---

# 工作原理

giscus 加载时，会使用 [GitHub Discussions 搜索 API](https://docs.github.com/en/graphql/guides/using-the-graphql-api-for-discussions#search) 根据选定的映射方式（如 URL、`pathname`、`<title>` 等）来查找与当前页面关联的 discussion。如果找不到匹配的 discussion，giscus bot 就会在第一次有人留下评论或回应时自动创建一个 discussion。

# 前置条件

1. 博客仓库是公开的，比如[我的](https://github.com/HRXWEB/obsidian-quartz-blog)
2. 在仓库的设置中打开 Discussion： 仓库->settings->General->勾选Discussions
3. [点击安装 Giscus app](https://github.com/apps/giscus)

# 配置

按照下图配置

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917132725332.png)

其他更多的配置保持默认即可。

然后就可以得到配置：

```typescript
<script src="https://giscus.app/client.js"
        data-repo="hrxweb/obsidian-quartz-blog"
        data-repo-id="R_kgDOPwzMrQ"
        data-category="Announcements"
        data-category-id="DIC_kwDOPwzMrc4Cviq1"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
```

配置解释：

- 仓库：即你的博客仓库，会自动校验是否满足要求
- 页面和 Discussion 的映射关系：一般使用默认的 Pathname 即可，我理解就是 discussion 创建标题名的规则
- Discussion 分类：选择 `General`，可以自由讨论。默认的 `Announcements` 会导致读者无法评论

# 将配置迁移到 quartz 博客仓库

编辑 `quartz.layout.ts` 文件，将上面的配置一一对面到各个字段即可：

```typescript
afterBody: [
    Component.Comments({
      provider: 'giscus',
      options: {
        repo: 'hrxweb/obsidian-quartz-blog',
        repoId: 'R_kgDOPwzMrQ',
        category: 'Announcements',
        categoryId: 'DIC_kwDOPwzMrc4Cviq1',
        mapping: 'pathname',
        strict: false,
        reactionsEnabled: true,
        inputPosition: 'top',
        lang: 'zh-CN',
      },
    }),
  ],
```

# [[写在最后]]

以前看到别人的博客也有评论系统，但是先入为主的认为需要服务器来搭建这套系统，毕竟要存储讨论的数据。但是没想到已经弄的这么成熟，几分钟就能配置好了！

# 参考资料

- https://lazyjack.12123123.xyz/其它资源/Obsidian/Quartz个人配置修改记录#启用giscus评论系统
- https://www.lixueduan.com/posts/blog/02-add-giscus-comment/