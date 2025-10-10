---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

不敏感的数据直接在 `.yml` 文件中定义 `Variables` 即可

---

依次点击： `settings` → `CI/CD` → `Variables Expand` → `Add Variable`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926110236677.png)

> [!important] 针对不方便公开的密钥等敏感信息，要勾选两个 Flags
> 
> - Protect variables 保证只有受保护的 branch 和 tags 上触发的 pipeline 才能看见这个变量
> - Mask variables 保证在 pipeline 上这个变量会被 mask，显示为 [[masked]]。但要注意的是 value 要是大于等于 8 位的 Base64 字母表中的字符组成

注意： [[CI 变量如何防止$符号逃逸]]