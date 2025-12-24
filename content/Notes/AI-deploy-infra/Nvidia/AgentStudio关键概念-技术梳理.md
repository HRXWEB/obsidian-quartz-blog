---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# Plugin

插件用于处理来自连接的数据，并将数据传递给其他插件，构成了 pipeline 或 graph

常用的插件类型：

1. sources：产生数据源。如 text prompts、images、video
2. process：处理数据。如 LLM queries、RAG、LLM calls、image post-processors
3. outputs：输出数据。print to stdout、save images/video

## 依赖

1. AttributeDict 来自于 clip_trt.utils，是对 dict 的封装

# DynamicPlugin

各种各样的节点，重载了 `__new__` ，返回具体的 plugin 对象

# TerminalPlugin

# Tegrastats

# Agent

创建并管理 pipeline，pipeline 是由 plugins 构成。

`Agent` 的管道是在实例化时通过传入的 `pipeline` 参数来确定的，并且这个管道是相对固定的。

# Dynamic Agent

1. 允许在运行时动态地配置和重新配置代理及其插件。
2. 它提供了 `save` 和 `load` 方法来保存当前配置为文件，并从文件中加载配置，这使得可以持久化特定的工作流并在需要时恢复。
3. 内置了 Webserver 服务，能够通过 WebSocket 接口接收来自客户端的消息，并根据消息内容自动路由到相应的插件函数或属性上。
4. 定义了 `on_websocket` 函数，当有新消息到达时，出发这个函数来处理消息。各个消息会由合适的 plugin 处理

总结来说，`DynamicAgent` 更适合于那些需要频繁调整工作流结构的应用程序，或者是在用户界面中进行交互式构建的工作环境；而 `Agent` 则更适合于那些一旦定义好就不需要改变的固定工作流。

# WebServer

webserver 在启动时会创建两个服务器，一个是 HTTP 服务器，一个是 WebSocket 服务器。

1. 首次访问网站时，浏览器发起 HTTP 请求来获取 HTML 页面。使用的是 `Flask` 框架来创建 HTTP 服务器
2. 一旦页面加载完成，为了实现更高效、低延迟的全双工通信，会升级到 WebSocket 协议，WebSocket 服务器

两个关键的函数：`on_websocket` 和 `on_message`

`on_websocket` 和 `on_message` 是两个不同的回调函数，它们在WebSocket连接的不同生命周期阶段起作用，并且有着明确的区别和紧密的关系。下面将详细解释两者的区别及其关系：

### **区别**

1. **触发时机**
    - `on_websocket`:
        - 当一个新的WebSocket连接建立时被调用。
        - 它是每个新连接的入口点，负责初始化与该客户端的通信环境。
    - `on_message`:
        - 每当从已建立的WebSocket连接接收到消息时被调用。
        - 它处理来自客户端的消息内容，解析并根据需要做出响应。
2. **主要职责**
    - `on_websocket`:
        - 设置新的WebSocket连接（如记录连接对象）。
        - 可以用来发送欢迎信息或通知其他组件有新客户端加入。
        - 如果有必要，可以启动额外的线程来监听或处理来自这个连接的消息。
    - `on_message`:
        - 解析收到的消息，执行相应的业务逻辑。
        - 根据消息类型和内容决定如何回应客户端或者采取其他动作。
        - 通常会遍历所有注册的消息处理器（通过`add_message_handler`添加），让每个处理器都有机会处理消息。
3. **参数**
    - `on_websocket`:
        - 接收一个代表WebSocket连接的对象作为参数，允许直接与客户端进行交互。
    - `on_message`:
        - 接收多个参数，包括消息的有效载荷、消息大小、消息类型等，这些信息描述了所接收的消息的具体情况。

### **关系**

- `on_websocket` 是WebSocket连接的创建者和管理者，它为后续的消息交换奠定了基础。
- `on_message` 则依赖于由`on_websocket`设置的连接来工作，只有当连接成功建立后，才能开始接收和处理消息。
- 在`on_websocket`中，一旦连接建立，可能会立即调用一次`on_message`，比如发送一个状态更新给所有的消息处理器，告知有一个新的客户端已经连接。
- `on_websocket` 还可能包含对`websocket_listener`方法的调用，后者进入一个循环等待并处理传入的消息，而每次接收到消息都会调用`on_message`来进行具体的处理。

总结来说，`on_websocket`负责管理WebSocket连接的生命周期，确保正确的初始化；而`on_message`则专注于消息级别的处理，确保每一条接收到的消息都能得到适当的处理。两者相辅相成，共同实现了WebSocket协议下的实时双向通信。