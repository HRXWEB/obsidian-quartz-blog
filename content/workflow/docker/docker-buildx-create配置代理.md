---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 最终配置

```Shell
# buildkitd.toml 文件内容
[registry."192.168.3.224:8083"]
  insecure = true
  http = true
```

```Bash
docker buildx create --name muilt_buildx \
--use --driver docker-container \
--config ~/.config/buildkit/buildkitd.toml \
--driver-opt network=host \
--driver-opt env.http_proxy=http://127.0.0.1:7890 \
--driver-opt env.https_proxy=http://127.0.0.1:7890 \
--driver-opt \"env.no_proxy=localhost,127.0.0.1,192.168.0.0/16\" \
--bootstrap
```

---

在创建一个新的 builder 实例的时候要传递代理相关的参数

```Shell
docker buildx create --name multi_buildx \
--use --driver docker-container \
--driver-opt network=host \
--driver-opt env.http_proxy=http://127.0.0.1:7890 \
--driver-opt env.https_proxy=http://127.0.0.1:7890 \
--driver-opt \"env.no_proxy=localhost,127.0.0.1,192.168.0.0/16\" \
--bootstrap
```

> [!important]
> 
> - `env.no_proxy` 的要加上非转义 \" 是为了防止 `,` 逃逸。
> - 如果不加，表现会是 `error: invalid value "127.0.0.1", expecting k=v`
> - 可以看这个 issue [https://github.com/docker/buildx/discussions/1133](https://github.com/docker/buildx/discussions/1133)
> - 因为 driver-opt 的语法是这样的：[https://docs.docker.com/build/builders/drivers/docker-container/#synopsis](https://docs.docker.com/build/builders/drivers/docker-container/#synopsis)
> - 可以看到 `--driver-opt=[key=value,...]` 这里面也有逗号。导致 127.0.0.1 被认为是独立的 value，但没有对应的 key

> [!important] （==**不建议**==）也可以参考这篇资料，配置 `buildkitd`，比如增加镜像源之类的来解决：[https://blog.csdn.net/2504_90437830/article/details/145491324](https://blog.csdn.net/2504_90437830/article/details/145491324)
> 
> 它只是让 `buildkitd` 在拉取镜像的时候去 `docker.io` 的镜像源拉取。

---

上述的操作实际上是创建一个要运行 `buildkitd` 守护进程的==**容器**==，它决定了 `buildkitd` 的运行环境。

---

而 `buildkitd` 内部的行为，例如连接哪个镜像仓库、是否开启不安全授权 (`insecure-entitlements`)、缓存和GC策略、worker设置等，要通过 `buildkitd.toml` 来配置。

---

简单来说就是配置 `docker build create .... --bootstrap --use` 时生成的容器，在其内部修改

```Shell
# buildkitd.toml 文件内容
[registry."192.168.3.224:8083"]
  insecure = true
  http = true
```

官方对这个文件的说明和配置参考： [https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md](https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md)

配置后使用：

```Bash
docker buildx create --name muilt_buildx \
--use --driver docker-container \
--config ~/.config/buildkit/buildkitd.toml \
--driver-opt network=host \
--driver-opt env.http_proxy=http://127.0.0.1:7890 \
--driver-opt env.https_proxy=http://127.0.0.1:7890 \
--driver-opt \"env.no_proxy=localhost,127.0.0.1,192.168.0.0/16\" \
--bootstrap
```

# 参考资料

1. [https://stackoverflow.com/questions/76016450/docker-proxy-timeouts-with-docker-buildx-build](https://stackoverflow.com/questions/76016450/docker-proxy-timeouts-with-docker-buildx-build)
2. [https://blog.csdn.net/2504_90437830/article/details/145491324](https://blog.csdn.net/2504_90437830/article/details/145491324)
3. [https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md](https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md)