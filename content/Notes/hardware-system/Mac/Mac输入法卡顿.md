---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

Macbook Pro的中英文输入法切换键(CapsLock)延迟卡顿如何解决？ - 我爱算法的回答 - 知乎  
[https://www.zhihu.com/question/478402271/answer/130599333792](https://www.zhihu.com/question/478402271/answer/130599333792)

```bash
kill -9 `pgrep SCIM`
```

==**杀死后会自动重启**==