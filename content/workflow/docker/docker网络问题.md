---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 11:32:45 am
---

除了配置代理以外解决的网络问题 [[docker配置代理]]

~~还有一种现象很特殊的网络问题：~~

```Bash
docker buildx build --no-cache -t my-arm64-rootfs .
>>>
ERROR: failed to solve: ubuntu:20.04: failed to resolve source metadata for docker.io/library/ubuntu:20.04: failed to do request: Head "https://registry-1.docker.io/v2/library/ubuntu/manifests/20.04": dial tcp 154.83.14.134:443: i/o timeout
```

~~搜了很多资料，有各种解决方案：~~

- ~~添加镜像源~~
- ~~或者配置代理~~
- ~~或者尝试 docker logout 之后再 login~~

~~**都没有解决**~~

~~后来无意中看到这篇文章：~~

~~[https://www.cnblogs.com/yzhch/p/17889286.html](https://www.cnblogs.com/yzhch/p/17889286.html) ，~~

~~突发奇想是不是就是 buildx 的权限问题~~

~~然后加上 sudo 就解决了。==但是也不确定是不是真的可行==~~

---

后来确定了，并不可行，只是因为当时多个阶段都是 amd64 的容器，用的 buildx 也是 default:

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112935820.png)

所以并不涉及什么跨（多）平台构建

---

> [!important] April 23, 2025 确定了问题所在，还是代理的问题
> 
>   
> 
> 虽然 docker 已经配置了代理 [[docker配置代理]] ，但是 `docker buildx create` 之后会创建一个容器
> 
> ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926113002349.png)
> 
> 在跨平台构建的时候它是要参与工作的，因为验证过不启动它就没法工作

# 解决方法

那么解决的方法就是给 buildx 加上代理: [[docker-buildx-create配置代理]]