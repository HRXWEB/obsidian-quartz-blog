---
title:
draft: true
aliases: []
tags: []
created: 2026-01-26T17:25:21.2121+08:00
updated: 2026-06-03T15:37:42.4242+08:00
URL:
---

> [!important] 你的专属“贾维斯”！！！
> 

# 扩展性&定制化

- skills
- [ClawdHub](https://clawdhub.com)

# 资料

- [The Ultimate Clawdbot Posts on X - Google 文档](https://docs.google.com/document/d/1Mz4xt1yAqb2gDxjr0Vs_YOu9EeO-6JYQMSx4WWI8KUA/edit?tab=t.0)

# 踩坑

1. 新增了模型之后，webchat 后台可以及时看到，但是在飞书通信渠道上，用户看不到，要启动 gateway
2. 在 webchat 的会话中选择某用户和飞书 bot 的私聊续聊，有可能导致这个用户和飞书 bot 私聊失败
3. 飞书聊天渠道发送不了文件给我。原因：官方加了安全审查，非 workspace 目录下的发不出来，见 [飞书消息发送图片失败 - 只显示文件路径而非图片 · Issue #31378 · openclaw/openclaw](https://github.com/openclaw/openclaw/issues/31378)。源码分析搜 `assertLocalMediaAllowed` 就好了，目前 2026.2.26 版本在 `medis.ts` 文件里。
4. docker 部署的时候 BRAVE API 需要外部网络环境，但是配置后会导致消息发送不到飞书服务器，服务器也就不会下发消息给机器人
5. 别再后台强制打断（比如 `/stop`）用户在别的 channel（比如飞书）的对话，会导致后续机器人不理用户了，此时只能重启 gateway

# 零散笔记

## clawdbot 四大核心模块

![image.png|92](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260127175844247.png)

图源：[ClawdBot: The self-hosted AI that Siri should have been (Full setup)](https://www.youtube.com/watch?v=SaWSPZoPX34)

- 用户
- 网关：连接用户和各个消息平台。这样我就不需要知道各个信息平台的消息协议是什么，即不需要安装 app
- 智能体：AI 大模型，**初级**大脑
- Skills：扩展智能体的能力，类似之前很火的 function calling、mcp。一步步地进化了！
- Memory：持久化记忆

## Env variable 管理

在 `openclaw/src/infra/dotenv.ts` 中有一个 `loadDotEnv` 函数负责加载 `.env` 中设置的环境变量。 `.env` 会从 current workspace dir 和 global dir = `~/.openclaw/.env (or OPENCLAW_STATE_DIR/.env` 加载。global dir 作为 fallback，不会覆盖 current workspace dir 中已经设置的环境变量。

> [!NOTE] Gateway Service 的 CWD 在哪？
> ~~可以通过 `pwdx` 命令查看 PID 的工作目录，具体到 gateway 服务来说： `pwdx $(pgrep -f openclaw-gateway)`~~
> 默认的 cwd 是 `agents.defaults.workspace` 字段配置的 value

## 安装教程

- [保姆级Clawdbot教程来了，但我还是想劝大家悠着点](https://mp.weixin.qq.com/s/gRCZdwyK3xoD3VLrvxdDjQ)
	- 本地接入全流程
	- 包括如何接入 feishu/Lark bot
- [ClawdBot: The self-hosted AI that Siri should have been (Full setup)](https://www.youtube.com/watch?v=SaWSPZoPX34)
	- vps 购买
	- tailscale 配置
	- nodejs + pnpm 安装
	- 接入 telegram bot
	- 安装 homebrew，这是为之后 [[#skills 安装]] 做准备

## 安装实践

整体部署方案：

- nodejs + pnpm 负责安装各种插件、openclaw 本体等等
- 「可选」homebrew 负责安装额外的 skills 需要的底层依赖
- 接入 飞书 bot
- 拉入飞书群聊，每日往群内发送简报

### 新增一个用户

```bash
sudo su
adduser openclaw
usermod -aG sudo openclaw
reboot
```

删除此用户 `sudo deluser --remove-home openclaw`

### 安装 nodejs with pnpm

参考：[Node.js — Download Node.js®](https://nodejs.org/en/download)

> [!warning] 版本兼容
> 安装 Node 22 版本，24 版本可能有兼容性问题

```bash
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 22

# Verify the Node.js version:
node -v # Should print "v24.13.0".

# Download and install pnpm:
corepack enable pnpm

# Verify pnpm version:
pnpm -v

```

- **nvm (Node Version Manager):** 它是 Node.js 的“版本切换器”。它把 Node.js 装在你的用户目录下（如 `~/.nvm`），而不是系统目录。这样你安装工具时不需要 `sudo`，也不会搞乱 Linux 系统自带的组件。
- **pnpm (Performant npm):** 它被称为“表演级 npm”。它的厉害之处在于**节省空间**。
    - _例子：_ 如果你有 10 个插件都依赖同一个基础包，`npm` 会下载 10 次，而 `pnpm` 只会在硬盘存 1 次，然后用“硬链接”分给各个项目。
- **corepack enable pnpm:** 这是 Node.js 官方提供的一个开关，用来激活内置的 pnpm，让你不用再额外手动安装它。只要你安装了 Node.js（无论通过什么方式），`npm` 都是作为默认组件**自带**的。当你运行 `nvm install 24` 时，你的电脑里已经同时拥有了 `node` 和 `npm`。`pnpm` 是你额外开启的一个“增强版”工具。

### 部署 openclaw

可以先安装一下 tmux: `sudo apt install tmux -y`

参考：[openclaw — Personal AI Assistant](https://www.molt.bot)

- hackable + pnpm 的方式安装，方便开发
	```bash
	git clone https://github.com/openclaw/openclaw.git
	cd openclaw && pnpm install && pnpm run build
	pnpm run openclaw onboard
	```
- one line 安装
	```bash
	curl -fsSL https://molt.bot/install.sh | bash
	```

> [!NOTE] Hackable
> hackable + gateway service 的方式，通过此命令 debug 获取 log 信息：
> ```bash
> journalctl --user -u openclaw-gateway.service -f
> ```

### 申请飞书机器人

参考：

- [GitHub - m1heng/clawdbot-feishu](https://github.com/m1heng/Clawdbot-feishu)
- [GitHub - AlexAnys/feishu-clawdbot-bridge: Connect Feishu/Lark bot to Clawdbot AI agent via WebSocket — no public server, no domain, no ngrok needed](https://github.com/AlexAnys/feishu-clawdbot-bridge)

1. 打开 [飞书开放平台](https://open.feishu.cn/app)，登录
2. 点击 **创建自建应用**
3. 填写应用名称（随意，比如 "My AI Assistant"）
4. 进入应用 → **添加应用能力** → 选择 **机器人**
5. 进入 **权限管理**，开通以下权限：

Required Permissions:

| Permission                         | Scope     | Description                         |
| ---------------------------------- | --------- | ----------------------------------- |
| `contact:user.base:readonly`       | User info | Get basic user information          |
| `im:message`                       | Messaging | Send and receive messages           |
| `im:message.p2p_msg:readonly`      | DM        | Read direct messages to bot         |
| `im:message.group_at_msg:readonly` | Group     | Receive @mention messages in groups |
| `im:message:send_as_bot`           | Send      | Send messages as the bot            |
| `im:resource`                      | Media     | Upload and download images/files    |

Optional Permissions (for full functionality):

| Permission                  | Scope     | Description                         |
| --------------------------- | --------- | ----------------------------------- |
| `im:message.group_msg`      | Group     | Read all group messages (sensitive) |
| `im:message:readonly`       | Read      | Get message history                 |
| `im:message:update`         | Edit      | Update/edit sent messages           |
| `im:message:recall`         | Recall    | Recall sent messages                |
| `im:message.reactions:read` | Reactions | View message reactions              |

6. （此配置需要先 [[#安装 clawdbot-feishu-plugin]]）进入 **事件与回调** → **事件配置**：

    - 添加事件：`接收消息 im.message.receive_v1`
    - 请求方式选择：**使用长连接接收事件**（这是关键！），即 websocket

7. 发布应用（创建版本 → 申请上线）
8. 记下 **App ID** 和 **App Secret**（在 " 凭证与基础信息 " 页面）

### ~~安装 clawdbot-feishu-plugin~~

> [!important] DEPRECATED
> 原生支持了，不要再安装这个社区版本的插件

前置准备，安装的时候会报错，需要修改 `openclaw/src/entry.ts`，找到这一行： `const EXPERIMENTAL_WARNING_FLAG = "--disable-warning=ExperimentalWarning";` 将其修改为**空字符串**： `const EXPERIMENTAL_WARNING_FLAG = "";`

而后正常安装配置（安装后需要重启 gateway）：

- hackable 版本
	```bash
	pnpm run openclaw plugins install @m1heng-clawd/feishu
	pnpm run openclaw config set channels.feishu.appId "<your-app-id>"
	pnpm run openclaw config set channels.feishu.appSecret "<your-app-secret>"
	pnpm run openclaw config set channels.feishu.enabled true
	```
- source 版本：
	```bash
	openclaw plugins install @m1heng-clawd/feishu
	openclaw config set channels.feishu.appId "<your-app-id>"
	openclaw config set channels.feishu.appSecret "<your-app-secret>"
	openclaw config set channels.feishu.enabled true
	```

原理和开发核心逻辑：

1. 核心原理与实现工作

  这个插件本质上实现了 openclaw 定义的通用 ChannelPlugin 接口。具体做了以下几件事：

   * API 对接 (使用 SDK): 引入了 @larksuiteoapi/node-sdk (飞书官方 SDK)，处理复杂的鉴权（获取 Tenant Access Token）、加解密和 HTTP 请求。
   * 消息接收 (Gateway/Monitor):
       * 实现了 长连接 (WebSocket) 和 Webhook 两种模式来监听飞书的事件。
       * 规范化 (Normalization): 当飞书推送 im.message.receive_v1 事件时，插件会将飞书特有的 JSON 数据（包含 open_id, chat_id, message_type 等）转换成 openclaw 能理解的通用
         InboundContext 格式。
       * 内容清洗: 自动识别并去除消息中的 @机器人 前缀，处理富文本消息（Post）中的图片和文字。
   * 消息发送 (Outbound):
       * 将 openclaw 生成的回复（通常是 Markdown 文本）转换回飞书支持的格式。
       * 渲染策略: 实现了 renderMode。如果回复包含代码块或表格，插件会自动将其封装为飞书的 交互式卡片 (Interactive Card) 发送，以获得更好的显示效果；普通文本则作为 text
         消息发送。
   * 媒体处理:
       * 入站: 自动下载飞书消息中的图片和文件，保存到本地临时目录供 AI 读取。
       * 出站: 将 AI 生成的图片上传到飞书的 im/v1/images 接口并发送。

  2. 支持新 Channel (如 QQ) 的要求

  如果你想让 openclaw 支持 QQ（或其他聊天软件），你需要编写一个新的插件，遵循相同的架构。

  核心要求与步骤：

   3. 选择对接方式:
       * 官方方案 (推荐): 使用 QQ 开放平台 (QQ Guild/频道) 的官方 API。你需要申请 Bot AppID 和 Token。
       * 第三方/个人号: 使用类似 icqq / oicq 的协议库（风险较高，可能被封号）。

   4. 实现 `ChannelPlugin` 接口:
       * 需要在 index.ts 和 src/channel.ts 中定义插件的元数据、配置项（如 appId, token）和能力描述（是否支持富文本、撤回等）。

   5. 开发 " 监听器 " (Gateway):
       * QQ 官方 Bot 通常使用 WebSocket (Intents) 机制。你需要编写代码连接到 QQ 的网关，维持心跳，并监听 AT_MESSAGE_CREATE (群里@机器人) 或 DIRECT_MESSAGE_CREATE (私信)
         事件。

   6. 编写 " 适配器 " (Adapter):
       * 入站适配: 将 QQ 的事件对象转换为 openclaw 的标准输入格式。
           * 提取 content (消息内容)。
           * 提取 senderId (QQ 号或 OpenID)。
           * 提取 chatId (群号或频道 ID)。
       * 出站适配: 编写发送逻辑。当 openclaw 给出回复时，调用 QQ 的 API 发送消息。
           * 难点: QQ 的 Markdown 支持非常有限。你可能需要编写逻辑，将复杂的 Markdown 转换为纯文本，或者调用绘图库将其渲染成图片发送。

   7. 媒体与文件:
       * 实现图片的下载（供 AI 看）和上传（供 AI 发）。QQ 的图片通常通过 URL 发送，这比飞书上传 Key 的方式要简单一些。

  总结: 支持 QQ 不需要修改 openclaw 核心代码，只需要参照 clawdbot-feishu 的结构，新建一个项目，把里面的“飞书 SDK 调用”替换成“QQ API 调用”，并做好数据格式转换即可。

### 安装原生 feishu 插件

目前官方还没有把各种 channel 用独立的 nodejs package 管理，所以下面安装会报错找不到 `openclaw@feishu`：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260204154805738.png)

选用 local 安装即可

### 飞书机器人配对

官方原生采用 `pairing` 方式的 DM Policy，所以需要配对：

- 先给机器人发一条消息，会返回一个配对码
	```plaintext
	OpenClaw access not configured.
	
	Your Feishu Open ID: ou_xxxxxxxxxxxxxxxxxxxxxxx
	
	Pairing code: xxxxxxxx
	
	Ask the OpenClaw admin to approve with:
	openclaw pairing approve feishu xxxxxxxx
	```
- 执行 approve 命令：
	```bash
	# docker 方式部署
	docker compose run --rm openclaw-cli pairing approve feishu xxxxxxxx
	```

#### 一些飞书操作方法

- [如何获取用户的 Open ID - 开发指南 - 开发文档 - 飞书开放平台](https://open.feishu.cn/document/faq/trouble-shooting/how-to-obtain-openid?lang=zh-CN)

### 切换模型 

此内容在 [[#支持 openai compatible 模型]] 亦有描述

成功切换模型的配置：

```json
{
  "meta": {
    "lastTouchedVersion": "2026.1.24-3",
    "lastTouchedAt": "2026-01-28T10:03:29.633Z"
  },
  "wizard": {
    "lastRunAt": "2026-01-28T10:03:29.632Z",
    "lastRunVersion": "2026.1.24-3",
    "lastRunCommand": "doctor",
    "lastRunMode": "local"
  },
  "auth": {
    "profiles": {
      "qwen-portal:default": {
        "provider": "qwen-portal",
        "mode": "oauth"
      },
      "ollama-local:default": {
        "provider": "ollama-local",
        "mode": "api_key"
      }
    }
  },
  "models": {
    "providers": {
      "qwen-portal": {
        "baseUrl": "https://portal.qwen.ai/v1",
        "apiKey": "qwen-oauth",
        "api": "openai-completions",
        "models": [
          {
            "id": "coder-model",
            "name": "Qwen Coder",
            "reasoning": false,
            "input": [
              "text"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 128000,
            "maxTokens": 8192
          },
          {
            "id": "vision-model",
            "name": "Qwen Vision",
            "reasoning": false,
            "input": [
              "text",
              "image"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      },
      "ollama-local": {
        "baseUrl": "http://<your-ollama-host>:11434/v1",
        "apikey": "suibianxieyige",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3:30b",
            "name": "Qwen3 30B",
            "reasoning": false,
            "input": [
              "text"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 32768,
            "maxTokens": 8192
          },
          {
            "id": "nomic-embed-text:latest",
            "name": "Nomic Embed Text",
            "reasoning": false,
            "input": [
              "text"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 8192,
            "maxTokens": 2048
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "qwen-portal/coder-model"
      },
      "models": {
        "qwen-portal/coder-model": {
          "alias": "qwen"
        },
        "qwen-portal/vision-model": {},
	    "ollama-local/qwen3:30b": {}
      },
      "workspace": "/home/openclaw/clawd",
      "compaction": {
        "mode": "safeguard"
      },
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      }
    }
  },
  "messages": {
    "ackReactionScope": "group-mentions"
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto"
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "undefined"
    },
    "tailscale": {
      "mode": "off",
      "resetOnExit": false
    }
  },
  "skills": {
    "install": {
      "nodeManager": "npm"
    }
  },
  "plugins": {
    "entries": {
      "qwen-portal-auth": {
        "enabled": true
      }
    }
  }
}
```

参考官方的 [文档](https://docs.molt.bot/providers/ollama#explicit-setup-manual-models) 理解了一下这个 json，并且成功配置了。核心内容是：

```json
{
  models: {
    providers: {
      ollama: {
        // Use a host that includes /v1 for OpenAI-compatible APIs
        baseUrl: "http://ollama-host:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          {
            id: "llama3.3",
            name: "Llama 3.3",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

tips:

- ollama server 即使没有设置 API Key，也要在 `apiKey` 字段随便写一个，否者会报错：
	```plaintext
	03:14:46 [diagnostic] lane task error: lane=main durationMs=12 error="Error: No API key found for provider "ollama-local". Auth store: /home/openclaw/.openclaw/agents/main/agent/auth-profiles.json (agentDir: /home/openclaw/.openclaw/agents/main/agent). Configure auth for this agent (clawdbot agents add <id>) or copy auth-profiles.json from the main agentDir."
	03:14:46 [diagnostic] lane task error: lane=session:agent:main:main durationMs=14 error="Error: No API key found for provider "ollama-local". Auth store: /home/openclaw/.openclaw/agents/main/agent/auth-profiles.json (agentDir: /home/openclaw/.openclaw/agents/main/agent). Configure auth for this agent (clawdbot agents add <id>) or copy auth-profiles.json from the main agentDir."
	03:14:46 [clawdbot] Unhandled promise rejection: Error: Unhandled API in mapOptionsForApi: undefined
	    at mapOptionsForApi (file:///home/openclaw/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/node_modules/@mariozechner/pi-ai/src/stream.ts:471:10)
	    at streamSimple (file:///home/openclaw/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/node_modules/@mariozechner/pi-ai/src/stream.ts:218:26)
	    at streamAssistantResponse (file:///home/openclaw/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/node_modules/@mariozechner/pi-agent-core/src/agent-loop.ts:233:25)
	    at runLoop (file:///home/openclaw/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/node_modules/@mariozechner/pi-agent-core/src/agent-loop.ts:141:20)
	    at file:///home/openclaw/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/node_modules/@mariozechner/pi-agent-core/src/agent-loop.ts:51:3
	```
- 使用官方说的 `export OLLAMA_API_KEY="ollama-local"` 方案也不行，一定要配置 `apiKey` 字段

## 配置 web search

在 `config` -> `tools` -> `Web` 配置：

- Enable Web Fetch Tool
- Brave Search API Key
- Web Search Provider：brave

## skills 安装

### 前置安装——homebrew

很多依赖都要通过 homebrew 来安装

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

然后按照 `==> Next Steps:` 的提示一步步完成最后的步骤，包括：

- 修改 bashrc 或者 zshrc 等等，会自动提示
- 安装 `build-essential`
- 「optional」: `brew install gcc`

### 1. 自动化的 Skill 安装

openclaw 有一套“智能安装机制”。当你通过命令或 Dashboard 安装一个新 Skill（例如 `padel` 或 `spotify`）时，它会读取该 Skill 的配置文件。

- **如果 Skill 声明了依赖：** 比如某个 Skill 需要用到 `go` 语言环境或者特定的系统工具。
- **openclaw 的选择：** 它会检查你的系统里有没有 **Homebrew**。如果有，它会优先尝试用 `brew install` 来帮你把底层的依赖装好（这就是配置里 `install.preferBrew: true` 的作用）。
- **如果没有 Homebrew：** 它会尝试用 `npm`、`pnpm` 或者直接下载二进制文件。

### 2. 不同类型的 Skill 来源

安装 Skill 主要有三种方式，不一定都和 Homebrew 有关：

- **ClawdHub（官方市场）：** 就像 App Store。你在 Dashboard 里点一下“安装”，openclaw 就会自动在后台帮你搞定一切（包括调用 Homebrew 装依赖）。
- **Managed Skills (`~/.openclaw/skills`)：** 这是你手动下载或开发的 Skill 文件夹。只要把文件夹放进去，openclaw 就会识别。
- **Workspace Skills：** 你在某个特定项目文件夹下开发的 Skill。

### 3. Linux 上的特殊情况

因为你用的是 **Linux**，虽然 Linux 也可以装 Homebrew（Linuxbrew），但大多数 Linux 用户更习惯用 `apt`。

- 如果你**没装** Homebrew，openclaw 会很聪明地改用 `npm` 或其他方式来安装 Skill 需要的组件。
- 如果你**装了** Homebrew，它会觉得“太好了，我有了一个标准的跨平台安装器”，然后愉快地使用它。

## 定时任务

下面两个是成功设置的任务，第一个是给最近的私聊用户发定时简报，第二个是发送到特定的群组里面。

群聊中添加对应的机器人， @它让它去完成定时任务即可，它会自动获取群组 ID 的（虽然飞书客户端不能直接看到用户 ID 和 群聊 ID）

- 用户 ID 通常是 `ou_xxxxxxxxxxxx`
- 群聊 ID 通常是 `oc_xxxxxxxxxxx`

> [!NOTE] 下文的 jobs.json 前置补充
> - 在 `payload` 字段的 `channel` 和 `to` 指定发送到哪里（哪个用户 or 哪个群）
> - 可以通过 `openclaw channels list` 查看当前支持的 channel

执行 `cat ~/.openclaw/cron/jobs.json`，得到：

```json
{
  "version": 1,
  "jobs": [
    {
      "id": "e596eac0-bcb3-41c5-a1a5-f781004a5d93",
      "name": "每分钟嵌入式AI芯片简报测试",
      "enabled": true,
      "deleteAfterRun": false,
      "createdAtMs": 1769603073553,
      "updatedAtMs": 1769603580001,
      "schedule": {
        "kind": "cron",
        "expr": "* * * * *"
      },
      "sessionTarget": "isolated",
      "wakeMode": "next-heartbeat",
      "payload": {
        "kind": "agentTurn",
        "message": "正在为你收集嵌入式AI芯片领域的最新资讯和简报...",
        "deliver": true,
        "channel": "last"
      },
      "isolation": {
        "postToMainPrefix": "Cron",
        "postToMainMode": "summary",
        "postToMainMaxChars": 8000
      },
      "state": {
        "nextRunAtMs": 1769603640000,
        "lastRunAtMs": 1769603580001,
        "lastStatus": "ok",
        "lastDurationMs": 14081
      }
    },
    {
      "id": "76bc3413-850b-43b1-aca5-05423876c524",
      "name": "每分钟问候测试",
      "enabled": true,
      "deleteAfterRun": false,
      "createdAtMs": 1769603080576,
      "updatedAtMs": 1769603580001,
      "schedule": {
        "kind": "cron",
        "expr": "* * * * *"
      },
      "sessionTarget": "isolated",
      "wakeMode": "next-heartbeat",
      "payload": {
        "kind": "agentTurn",
        "message": "你好！这是一个定时问候消息。",
        "deliver": true,
        "channel": "feishu",
        "to": "oc_<your-group-id>"
      },
      "isolation": {
        "postToMainPrefix": "Cron",
        "postToMainMode": "summary",
        "postToMainMaxChars": 8000
      },
      "state": {
        "nextRunAtMs": 1769603640000,
        "lastRunAtMs": 1769603594088,
        "lastStatus": "ok",
        "lastDurationMs": 3384
      }
    }
  ]
```

## dashboard 访问权限管理

默认情况下，出于安全考虑，是不能直接通过 `http://<ip>:18789` 访问后台管理页面的，会报错：

`disconnected (1008): control ui requires HTTPS or localhost (secure context)`

虽然可以把这个安全考虑的选项关了，设置 `gateway.controlUi.allowInsecureAuth = true`

```json
"gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "controlUi": {
      "allowInsecureAuth": true
    },
    ...
...
```

但是为了安全考虑（有点绕 hhh），我们用别的方法解决这个问题：

- tailscale
- openssl + nginx

### tailscale

- 优点：直接一键搞定 `https` 访问
- 缺点：需要申请账号，并且把设备加入到自己的账号里面。

原理：

- **MagicDNS 与 域名生成**： 当你加入 Tailscale 后，它会给你一个专属的网域名称（Tailnet），格式通常是 `[设备名].[你的ID].ts.net`。这就像是给了你的内网设备一个在互联网上独一无二的“身份证”。
- **自动申请 HTTPS 证书**： Tailscale 内置了一个功能，可以自动向 Let's Encrypt 申请该域名的 SSL 证书。你不需要去搞复杂的证书申请流程，它在后台帮你搞定了。

### openssl + nginx

- 优点：免费、不依赖任何账号
- 缺点：自签名证书不受信任，每次浏览器打开之后都需要点击 “高级” -> " 继续前往 " 等字样

原理：

通过 OpenSSL，你可以手动生成一对**私钥**和**证书**。然后配置 Nginx：

- **监听 443 端口**。
- **加载这两个证书文件**。
- **反向代理**到你目前报错的那个 HTTP 服务。

> [!question] 怎么理解“反向”代理？
> 
> 
> 理解“反向”之前，我们要先看什么是“正向”。
> 
> - **正向代理 (Forward Proxy)**： **它是为了保护客户端（你）的。** 比如你用梯子访问外部网站，浏览器把请求发给代理服务器，代理服务器再去帮你看外面的世界，目标网站只知道代理服务器来过，不知道是你访问的。
>     
>     > **口诀：** 它是你的“替身”，帮你看外面的世界。
>     
> - **反向代理 (Reverse Proxy)**： **它是为了保护服务端（你的 Unraid 服务）的。** 当你访问 `https://192.168.1.100` 时，其实你访问的是 Nginx。Nginx 接到请求后，转身去后台问真正的服务（比如端口 18789）要内容，拿回来后再塞给你。
>     
>     > **口诀：** 它是服务的“前台”，帮你打理进出的客人。

操作步骤

```bash
sudo apt update
sudo apt install nginx -y
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048   -keyout /etc/nginx/ssl/openclaw.key   -out /etc/nginx/ssl/openclaw.crt   -subj "/C=CN/ST=State/L=City/O=MyHome/CN=<your-server-ip>"
sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/openclaw_dashboard
server {
    listen 18790 ssl;
    server_name <your-server-ip>;

    ssl_certificate /etc/nginx/ssl/openclaw.crt;
    ssl_certificate_key /etc/nginx/ssl/openclaw.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:18789;
        
        # 传递必要的 Header
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # 支持 WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF'
sudo ln -s /etc/nginx/sites-available/openclaw_dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

打开 `https://<your-server-ip>:18789/` 提示：

```
disconnected (1008): unauthorized: gateway token missing (open the dashboard URL and paste the token in Control UI settings)

This gateway requires auth. Add a token or password, then click Connect.

openclaw dashboard --no-open → open the Control UI  
openclaw doctor --generate-gateway-token → set token
```

说明需要 `token`，切换到侧边栏的 overview 页面，在 `Gateway Token` 一栏写上 gateway 配置的 token 即可。

此时还有可能会提示 `disconnected (1008): pairing required`，也就是需要配对一下。在部署部署的机器上执行 `openclaw devices list` 可以看到 `Pending` 和 `Paired` 两种状态的设备，复制 `Pending` 中 `Request` 那一列的数字，执行：

```bash
openclaw devices approve <RequestID>
```

> [!tips] 信任自建的证书
> 如果嫌每次打开网站都很麻烦，把 `openclaw.crt` 文件拷贝到电脑里，双击安装证书即可

## 支持 openai compatible 模型

比如我自己充值了 `ohmygpt`

节选 `openclaw.json`:

```json
  "models": {
      "providers": {
        "ohmygpt": {
          "baseUrl": "https://apic1.ohmycdn.com/v1",
          "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxx",
          "api": "openai-completions",
          "models": [
            {
              "id": "gpt-4o-mini",
              "name": "GPT 4o mini",
              "reasoning": false,
              "input": [
                "text"
              ],
              "cost": {
                "input": 0,
                "output": 0,
                "cacheRead": 0,
                "cacheWrite": 0
              },
              "contextWindow": 128000,
              "maxTokens": 8192
            }
          ]
        },
...
...
  "agents": {
      "defaults": {
        "model": {
          "primary": "qwen-portal/coder-model"
        },
        "models": {
          "qwen-portal/coder-model": {
            "alias": "qwen"
          },
          "qwen-portal/vision-model": {},
          "ollama-local/qwen3:30b": {},
          "ohmygpt/gpt-4o-mini": {}
```

要点：

- baseUrl 需要填写 v1 后缀版本
- apiKey 正常填写
- api 写 `openai-completions`
- `contextWindow` 和 `maxTokens` 我随便乱填的，目前不知道有什么作用
- `agents.defaults.models` 要把 `ohmygpt/gpt-4o-mini` 加进去，否则 `openclaw models list` 看不到这个模型。填写的规则就是 `<provider>/<model_id>`

> [!important] 模型要求
> 在尝试 `gpt-4o-mini` 之前，我试过 `gpt-3.5-turbo`，但是模型一直出不来回复，并且后台没什么 log 信息都没有。无论怎么修改 `baseUrl` `api` 字段都没有用。我猜测应该是 3.5 的上下文窗口不够，只有 `16.4K`，被挤爆了。

> [!NOTE] Tips
> gateway 会动态加载 `openclaw.json`，所以不需要重启 gateway

## 配置 openai-image-gen

当前的 openai-image-gen 是通过 `scripts/gen.py` 来生成 http request 去获取 openai 生成的图像。它不支持其他的端点是因为代码里面写死了：

```python
def request_images(
    api_key: str,
    prompt: str,
    model: str,
    size: str,
    quality: str,
    background: str = "",
    output_format: str = "",
    style: str = "",
) -> dict:
    url = "https://api.openai.com/v1/images/generations"
    args = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "n": 1,
    }
```

这个文件位置在：

`/home/openclaw/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/skills/openai-image-gen/scripts/gen.py`

想要修复也就简单了，直接把 url 换成你购买的 API 供应商的端点，比如我的：

```python
url = "https://api.ohmygpt.com/v1/images/generations"
```

> [!important] OPENAI_API_KEY 配置
> 这个 skill 默认是读取的 `~/.openclaw/.env` 里面配置的 `OPENAI_API_KEY`（对应代码： `api_key = (os.environ.get("OPENAI_API_KEY") or "").strip()`），而不是在 `~/.openclaw/openclaw.json` 里面 `openai-image-gen.apiKey` 字段配置的 api key。所以需要在 `~/.openclaw/.env` 里面设置，**并且设置后需要重新启动网关**

## 配置 openai-whisper-api

比 [[#配置 openai-image-gen]] 还暴力，直接 `vim openclaw/skills/openai-whisper-api/scripts/transcribe.sh`: 

```bash
curl -sS https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Accept: application/json" \
  -F "file=@${in}" \
  -F "model=${model}" \
  -F "response_format=${response_format}" \
  ${language:+-F "language=${language}"} \
  ${prompt:+-F "prompt=${prompt}"} \
  >"$out"
```

所以网址改成 `https://api.ohmygpt.com/v1/audio/transcriptions` 就行了

## sandbox 是什么？

可以用于区分不同的用户吗？

> [!quote] Sandbox
> If `agents.defaults.sandbox` is enabled, non-main sessions can use per-session sandbox workspaces under `agents.defaults.sandbox.workspaceRoot`.

## multi-agent routing

> [!quote] Multi-Agent
> Multi-agent routing can use different workspaces per agent. See [Channel routing](https://docs.openclaw.ai/concepts/channel-routing) for routing configuration.

## telegram 配置代理

配置 `channels.telegram.proxy` 字段：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260203190810051.png)

图源：[Vrusto@Discord](https://discordapp.com/channels/1456350064065904867/1467436108529799262)

## memory_search && memory_get tools 工作原理

真正的 API 调用逻辑封装在以下文件中：

   - OpenAI: `openclaw/src/memory/embeddings-openai.ts` (实现 embedQuery 调用 OpenAI embeddings API)
   - Gemini: `openclaw/src/memory/embeddings-gemini.ts` (实现 embedQuery 调用 Google Gemini embeddings API)
   - Batch 处理: `openclaw/src/memory/batch-openai.ts` 和 `openclaw/src/memory/batch-gemini.ts` (用于在索引大量文件时进行批量向量化，提高效率)

  总结

   - 调用层: `memory-tool.ts` 负责接收参数并转发给 manager。
   - 逻辑层: `manager.ts` 负责编排搜索逻辑（关键词 + 向量混合搜索）。
   - 驱动层: `embeddings.ts` 及其子文件 (`embeddings-*.ts`) 负责真正的“原生支持”，即直接调用 OpenAI 或 Gemini 的接口将文本转化为向量。

### 原生支持 local、openai 和 gemini 三种方式

```json
// 方式 A: OpenAI (默认/推荐)

{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "openai",
        "remote": {
          "baseUrl": "https://api.openai.com/v1",
          "apiKey": "sk-..."
        },
        "model": "text-embedding-3-small"
      }
    }
  }
}

// 方式 B: Gemini

{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "gemini",
        "remote": {
          "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
          "apiKey": "AIza..."
        },
        "model": "models/text-embedding-004"
      }
    }
  }
}

// 方式 C: Local (本地模型)

{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "local",
        "local": {
          "modelPath": "/path/to/your/model.gguf"
        }
      }
    }
  }
}
```

以 `openai` 为例，支持三种方式的 `baseUrl`:

```ts
const baseUrl = remoteBaseUrl || providerConfig?.baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL;
```

- `remoteBaseUrl`： 来自 agents.defaults.memorySearch.remote.baseUrl`
- `providerConfig?.baseUrl?.trim()`： 来自 `models.providers.openai.baseUrl`
- `DEFAULT_OPENAI_BASE_URL`： 是硬编码常量 `"https://api.openai.com/v1"`

## Channel Routing 机制

[Channel Routing - OpenClaw](https://docs.openclaw.ai/channels/channel-routing)

- **私聊**：通常指向 Agent 的“主大脑”（Main Session），AI 认得你。
- **群聊**：AI 为每个群建立独立的记忆（`agent:<agentId>:<channel>:group:<id>`）。这样群 A 的聊天内容，群 B 的 AI 就不知道，保证了隐私和逻辑独立。
- **贴文/线程**：支持 Slack 或 Discord 的 Thread。如果在一个帖子下回复，AI 只会带上那个帖子的上下文，举例：
	- Slack/Discord：`agent:main:discord:channel:123456:thread:987654`
	- Telegram：`agent:main:telegram:group:-1001234567890:topic:42`

### 1. 基础准备：定义你的 Agent

首先，你得有一个“大脑”定义，通过如下命令添加：

```bash
docker compose run --rm openclaw-cli agents add work
```

`openclaw.json` 自动就会更新 `agents.list` 字段：

```json
{
  "agents": {
    "list": [
      {
        "id": "my_assistant",
        "name": "核心助理",
        "workspace": "~/.openclaw/workspaces-my_assistant",
		"agentDir": "~/.openclaw/agents/my_assistant/agent"
        "default": true
      }
    ]
  }
}
```

### 2. 场景配置方案

#### 场景 A：私聊（共享“主大脑”记忆）

**目标**：无论你在 Telegram 还是 WhatsApp 找它，它都记得你是谁，维持一个连续的“主记忆”。

- **如何实现**：OpenClaw 会**自动**将私聊（Direct Messages）路由到 `agent:<agentId>:main`。
- **配置**：无需特殊操作，只要它是你的默认 Agent，私聊就会落入主 Session。

#### 场景 B：群聊（群与群之间记忆隔离）

**目标**：群 A 的八卦，AI 在群 B 绝对不会提。

- **如何实现**：OpenClaw **默认**会根据 `channel` + `groupId` 生成 **Session Key**。
- **配置建议**：如果你想让某个特定的群使用特定的 Agent（比如开发群用“技术 Agent”），可以这样写：
	```json
	{
	  "bindings": [
	    {
	      "match": {
	        "channel": "telegram",
	        "peer": { "kind": "group", "id": "-100123456789" } 
	      },
	      "agentId": "my_assistant"
	    }
	  ]
	}
	```

> **注意**：即便多个群绑定到同一个 `agentId`，OpenClaw 也会因为 `groupId` 不同，自动为它们开辟不同的 `.jsonl` 存储文件。

#### 场景 C：贴文/线程（Thread 级隔离）

**目标**：在 Discord 或 Slack 的某个帖子（Thread）里对话，AI 只看这个帖子里的上下文，不被主频道刷屏干扰。

- **如何实现**：这是 OpenClaw 的**内置路由算法**。
- **原理**：当消息带有 `threadId`（或 Telegram 的 `topicId`）时，生成的 Session Key 会自动追加后缀。例如：`agent:main:discord:channel:123:thread:456`。
- **配置**：**完全无需配置**。只要你的 Discord/Slack 插件正常运行，AI 自动就会“锁”在线程里。

### 3. 进阶：如何验证记忆是否隔离？

你可以通过检查文件系统来确认 OpenClaw 是否按照你的预期建立了不同的“抽屉”：

查看路径：`~/.openclaw/agents/my_assistant/sessions/`

在该目录下，你会看到类似这样的文件：

- `main.jsonl` —— **你的私聊主记忆**
- `telegram-group--100123456789.jsonl` —— **群 A 的专属记忆**
- `discord-channel-123-thread-456.jsonl` —— **某个具体帖子的记忆**

### 4. 总结配置模版

如果你想一步到位，你的 `openclaw.json` 核心部分应该长这样：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace-main",
        "default": true 
      }
    ]
  },
  "bindings": [
    // 默认情况下，不写绑定也会按 channel/group 分流
    // 如果你有特殊需求，可以在这里强制指定某个群给某个 Agent
  ]
}
```

### 下一步建议：

1. **获取 ID**：如果你想针对特定群做配置，可以先在群里发一条消息给 AI，然后运行 `openclaw logs`。你会看到类似 `[Incoming] peer: { kind: 'group', id: '-100...' }` 的字样，那就是该群的唯一 ID。
2. **测试隔离**：在群 A 告诉 AI 一个秘密，去群 B 问它，看它是否真的“守口如瓶”。

### 如何让不同的私聊用户路由到不同的 Agent

通过 `bindings` 里的 `peer.id` 来精确匹配。每个用户的 `peer.id`（通常是他们的平台内部 ID）是唯一的。

```json
{
  "bindings": [
    {
      "match": { "channel": "discord", "peer": { "kind": "direct", "id": "用户A的ID" } },
      "agentId": "agent_expert"
    },
    {
      "match": { "channel": "discord", "peer": { "kind": "direct", "id": "用户B的ID" } },
      "agentId": "agent_beginner"
    }
  ]
}
```

## 多用户支持

对 [[#如何让不同的私聊用户路由到不同的 Agent]] 问题更进一步引申，如何支持多用户，目前可以从三个粒度来进行区分：

- multi sessions：参考 [Session Management - OpenClaw](https://docs.openclaw.ai/concepts/session)
- multi agents：参考 [Multi-Agent Routing - OpenClaw](https://docs.openclaw.ai/concepts/multi-agent)
- multi 部署实例：直接复制 `~/.openclaw/` 成多份，一个目录就是一个运行的实例（类比 VPS）

补充资料，memory 管理：[Memory - OpenClaw](https://docs.openclaw.ai/concepts/memory)

### Session 管理

#### 单聊和群聊的管理机制

- 单聊（直接对话）：无论在哪个聊天软件和 agent 直接对话，都是直接在主 session 和 agent 对话。默认的 session 名字是 `agent:<agentId>:<mainKey>`（默认是 `main`）。可以设置 `session.mainKey` 来改变 `mainKey`。
	- 早上你在 **Telegram** 给 Agent 留言：“帮我记得买牛奶”。
	- 下午你在 **WhatsApp** 问它：“我早上让你记得买什么？”
	- **结果**：它能答出来。因为它把所有平台的私聊都看作是 `main` 会话。
- 群聊：不同的 group or channel 的对话有独立的 `key`
	- 你在“公司群”里讨论的技术细节，绝对不会出现在你和 AI 的“私聊”记忆里，也不会出现在“家庭群”里。
	- **群聊使用的是独立 session 管理机制，具体参考 [[#Agent Routing 机制]]**。会对不同 channel 的不同 group 的不同 thread 都进行区分。做到独立的上下文。

上述描述时，单聊默认是组织到一起的，但是也可以进行设置：

- `main`: `agent:<agentId>:<mainKey>` 所有的单聊共享 main session
- `per-peer`: `agent:<agentId>:dm:<peerId>` 每个人有独立的 session，不同聊天软件（channel）之间是共享的
- `per-channel-peer`: `agent:<agentId>:<channel>:dm:<peerId>` 每个人的每个聊天软件都有独立的 session
- `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:dm:<peerId>` 一个 openclaw 可以部署多个机器人账号，这些机器人账号之间默认共享 session，这样二者可以轮流接待用户也没问题。但是这个设置打开之后，每个机器人账号不共享 session。如果确实一个聊天软件（channel）多个机器人（account）的话，还是建议打开这个选项，不要共享。

除了私聊和群聊以外，还有会其他的任务会创建 session：

- Cron jobs: `cron:<job.id>`
- Webhooks: `hook:<uuid>`
- Node runs: `node-<nodeId>`

#### 生命周期

- 自动：
	- 每日重置
	- 闲置重制
	- 定制化重置：
		- **`resetByType`**：你可以让**私聊**（DM）永不过期，但让**群聊**（Group）每两小时忘一次，让**帖子**（Thread）每天重置。
		- **`resetByChannel`**：你可以让 Discord 永远不重置，但让 Telegram 严格执行凌晨 4 点重置。
- 手动：
	- `/new <model_name>`
	- `/reset`
	- 直接删除 `jsonl` 会话文件
- 特殊情况：
	- 定时任务的每次任务都是独立的，互不干扰。

### Memory 管理

#### 记忆级别

在 `agents.<agentId>.workspace` 中，存在两个级别的记忆（纯 markdown 文件）：

- 长期记忆： `MEMORY.md`
	- 只在私聊的 main session 中加载
- 短期记忆： `memory/YYYY-MM-DD.md`
	- 在 session 启动时读取今天 + 昨天的记忆

#### 何时写入记忆

- 决策、偏好和持久性的事实会保存到长期记忆
- 日常笔记和运行上下文记录在短期记忆
- 如果用户说记住这个，会从 RAM 里把它写到磁盘

#### 向量化记忆搜索

通过构建向量索引，方便在措辞不同的情况下也能找到相关的“笔记”。

需要配置具体的 embedding 去做向量化，默认有 local、gemini、openai。

#### QMD 搜索引擎

| **特性**    | **默认 SQLite 索引** | **QMD 后端 (推荐)**  |
| --------- | ---------------- | ---------------- |
| **搜索深度**  | 只能找文件名或简单匹配      | 深度理解文档内容         |
| **模糊查询**  | 较差               | 极强（懂语义）          |
| **处理大文件** | 性能一般             | 极快（专为大规模 RAG 设计） |
| **精准度**   | 容易漏掉细节           | 经过重排序，结果极准       |

> [!NOTE] 什么是 QMD
> QMD 是一个 **Local-first（本地优先）的搜索侧车（Sidecar）**。 它不是简单的文字匹配，而是结合了三种顶级搜索技术：
> 
> - **BM25 (传统搜索)**：类似百度/谷歌，精准匹配关键词（比如搜“发票”，它能找包含这个词的文档）。
> - **Vectors (向量搜索/语义搜索)**：理解意思。即使你搜“报销”，它也能帮你找到包含“账单”的文件，因为它知道这两者语义相关。
> - **Reranking (重排序)**：AI 搜出一堆结果后，会再过一遍脑子，把**最相关**的那几条放到最前面递给 AI。

- 所有的知识和记忆依然以 `.md` 文件的形式存在你的硬盘里（比如你的 Workspace 或笔记）。
- **QMD 的角色**：它只是一个**索引器**（Indexer）。它扫描这些 Markdown 文件，在旁边建立一个复杂的索引地图。
- **优势**：如果你想修改 AI 的记忆，直接去改那个 `.md` 文件就行了。你不需要去学怎么操作数据库，改完文件，QMD 自动就会更新。
- 建议：如果你只是跟 AI 闲聊，不需要开它。但如果你打算把 **大量个人笔记、项目文档、代码库** 丢给 AI 处理，开启 `qmd` 会让 AI 的聪明程度提升一个量级。

#### 额外的记忆搜索路径

```json
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

- Paths 可以是绝对路径或者相对 workspace 的路径
- 目录会递归查找 markdown 文件
- 只有 markdown 文件会被索引
- symbollinks 会被忽略

### Multi-Agent 路由

一个网关可以支持多个独立的同一聊天软件（channel）、多个独立的 Agents 存在。

一个 Agent 是一个独立的大脑，包括：

- `Workspace`：工作目录，存放 `SOUL.md/USER.md` 等文件、运行产出物文件等。
- `State Directory(agentDir)`：每个 Agent 独立的配置、模型库、auth 认证信息
- `Session Store`：聊天历史

#### Paths (quick map)

- Config: `~/.openclaw/openclaw.json` (or `OPENCLAW_CONFIG_PATH`)
- State dir: `~/.openclaw` (or `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (or `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (or `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

Skills 可以独立和共享：

- 每个 agent 的 workspace 目录下的 `skills/` 目录存放自己能用的 skills
- [默认配置目录下的 `~/.openclaw/skills/`  存放共享的 skills](https://docs.openclaw.ai/tools/skills#per-agent-vs-shared-skills)

#### 路由规则

`bindings` 字段根据这些字段匹配路由，优先级从高到低：

1. `peer` match (exact DM/group/channel id)
2. `guildId` (Discord)
3. `teamId` (Slack)
4. `accountId` match for a channel
5. channel-level match (`accountId: "*"`)
6. fallback to default agent (`agents.list[].default`, else first list entry, default: `main`)

### 多用户支持随笔

docker 的方式可以通过命名卷（Named Volume）来管理容器内的 `/home/node` 路径，这样 openclaw 运行过程中产生的缓存、下载好的 playwirght 组件可以再次复用，而不是每次都要重装。

---

## Discord 相关

### 创建服务器

- **点击加号**：在 Discord 左侧侧边栏的最下方，点击那个 **“+”** 号。
- **选择模板**：你可以选择“亲自创建”，或者使用官方提供的模板（如：游戏、俱乐部等）。
- **命名与头像**：给你的服务器起个响亮的名字，上传一个头像，点击“创建”即可。
- **开发模式**：让 Discord App 使能开发模式：
	1. Click **User Settings** (gear icon next to your avatar) → **Advanced**→ toggle on **Developer Mode**
	2. Right-click your **server icon** in the sidebar → **Copy Server ID**
	3. Right-click your **own avatar** → **Copy User ID**
- **允许从服务器私聊别的用户**：Right-click your **server icon** → **Privacy Settings** → toggle on **Direct Messages**.

### 创建机器人

在 Discord 的“户籍科”给你的机器人办个准入证：

1. **访问开发者门户**：前往 [Discord Developer Portal](https://discord.com/developers/applications)。
2. **创建应用**：点击右上角的 **"New Application"**，给它起个名字。
3. **配置 Bot**：
    
    - 在左侧菜单点击 **"Bot"**。
    - 点击 **"Reset Token"**（或者直接复制 Token）。**注意：** 这个 Token 是机器人的密码，千万不要发给别人。
        
4. **开启权限（关键）**：
    
    - 在 Bot 页面下拉，找到 **"Privileged Gateway Intents"**。
    - 开启：
	    - **Message Content Intent** (required)
		- **Server Members Intent** (recommended; required for role allowlists and name-to-ID matching)
		- **Presence Intent** (optional; only needed for presence updates)
        
5. **邀请进服务器**：
    
    - 点击左侧 **"OAuth2"** -> **"URL Generator"**。
    - 勾选 `bot` 和 applications.commands`
    - Bot Permissions 选择必要的：
	    - View Channels
		- Send Messages
		- Read Message History
		- Embed Links
		- Attach Files
		- Add Reactions (optional)
		- 还有很多权限，特别是只涉及到读的权限，放心开就是了，自己的服务器，不邀请别人，所有的东西都可以让 bot 看
    - 复制生成的 URL，粘贴到浏览器打开，选择你的服务器即可。

### 配置 Openclaw

- 设置环境变量 `DISCORD_BOT_TOKEN=xxxxxx` 连接到机器人
- 配置 `openclaw.json`

```json
  "channels": {
	"discord": {
	  "enabled": true,
	  "groupPolicy": "open"
	}
  },
```

网络问题：

- 后续的版本支持 `channels.discord.proxy` 字段 [配置代理](https://docs.openclaw.ai/channels/discord#feature-details)，不然 openclaw 无法连接到 discord 官方服务
- 当前可用的解决办法
	```bash
	sudo apt install proxychains4 -y
	sudo vim /etc/proxychains4.conf
	```

	文件内容：

	```plaintext
	localnet 127.0.0.0/255.0.0.0
	localnet 192.168.0.0/255.255.0.0
	
	[ProxyList]
	http <your-proxy-ip> <your-proxy-port>
	```

只需要给你想执行的命令加上 `proxychains4 ` 前缀即可，比如 `proxychains4 curl ipinfo.io`

### 怎么创建 Thread

Tips:

- **Sandbox (沙箱)**： 如果你怕 AI 在你真实的 Workspace 里乱删文件，可以配置沙箱。每个运行的 Loop 会在一个临时的、隔离的文件夹里操作，干完活再同步回来。
- **Lifecycle Events (生命周期事件)**： 你会看到 `stream: lifecycle`。它会告诉你 AI 现在是在“组装上下文（start）”、“执行工具（tool）”还是“收尾（end）”。这对于你在 Discord 里判断 AI 为什么还没回你有很大帮助。

---

## 密钥管理

[Secrets Management - OpenClaw](https://docs.openclaw.ai/gateway/secrets)

## Trusted Proxy Auth

[Trusted proxy auth - OpenClaw](https://docs.openclaw.ai/gateway/trusted-proxy-auth)

nginx + oauth2 方案：[Trusted proxy auth - OpenClaw](https://docs.openclaw.ai/gateway/trusted-proxy-auth#nginx-%2B-oauth2-proxy)

## 后台执行任务与进度监控

[Background Exec and Process Tool - OpenClaw](https://docs.openclaw.ai/gateway/background-process)

目的：执行长时任务的时候，如果通过“旧时代”的台前 `exec` 命令去执行 shell command 的话，那么 openclaw 对话就会一直阻塞在这个任务上，而且需要定时的**耗费大量 token** 的去检查任务完成没有。通过引入 Background Exec 能够做到异步执行，减少 token 的消耗。

在只有前台 `exec` 的时代，有人通过 [claude code hooks](https://github.com/win4r/claude-code-hooks) 实现主动推送（push）到 openclaw 来，和上述 openclaw 主动拉（pull）的方案是一组对比。具体原理是：

- openclaw 调用 shell 脚本，shell 脚本是开启一个后台的 claude code 去完成编程任务，然后 shell 脚本就退出了，不会阻塞 openclaw
- claude code 完成任务后触发设定好的 hooks，hooks 中主动调用 openclaw 命令 send message 到 channel 中，用户收到任务完成的信息

## 性能优化

- bug: [\[Bug\]: CLI is extremely slow on pi4b · Issue #5871 · openclaw/openclaw · GitHub](https://github.com/openclaw/openclaw/issues/5871)
	- -> fix: [CLI: add root --help fast path and lazy channel option resolution by vincentkoc · Pull Request #30975 · openclaw/openclaw · GitHub](https://github.com/openclaw/openclaw/pull/30975)

# 附录

## `/model` 命令的影响范围

如果设置了 `dmScope: "per-peer"`（或 `per-channel-peer` 等隔离策略），每个人的模型设置不会互相影响。

### sesssion 文件管理核心机制

#### 1. `sessions.json` 是一个映射表（Map）

* 这个文件里面存储的不仅仅是一个 JSON 对象，而是一个**键值对（Key-Value）**结构。
* **Key（键）**：是 `SessionKey`，由 `dmScope` 规则生成。
    * 如果是默认配置，所有私聊的 Key 都是 `agent:main:main`。
    * 如果是 `per-peer` 配置，每个用户的 Key 都不一样，例如 `agent:main:direct:user123`。
* **Value（值）**：是 `SessionEntry`，包含了该会话的所有元数据，包括 `modelOverride`（模型设置）、`sessionId`（指向具体的 `.jsonl` 文件）、`updatedAt` 等。

#### 2. 文件结构示例

如果您的 `sessions.json` 内容展开来看，在设置了 `dmScope: per-peer` 的情况下可能是这样的：

```json
{
  "agent:main:direct:alice": {
    "sessionId": "299c5ce1-f604-...", 
    "modelOverride": "gpt-4", 
    "updatedAt": 1700000000000
  },
  "agent:main:direct:bob": {
    "sessionId": "4e59eea4-ddef-...", 
    "modelOverride": "claude-3-opus", 
    "updatedAt": 1700000001000
  }
}
```

### 详细分析

1.  **`/model` 命令的作用范围是“会话（Session）”**
    * 当你发送 `/model gpt-4` 时，这个设置会被写入当前 **Session Entry（会话条目）** 中，作为一个 `modelOverride`（模型覆盖项）。
    * **代码位置**：`openclaw/src/sessions/model-overrides.ts` 中的 `applyModelOverrideToSessionEntry` 函数负责修改内存中的会话对象。

2.  **`dmScope` 决定了“会话”的隔离程度**
    * `dmScope: "per-peer"` 的意思是：对于私聊（Direct Message），系统会为每一个发送者（Peer）生成一个独立的 `SessionKey`（例如 `agent:<id>:dm:<peerId>`）。
    * 因为每个人的 `SessionKey` 不同，所以大家各自拥有独立的 **Session Entry**。
    * 因此，A 用户修改了自己的模型，只会更新 A 用户的 Session Entry，B 用户的会话状态完全不受影响。

3.  **反之（如果不隔离）**
    * 如果使用默认的 `dmScope: "main"`，所有人的私聊都会映射到同一个主会话（main session）。
    * 在这种情况下，A 用户发送 `/model gpt-4`，B 用户也会立刻变成使用 gpt-4，因为他们共享同一个会话上下文和设置。

### 总结：模型设置的影响范围

* **范围**：模型设置是 **Per-Session（每会话）** 的。
* **持久性**：该设置保存在会话存储文件（`sessions.json`）中，除非会话重置（`/reset`）或手动更改，否则会一直保持。
* **层级优先级**：
    1.  **会话级覆盖**：通过 `/model` 设置，优先级最高。
    2.  **配置级默认值**：`openclaw.json` 中的 `agents.defaults.model`。

> **结论**：只要您的 `dmScope` 配置正确实现了用户隔离，模型设置就是各自独立的。

---

