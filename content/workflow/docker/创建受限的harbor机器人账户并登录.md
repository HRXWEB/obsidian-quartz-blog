---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926112859895.png)

# 最小权限 (Essential Permissions)

1. **推送仓库 (Push Repository)**
    - **为什么需要？** 这是最核心的权限，它允许机器人账户向项目中的仓库（repository）上传新的内容。没有这个权限，任何推送操作都会被直接拒绝。
2. **拉取仓库 (Pull Repository)**
    - **为什么需要？** 在很多版本的 Harbor 中，**“推送仓库”权限依赖于“拉取仓库”权限**。即使你只推不拉，Harbor 的权限模型也要求 `push` 的主体必须同时具备 `pull` 的能力。这是一个常见的依赖关系，所以务必勾选。
3. **创建 Artifact 标签 (Create Artifact Label)**
    - **为什么需要？** 这个权限是新版本 Harbor 中用来控制 `docker tag` 这种操作的。当你 `push` 一个带标签的镜像时（例如 `my-image:latest`），你需要这个权限来创建 `latest` 这个标签。**在新版 Harbor 中，这个权限和下面的 "创建 Tag" 有时会让人混淆，但为了兼容性和确保成功，建议勾选。**
4. **创建 Tag (Create Tag)**
    - **为什么需要？** 这是传统上用来控制为镜像打标签的权限。虽然 "Artifact 标签" 更加现代化，但为了覆盖所有版本的 Harbor 并确保 `docker push my-image:tag` 的成功，这个权限也是必需的。

# 登录

```JSON
echo -n "personal_access_token" | docker login 192.168.3.224:8083 -u "robot\$jetson+robot" --password-stdin
```

- `-n` 取消 echo 自动添加的换行符
- `\$` **加反斜杠转义** 或用单引号 'robot$jetson+robot'，避免被 shell 误解析为变量

# 机器人账户

```Bash
# test 
robot$test+algo_model_zoo_robot
33KHb46XV8FoFMewSPTRZPlEJWEYvKGS
```