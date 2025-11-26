---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```bash
$ echo $ROBOT_PAT | docker login $HARBOR_REGISTRY -u $ROBOT_USER --password-stdin
Error: Cannot perform an interactive login from a non TTY device
```

通过标准输入的形式登陆 docker 的时候出现上述的错误

---

检查几个变量的有效性即可，特别是 CI/CD 的时候，要检查是不是变量只用于 protected branch 和 tags。