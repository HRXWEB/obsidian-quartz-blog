---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:10:00 am
---

# 现象描述

写了这样一个模板：

```YAML
.build-torch-cache-template:
  <<: *dind
  stage: prepare_docker_cache
  variables:
    # Define the image name once to avoid repetition.
    TORCH_CACHE_IMAGE: "$HARBOR_REGISTRY/$HARBOR_PROJECT/torch_cache:cu121"
  script:
    - echo "Building torch cache image: $TORCH_CACHE_IMAGE"
    - |
      docker build \
        -f docker/torch_cache.dockerfile \
        -t "$TORCH_CACHE_IMAGE" \
        .
```

导致后续 extend 这个模板的 job 都会出现： `jobs:build-torch-cache-mr:script config should be a string or a nested array of strings up to 10 levels deep` 类似这样的错误

# 原因

官方的故障排除中对这个现象有描述：

> [!info] 脚本和作业日志 - GitLab - GitLab 文档中心  
> To determine the technical writer assigned to the Stage/Group associated with this page, see https://handbook.  
> [https://gitlab.cn/docs/jh/ci/yaml/script/#syntax-is-incorrect-in-scripts-that-use](https://gitlab.cn/docs/jh/ci/yaml/script/#syntax-is-incorrect-in-scripts-that-use)  

简单来说就是脚本中有使用 `:`

YAML 解析器认为 `:` 定义了一个 YAML 关键词，并输出 Syntax is incorrect 错误。

# 解决方案

```YAML
.build-torch-cache-template:
  <<: *dind
  stage: prepare_docker_cache
  variables:
    # Define the image name once to avoid repetition.
    TORCH_CACHE_IMAGE: "$HARBOR_REGISTRY/$HARBOR_PROJECT/torch_cache:cu121"
  script:
	  # 唯一的变化就是把 echo 命令用单引号包裹起来
    - 'echo "Building torch cache image: $TORCH_CACHE_IMAGE"'
    - |
      docker build \
        -f docker/torch_cache.dockerfile \
        -t "$TORCH_CACHE_IMAGE" \
        .
```

唯一的变化就是把 `echo "Building torch cache image: $TORCH_CACHE_IMAGE"` 命令用单引号 `'` 包裹起来了。