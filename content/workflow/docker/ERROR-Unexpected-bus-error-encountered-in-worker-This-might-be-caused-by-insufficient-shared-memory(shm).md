---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:28:18 am
---

docker run 默认的 shm-size 是 64M：[https://docs.docker.com/engine/containers/run/#runtime-constraints-on-resources](https://docs.docker.com/engine/containers/run/#runtime-constraints-on-resources)

gitlab-runner ci 可以配置这个参数，此特性在 v9.1 提供支持：[https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/468](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/468)

参考配置：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112755160.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112812947.png)
