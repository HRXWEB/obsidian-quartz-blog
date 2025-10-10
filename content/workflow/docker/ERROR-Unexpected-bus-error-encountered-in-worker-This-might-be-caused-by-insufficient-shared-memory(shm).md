---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

docker run 默认的 shm-size 是 64M：[https://docs.docker.com/engine/containers/run/#runtime-constraints-on-resources](https://docs.docker.com/engine/containers/run/#runtime-constraints-on-resources)

gitlab-runner ci 可以配置这个参数，此特性在 v9.1 提供支持：[https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/468](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/468)

参考配置：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112755160.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112812947.png)
