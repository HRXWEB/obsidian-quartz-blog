---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:33:30 am
---

这是因为 `Dockerfile` 的 ENTRYPOINT 中没有给 `bash` 加 `-c` 参数。

通过 `docker history <image_name> --no-trunc` 命令查看 `Dockerfile`

可以在最前面找到 ENTRYPOINT，下面举的例子已经加上了 `-c` 参数:

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112739715.png)

也就是 DockerFile 记得加上，这样也能解决 docker 启动时立即退出的问题。（因为启动后没有任何进程运行，资源就被回收了，容器就会退出并停止）

```Docker
ENTRYPOINT ["/bin/bash", "-l", "-c"]
```