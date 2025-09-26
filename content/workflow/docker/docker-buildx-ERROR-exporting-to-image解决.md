---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:36:45 am
---

```Plain
=> ERROR exporting to image                                                                                                                                            0.2s
 => => exporting layers                                                                                                                                                 0.0s
 => => exporting manifest sha256:b4009b2dcf80ee92f4a00dd0d8c3465d234234dd284af444e7fb757aae5b5d5f                                                                       0.0s
 => => exporting config sha256:6d36eda8cc84cb7521a40124e2d385b8c7970763afbc87ed445b34a918392c5c                                                                         0.0s
 => => exporting attestation manifest sha256:afd1961e6f49e2a114b287c8915591d24bf96a3b4982b0e35627aa0513a03d56                                                           0.0s
 => => exporting manifest sha256:3727aa334d38e144a6f8bc6b82e03bfeed771be6824f381d45bd9ec30edee1a9                                                                       0.0s
 => => exporting config sha256:56247bd1b4c01be71563faefde98d8698a90b961d5781195f4c05077615281c6                                                                         0.0s
 => => exporting attestation manifest sha256:6e07799534ee0339e277d34e389726ce7b847f672a8297fceb7b3785070334f0                                                           0.0s
 => => exporting manifest list sha256:18907de7118b7ea0d6c70529c0994aa947725999b1ccb39af89f1d8dc67a2854                                                                  0.0s
 => => pushing layers                                                                                                                                                   0.0s
------
 > exporting to image:
------
ERROR: failed to solve: failed to push 192.168.3.224:8083/test/python-formatter:latest: failed to do request: Head "https://192.168.3.224:8083/v2/test/python-formatter/blobs/sha256:ff412cb9267001ebd2c22f547c01f515175717419ba835f6c4634df92ee15e67": http: server gave HTTP response to HTTPS client
```

# 解决方案

BuildKit 容器拥有自己独立的环境，它不会自动继承主机 `/etc/docker/daemon.json` 里的 `insecure-registries`配置。需要额外配置。比如 [[docker-buildx-create配置代理]]

上述问题需要配置 `insecure-registrie` ，在 `~/.config/buildkit/buildkitd.toml` 配置：

```TOML
[registry."192.168.3.224:8083"]
  insecure = true
  http = true
```

然后使用新配置重建 buildx 构建器：

```TOML
# 使用反斜杠 \ 保持命令的可读性
docker buildx create --name multi_buildx \
  --use \
  --driver docker-container \
  --config ~/.config/buildkit/buildkitd.toml \
  --driver-opt network=host \
  --driver-opt env.http_proxy=http://127.0.0.1:7890 \
  --driver-opt env.https_proxy=http://127.0.0.1:7890 \
  --bootstrap
```

# 参考

1. [https://stackoverflow.com/questions/73612351/standard-docker-push-works-but-not-buildxdocker-container-error-exporting-to](https://stackoverflow.com/questions/73612351/standard-docker-push-works-but-not-buildxdocker-container-error-exporting-to)