---
title: 
permalink: 
draft: false
aliases: []
tags: []
created: Friday, September 19th 2025, 3:09:10 pm
updated: Friday, September 19th 2025, 3:13:53 pm
---

# 排除不想发布的目录

- `private`: 私人笔记
- `TBD`: 待撰写的笔记

因此将 `quartz.config.ts` 的 `ignorePatterns` 字段改为：

```typescript
ignorePatterns: ["private", "templates", "TBD", ".obsidian"],
```

# 添加 GISCUS 评论系统

见此：[[Quartz-Blog启用Giscus评论系统|blog-giscus|]]