---
title: 
draft: true
aliases: []
tags: []
created: 2026-03-06T18:32:00.000+08:00
updated: 2026-06-03T15:36:41.4141+08:00
---

- 远程控制
- 心跳机制

# 快捷键

**常用操作：**

- `Ctrl+C`：取消当前输入或生成
- `Ctrl+B`：把正在跑的任务丢到后台（tmux 用户需要按两次）
- `Ctrl+L`：清屏，但对话历史还在
- `Ctrl+O`：切换详细输出模式，能看到工具调用的细节
- `Ctrl+T`：切换任务列表显示
- `Ctrl+R`：反向搜索历史命令，和 shell 里一样的体验
- `Ctrl+D`：退出 Claude Code
- `Ctrl+G`：用默认文本编辑器打开当前输入，适合写长 prompt

**进阶操作：**

- `Shift+Tab` 或 `Alt+M`：在普通模式、自动模式、Plan 模式之间切换
- `Alt+P`（macOS 用 Option+P）：切换模型
- `Alt+T`（macOS 用 Option+T）：开关 extended thinking
- `Esc+Esc`：回退到之前某个节点，或者从某条消息开始生成摘要
- `Ctrl+V`（iTerm2 用 Cmd+V）：粘贴剪贴板中的图片

**快捷输入：**

- `/` 开头：触发命令或 skill
- `!` 开头：直接跑 bash 命令，输出自动加入对话上下文
- `@`：触发文件路径自动补全

**多行输入：**

- `\` + Enter：所有终端通用
- Option+Enter：macOS 默认
- Shift+Enter：在 iTerm2、WezTerm、Ghostty、Kitty 中直接可用，其他终端需要先跑 `/terminal-setup`

# Claude Code Router + CC switch

- [claude code router + openrouter](https://gemini.google.com/share/af5d404861dd)
- [Claude Code 用中转 API 有没有坑？想听听大家的实际体验 - V2EX](https://v2ex.com/t/1196209)
- [‎claude code router + cc switch](https://gemini.google.com/share/0d0bf410ffa4)

# 如何使用 Claude Code

- 【Claude Code 从 0 到 1 全攻略：MCP / SubAgent / Agent Skill / Hook / 图片 / 上下文处理/ 后台任务 - 哔哩哔哩】 https://b23.tv/wUtuppp
- MCP：
- SKILL：
- Agent：

## 命令参数操作

- `claude -c`：进入 claude code 并自动恢复上一次的对话
- `claude -r`：进入 claude code 并选择希望回到的回滚点

## slash command

- `/mcp`
- `/clear`
- `/compact`
- `/tasks`
- `/init`
- `/memory`
	- 项目级别 `./CLAUDE.md`
	- 用户级别 `~/.claude/CLAUDE.md`
- `/hooks`
- `/skills`
- 

## 三种模式

使用 `shift + tab` 切换模式

- 默认模式，最谨慎，提示 `? for shortcuts`
- 自动模式，接受所有的修改文件操作，提示 `>> accept edits on`
- 规划模式，规划方案但不执行，提示 `|| plan mode on`

隐藏的一种模式，危险模式： `claude --dangerously-skip-permissions`，提示 `>> bypass permissions on`

## 后台任务管理

如果有一个不间断的任务一直在执行的话，比如通过 `! python -m http.server` 起一个服务，此时会阻塞对话，可以通过 `ctrl + b` 把任务放到后台运行。在 claude 对话窗口会提示当前有多个后台任务。

此时就涉及到了任务管理命令： `/tasks`

进入到任务后，可以按 `k` 关掉后台任务。

## 回滚

使用场景示例：说了一句话之后，让 AI 进行了开发，但是开发完这个功能之后，感觉没必要，此时需要回滚

- 回滚到上一句话： `/rewind`
- 选择回滚点： 连按两次 ESC，选择特定的对话：
	- `Restore code and conversation`：回滚对话和代码
	- `Restore conversation`：只回滚对话
	- `Restore code`：只回滚代码
	- `Never mind`：取消回滚

> [!warning] 回滚的范围
> claude code 只能回滚自己写入的文件，如果是通过 bash 命令创建的文件，是没有办法随着回滚删除的。
> 
> 因此最好的回滚方式还是通过 git 来实现

## MCP

`/mcp` 命令可以列出已经安装的 MCP server，并报告它们的状态，比如是否需要鉴权。

### 添加 MCP server

比如 Figma：[Figma MCP collection: How to set up the Figma remote MCP server – Figma Learn - Help Center](https://help.figma.com/hc/en-us/articles/35281350665623-Figma-MCP-collection-How-to-set-up-the-Figma-remote-MCP-server#h_01K6BEK6CY5DWD1EQ7VS5DJT4S)

## Hooks

### 执行时机

- tool 使用前
- tool 使用后
- tool 使用失败后
- Notification 后
- 用户提交 Prompt 后
- more...

### 例子

`PostToolUse` -> `Add New matcher` -> `Write|Edit` -> `Add new hook` -> `jq -r '.tool_input.file_path | xargs prettier --write` -> 选择 hook 的保存级别：

- Project settings (local)：本机本项目，会把项目的 `.claude/settings.local.json` 加入到 `.gitignore`
- Project settings：项目级别，通过 `git` 分享给所有开发者
- User settings：用户级别

## Skills

```bash
mkdir -p ~/.claude/skills/daily-report
vim ~/.claude/skills/daily-report/SKILL.md
```

一定要是 `SKILL.md`，大小写敏感，然后 markdown 要包含 front yaml：

```markdown
---
name: xxx
description: xxx
---
```

skill 的调用可以由模型主动发现并触发，也可以通过 `/daily-report 请帮我生成xxx` 强制触发。

## SubAgent

### 和 Skill 的区别

- Skill：共享主对话上下文。**适合**与上下文关联大，但是对上下文的影响小（如输出 token 少）。
- SubAgent：独立的上下文。**适合**与上下文关联小，但是对上下文有重要影响。

`/agents` -> `create new agent` -> 选择级别（项目/用户） -> 选择生成方法（使用 claude 生成/手动配置） -> 选择可用的工具（读/写/执行/其他） -> 选择 subagent 要用的模型 -> 选择 subagent 的标识颜色

例如创建一个项目级别的 subagent 用于做代码审核，交给 claude 生成的话，很有可能就在当前项目生成这个文档 `./.claude/agents/code-reviewer.md`。它类似于 SKILL.md，只不过 front yaml 有点变化，以下仅为示例：

```markdown
name: code-reviewer
description:
model: sonnet
color: greeen
```

## Plugin

一键安装包含一系列的 skills、subagents、hooks 的“安装包”

# worktree

[Claude Code Worktrees in 7 Minutes - YouTube](https://www.youtube.com/watch?v=z_VI51k-tn0)
