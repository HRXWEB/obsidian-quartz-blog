---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:51.5151+08:00
---

> [!important] 在多线程的情况下使用 zeromq 需要注意什么

[https://stackoverflow.com/questions/36956024/right-way-to-use-zmq-in-multi-threaded-environment](https://stackoverflow.com/questions/36956024/right-way-to-use-zmq-in-multi-threaded-environment)

> Don’t share ZeroMQ sockets between threads.

---

> [!important] 如何只接收最近的消息

[https://stackoverflow.com/questions/26379365/lazy-pub-sub-in-zeromq-only-get-last-message](https://stackoverflow.com/questions/26379365/lazy-pub-sub-in-zeromq-only-get-last-message)

```cpp
context_ = zmq::context_t(1);
socket_ = zmq::socket_t(context_, zmq::socket_type::sub);
// only keep the latest message
int conflate = 1;
socket_.setsockopt(ZMQ_CONFLATE, &conflate, sizeof(conflate));
socket_.bind("tcp://*:5555");
// subscribe all messages
socket_.setsockopt(ZMQ_SUBSCRIBE, "", 0);
```

‼️注意 `setsockopt` `bind` `setsockopt` 的顺序，一定要在 bind 之前设置好除 `ZMQ_SUBSCRIBE` 之外的属性。