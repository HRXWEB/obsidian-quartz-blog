---
title: 
draft: true
aliases: []
tags: []
created: 2026-02-27T10:39:59.5959+08:00
updated: 2026-02-27T17:15:32.3232+08:00
---

 > 前置：什么是 openapi
 > [Skills 最擅长按需加载](https://github.com/ruanyf/weekly/issues/9036)
 > [openapi-to-skills — Neutree](https://neutree.ai/projects/openapi-to-skills)

# 作为 openclaw 引擎 的 Pi agent 是什么，和 cc 的关系？

这是一个非常敏锐的观察！理解 **Pi**（OpenClaw 的核心引擎）的关键在于区分**“库/引擎”**与**“产品/工具”**。

简单来说，**Pi 是一个让开发者能快速构建 AI 代理的“地基”**，而 Claude Code 或 Gemini Code Assist 更像是已经盖好的“精装修样板房”。

---

### 1. 什么是 Pi (Coding Agent Engine)？

在 OpenClaw 的架构中，Pi 并不是一个你可以直接下载来聊天的 App，它是 **OpenClaw 所有的逻辑大脑**。

- **本质**：它是一个 **Agentic Framework（代理框架）**。它不生产模型，而是通过“胶水代码”把模型（Claude/Gemini）、工具（终端、浏览器、文件系统）和任务逻辑粘在一起。
- **核心能力**：Pi 擅长的是 **“闭环执行”**。当你给它一个指令，它会自动判断是该读取文件、运行 Shell 命令，还是去 Google 搜索，直到完成任务为止。

---

### 2. Pi vs. Claude Code vs. Gemini CLI

虽然它们都能写代码，但**身份**和**定位**截然不同：

|**特性**|**Pi (OpenClaw Engine)**|**Claude Code / Gemini CLI**|
|---|---|---|
|**本质**|**中立引擎**。可以挂载任何模型（OpenRouter, Groq, local LLMs）。|**官方原生工具**。强绑定自家模型（Claude 3.7 或 Gemini 2.0）。|
|**灵活性**|**极高**。你可以用它控制 WhatsApp、Gmail 或飞书。|**专注编程**。主要针对 Git 仓库、代码修改和单元测试。|
|**可扩展性**|**插件化**。OpenClaw 的很多功能是通过 Pi 的插件系统实现的。|**集成化**。深度集成在 IDE 或特定的开发者工作流中。|
|**运行环境**|适合**长驻留**。比如跑在你的 eMMC 开发板或云端网关上。|适合**按需启动**。开发者在终端临时敲一行命令解决问题。|

---

### 3. 为什么 OpenClaw 选择 Pi？

OpenClaw 的目标是做一个**“万能代理网关”**。

- **跨平台连接**：Claude Code 不会帮你去读 Gmail 邮件并转发到飞书，但 Pi 可以通过插件轻松实现这种跨平台的“脏活累活”。
- **成本控制**：Pi 允许你使用便宜甚至免费的模型（通过 OpenRouter）来处理简单的逻辑，而把昂贵的模型留给复杂的编程任务。
- **自主性**：Pi 的设计初衷就是为了 **“无人值守”**，它在网关模式下可以独立处理各种 Webhook 推送。

---

### 4. 总结：你应该怎么看它？

- 如果你想要一个**专业的编程搭子**，帮你重构代码或改 Bug，**Claude Code** 或 **Gemini CLI** 是目前的顶尖选手。
- 如果你想要一个**全能的数字管家**，帮你连接各种社交软件、处理自动化流程，并且能自己写点脚本解决问题，那么 **OpenClaw (基于 Pi 引擎)** 就是唯一的选择。

**你想尝试利用 Pi 的能力，给你的 OpenClaw 写一个简单的“自定义技能”吗？比如让它在检测到特定的系统报错时自动帮你修 Bug？**

# [claude code + openclaw 中文教程](https://github.com/KimYx0207/Claude-Code-x-OpenClaw-Guide-Zh)