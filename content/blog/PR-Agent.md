---
title: 构建自动审阅 gitlab MR 的 Agent
draft:
aliases: []
Created: 2025-05-06T10:45
tags: []
URL: https://github.com/qodo-ai/pr-agent
created: 2025-05-06T10:45:00.000+08:00
updated: 2025-10-27T17:13:25.2525+08:00
---

# Quick Start

- `/describe`
- `/review`
- 在 public github repo 的 PR 评论区：@CodiumAI-Agen[t](https://github.com/CodiumAI-Agent) /describe。比如这个[例子](https://github.com/fishros/install/pull/96#issuecomment-2841232900)

# 首页

[https://qodo-merge-docs.qodo.ai/](https://qodo-merge-docs.qodo.ai/)

# 如何安装使用？

参考官方文档集成到 gitlab 当中：[https://qodo-merge-docs.qodo.ai/installation/gitlab/](https://qodo-merge-docs.qodo.ai/installation/gitlab/)

## docker 安装部署 gitlab webhook server

- 准备好 gitlab 账户和 personal-access-token
- 准备好运行密钥
    
    ```TOML
    SHARED_SECRET=$(python -c "import secrets; print(secrets.token_hex(10))")
    ```
    
- 修改 `configuration.toml` 文件中如下几个字段：
    
    ```TOML
    git_provider="gitlab"
    #### 如果需要log分析，需要增加字段 begin ----####
    [config]
    analytics_folder="logs"
    #### 如果需要log分析，需要增加字段  end  ----####
    [gitlab]
    url = "http://192.168.3.224:8081"
    ```
    
- 复制 `.secrets_template.toml` 为 `.secrets.toml`
    - 修改如下几个字段：
        
        ```TOML
        # 第一种选择
        [openai]
        key = "sk-xxxxxxxxxxxxxxxx"
        # 下面这个 base 是 oh-my-gpt 的，根据实际需要修改。
        api_base = "https://aigptx.top"
        
        # 第二种选择
        # 用 gemini: https://qodo-merge-docs.qodo.ai/usage-guide/changing_a_model/#google-ai-studio
        # 有免费额度：https://ai.google.dev/gemini-api/docs/pricing?hl=zh-cn
        [google_ai_studio]
        gemini_api_key = "" # the google AI Studio API key
        #### 此时应该需要修改 configuration.toml 文件中的 -- begin ####
        [config]
        # models
        model="gemini/gemini-2.0-flash"
        fallback_models=["gemini/gemini-2.0-flash-lite"]
        #### 此时应该需要修改 configuration.toml 文件中的 --  end  ####
        
        [gitlab]
        # Gitlab personal access token
        personal_access_token = "xxxxxxx"
        shared_secret = "xxxxxxxxxxxxxxxxxxxx"  # webhook secret
        ```
        
    - 删除 `.dockerignore` 中的这一行
        
        ```Plain
        pr_agent/settings/.secrets.toml
        ```
        
- 构建
    
    ```Bash
    docker build . -t gitlab_pr_agent --target gitlab_webhook -f docker/Dockerfile
    ```
    
- 启动服务
    
    ```Bash
    docker run -d --restart always --network host --name my_pr_agent gitlab_pr_agent:latest
    ```

## 配置 gitlab repo webhook

依次点击：settings → Webhooks

填写：

- URL： (默认为 3000 端口，可以自行修改 `gitlab_webhook.py` 源码)

    http[s]://<PR_AGENT_HOSTNAME>:3000/webhook

- Secret token: 刚才生成的密钥

## ==**使用**==

[https://qodo-merge-docs.qodo.ai/tools/](https://qodo-merge-docs.qodo.ai/tools/)

最常用的就是 `/describe` 、 `/review` 和 `/help` 了

- describe 会扫描修改来修改 title 和 内容
- review 给出反馈，修改意见
- help 给出 pr agent 的使用方法

最好看一下 [https://qodo-merge-docs.qodo.ai/usage-guide/](https://qodo-merge-docs.qodo.ai/usage-guide/) 来全面了解使用方法，比如配置如下字段自动在开一个 MR 时触发几个动作：

> After setting up a GitLab webhook, you can control which commands run automatically when a new MR is opened by setting the `pr_commands` parameter in the configuration file, similar to the GitHub App:  
> `[gitlab] pr_commands = [ "/describe", "/review", "/improve", ]`  
> The GitLab webhook can also respond to new code pushed to an open MR. Enable this feature using the configuration toggle `handle_push_trigger`. The `push_commands` parameter defines which tools will **run automatically** when new code is pushed to the MR.  
> `[gitlab] handle_push_trigger = true push_commands = [ "/describe", "/review", ]`  
> Note: To use the "handle_push_trigger" feature, you must give the GitLab webhook the "Push events" scope.