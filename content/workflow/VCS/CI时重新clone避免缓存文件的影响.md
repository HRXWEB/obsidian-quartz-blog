---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:13:08 am
---

# 需求场景描述

有一个 lint_job 之前没有特殊的设置，导致拉取了 submodule 的代码后，会 lint submodule 里面的代码，这并不是预期的行为。

预期的行为是 lint 时跳过 submodule 的文件。

当前的设置：

```Bash
lint_job:
  stage: lint-check
  image: 192.168.3.224:8083/test/python-formatter:latest
  tags:
    - docker

  script:
    - echo "Running all checks..."
    - black --check --line-length 80 .
    - ruff check --line-length 80 .
```

在 pipline 的 logs 中看到关键字 `Reinitialized`：

```Plain
Reinitialized existing Git repository in /builds/algo-model-zoo/model_zoo/.git/
```

说明使用了缓存，通过 `git fetch` 来更新的仓库。导致一些缓存文件影响了 CI 流程。

# 解决方案

设置 GIT 策略为 clone，并且 submodule 不初始化

```YAML
lint_job:
  stage: lint-check
  image: 192.168.3.224:8083/test/python-formatter:latest
  tags:
    - docker
  variables:
    GIT_STRATEGY: clone
    GIT_SUBMODULE_STRATEGY: none

  script:
    - echo "Running all checks..."
    - black --check --line-length 80 .
    - ruff check --line-length 80 .
```

==**GIT_SUBMODULE_STRATEGY**== 补充：

- none： 不拉取 submodule
- normal：默认值，相当于 `git submodule update --init`
- recursive：递归拉取，相当于 `git submodule update --init --recursive`

# 参考

1. [https://stackoverflow.com/questions/64255647/how-to-skip-reinitialized-existing-git-repository-on-gitlab-cicd-stage](https://stackoverflow.com/questions/64255647/how-to-skip-reinitialized-existing-git-repository-on-gitlab-cicd-stage)
2. [https://docs.gitlab.com/ci/runners/git_submodules/#use-git-submodules-in-cicd-jobs](https://docs.gitlab.com/ci/runners/git_submodules/#use-git-submodules-in-cicd-jobs)