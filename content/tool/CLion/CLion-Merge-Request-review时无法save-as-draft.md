---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 原因

> [https://youtrack.jetbrains.com/issue/IJPL-82637/GitLab-Creating-draft-merge-request-notes#focus=Comments-27-8385319.0-0](https://youtrack.jetbrains.com/issue/IJPL-82637/GitLab-Creating-draft-merge-request-notes#focus=Comments-27-8385319.0-0)  

需要 gitlab 版本 ≥ 16.3

# 查看 gitlab 版本

```shellscript
http://your-gitlab-instance/api/v4/version

# 举例自建
http://192.168.3.224:8081/api/v4/version
## 最终看到版本是 14.0.12
```