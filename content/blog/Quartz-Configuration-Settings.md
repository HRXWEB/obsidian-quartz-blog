---
title: Quartz个人配置与定制 
permalink: 
draft: false
aliases: []
tags: []
created: 2025-09-19T15:09:10.1010+08:00
updated: 2025-10-11T16:06:47.4747+08:00
---

# 排除不想发布的目录

- `private`: 私人笔记
- `TBD`: 待撰写的笔记

因此将 `quartz.config.ts` 的 `ignorePatterns` 字段改为：

```typescript
ignorePatterns: ["private", "templates", "TBD", ".obsidian"],
```

# 添加 GISCUS 评论系统

见此：[[Quartz-Blog-Enable-Giscus-Comment-System-Tutorial|blog-giscus|]]

# 管理附件

见此：[[Obsidian-Attachment-Management-Best-Practices]]