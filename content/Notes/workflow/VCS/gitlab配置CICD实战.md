---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 概念

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926110442287.png)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926110502268.png)

1. GitLab Runner 是用来帮助我们执行 CI Job 的工人，而 GitLab 就是这些工人的老板。老板（GitLab）会去查看需求单（.gitlab-ci.yml）建立一张又一张有先后顺序的工单（CI Pipeline），而每一位工人（Runner）则是每隔固定的时间就去询问老板（GitLab）现在有分配给自己的工作（CI Job）吗？
2. Executor 是工人的「完成工作的方式」或「工作的环境」。根据选择的 Executor，决定了 Runner 将会采用何种「方式」以及在哪个「工作环境」中来完成 CI Job。

## Executor

1. `Shell` : Runner 直接在自己的 local 环境执行 CI Job，因此需要提前安装相关的依赖。
2. `SSH` : Runner会通过SSH连接上目标主机，并且在目标主机上执行CI Job。
3. `Parallels` : 每次要执行CI Job时，Runner会先通过Parallels建立一个干净的VM，然后通过SSH登录此VM并在其中执行CI Job。
4. `VirtualBox` : 同上，只是改成用VirtualBox建立干净的VM。
5. `Docker` : Runner会通过Docker建立干净的Container，并且在Container内执行CI Job。
6. `Docker Machine` : 延续上一个 Executor，此种 Executor 一样会通过 Container 来执行 CI Job，但差别在于这次你原本的 Runner 将不再是一般的工人了，它已经摇身一变成为工头，每当有工作（CI Job）分派下来，工头就会去自行招募工人（auto-scaling）来执行工作。
7. `Kubernetes` : 延续前两个与 Container 相关的 Executor，这次直接进入超级工头 K8s 的世界。
8. `Custom`

# 配置 gitlab-runner

## ubuntu 安装

```shellscript
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt install gitlab-runner
```

# 向服务器注册 runner

在设置中找到 TOKEN 和 服务器地址端口

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926110526675.png)

可以在 `show runner installation instructions` 找到如下命令（替换REGISTRATION_TOKEN即可）：

```shellscript
sudo gitlab-runner register --url http://192.168.3.224:8081/ --registration-token $REGISTRATION_TOKEN
```

这一过程会交互式地进行，需要填写此 runner 的：

- 描述
- tag：被用于识别是否要将 CI job 交给此 runner。下面 `.gitlab-ci.yml` 每个 job 都有 tags，其tags 要有带有相应 tag 的 runner 才能执行。
- Executor
- 等等

# 一个基本的 .gitlab-ci.yml

```yaml
stages:
  - build
  - test
  - deploy

build_job:
  stage: build
  script:
    - echo "Building the project"
  tags:
    - docker
    - linux

test_job:
  stage: test
  script:
    - echo "Testing the project"
  tags:
    - clang-format-runner

deploy_job:
  stage: deploy
  script:
    - echo "Deploying the application"
  tags:
    - production
```

在这个例子中：

- `build_job` 将只会在带有 `docker` 和 `linux` 标签的 Runner 上执行。
- `test_job` 将只会在带有 `clang-format-runner` 标签的 Runner 上执行。
- `deploy_job` 将只会在带有 `production` 标签的 Runner 上执行。

## 配置 gitlab runner

点击 edit 即可

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926110549872.png)

# 可能的问题

## `$CI_PROJECT_DIR` 路径在哪?

一般在 `/home/gitlab-runner/builds/xxxxx/0/<project_group>/<project_name>`

## sudo 权限

问题：

```shellscript
sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
```

解决方案：

给 gitlab-runner 用户的某些命令添加无需密码即可执行的sudo权限，比如：

```shellscript
sudo visudo
gitlab-runner ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /bin/mkdir, /bin/tar, /bin/rm, /bin/bash, /usr/bin/python3, /bin/cp, /bin/chmod, /sbin/chroot, /bin/tar
```

## docker push 没有权限

1. 直接ssh登录 gitlab-runner 所在的服务器，可以正常 docker push 到 harbor 上
2. 但是 gitlab-runner pipeline 显示没有权限 push 镜像

原因在于 每个 runner 的执行用户是 gitlab-runner 这个用户，而 gitlab-runner 并没有登录 harbor，所以登录即可：

```shellscript
# gitlab-runner 加入到 docker 用户组就可以免除 sudo 权限
sudo usermod -aG docker gitlab-runner
su
su gitlab-runner
# 自建 的 harbor
docker login 192.168.3.224:8083
```

# 参考资料

1. [https://mafeifan.com/Gitlab/runner-runner%E7%9A%84executor%E8%AF%A5%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9.html](https://mafeifan.com/Gitlab/runner-runner%E7%9A%84executor%E8%AF%A5%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9.html)
2. [https://docs.gitlab.com/runner/install/linux-repository.html#install-gitlab-runner](https://docs.gitlab.com/runner/install/linux-repository.html#install-gitlab-runner)
3. [https://docs.gitlab.com/runner/register/index.html](https://docs.gitlab.com/runner/register/index.html)