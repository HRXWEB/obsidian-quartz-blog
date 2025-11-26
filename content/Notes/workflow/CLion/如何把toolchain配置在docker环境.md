---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

## 官方

官方的文档是直接配置本地docker作为开发环境：

> [!info] Docker toolchain | CLion  
> For the purpose of development in Docker containers, CLion provides full Docker integration via the dedicated Docker toolchain.  
> [https://www.jetbrains.com/help/clion/clion-toolchains-in-docker.html#create-docker-toolchain](https://www.jetbrains.com/help/clion/clion-toolchains-in-docker.html#create-docker-toolchain)  

---

## 网络资料

这边还有两个文档是讲如何配置远程docker开发环境：

> [!info] 灵活使用IDE搭建远程Docker开发环境  
> 补全大型C++项目符号信息，完美体验代码跳转——以Paddle源码为例  
> [https://sanbuphy.github.io/p/灵活使用ide搭建远程docker开发环境/#三ssh依赖安装与启动](https://sanbuphy.github.io/p/灵活使用ide搭建远程docker开发环境/#三ssh依赖安装与启动)  

> [!info] Clion 如何使用 Docker 作为开发环境  
> 有时候你可能想用 Docker 作为 C++ 项目的开发环境，就像 Python 用 Pyenv 作为开发环境一样。 本文就介绍了 Clion 的实现方式，实际体验效果非常令人满意，除了 Debug 的时候稍微麻烦一点(要多敲一个命令)。  
> [https://imhuwq.com/2018/12/02/Clion%20使用%20Docker%20作为开发环境/](https://imhuwq.com/2018/12/02/Clion%20使用%20Docker%20作为开发环境/)  

---

## 配置示例

一个简单的配置示例

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925184746021.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925184812507.png)

如上是 `container settings` 部分

```plaintext
--entrypoint -v /Users/username/Archive/nova:/workshop --privileged --net host --rm --ipc host
```

`—rm` 会导致每次clion要检测docker的一些配置的时候，都会在后台运行 docker run 创建容器然后删掉，这个是十分消耗资源的，应该改成创建一次，之后都用 exec 的方式进入容器，==**这个问题留待之后解决**==

## 每次rm container的问题

> [!info] youtrack.jetbrains.com  
>  
> [https://youtrack.jetbrains.com/issue/CPP-27689/CLion-creates-containers-and-doesnt-delete-them#focus=Comments-27-5629416.0-0](https://youtrack.jetbrains.com/issue/CPP-27689/CLion-creates-containers-and-doesnt-delete-them#focus=Comments-27-5629416.0-0)  

从这条评论来看，在性能足够富裕的情况下，Clion选择了以牺牲性能换取稳定性的做法。通过每次新建cotainer来保持干净简单。

> So comparing performance penalty with complexity to manually manage container lifecycle, we decided to choose simplicity.