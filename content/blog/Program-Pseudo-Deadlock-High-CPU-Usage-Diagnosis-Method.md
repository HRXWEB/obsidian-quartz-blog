---
title: 程序假死高CPU占用问题诊断方法
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-11T17:33:21.2121+08:00
---

这里有两个重要的工具可以使用：

# 1. strace

一个用于跟踪系统调用的诊断、调试和教学工具。

`strace` 能够显示每个系统调用的名称、传给系统调用的参数、系统调用的返回值，甚至包括出错的原因（如果有的话）。此外，它还可以跟踪信号传递，这有助于理解程序是如何响应外部事件或错误条件的。

比如 `strace ls` 会输出 `ls` 命令执行期间发生的所有系统调用

# 2. gdb

调试工具，主要用于源代码级别的调试。

主要想强调其 `thread apply all bt` 的功能，用于生成每个线程的调用栈。这在诊断死锁、竞争条件或者仅仅是为了了解程序的并行行为时是非常有价值的。

# 碰到过的一个场景

## 描述

之前在 PrimeFlow 这个 C++ 项目中，碰到过一个奇怪的问题是，给 dataflow 库 加上 python binding 的功能后，编译一切正常。

但是 `python -c "import dataflow_py"` 会卡住，没有任何的报错提示。并且很奇怪的是有一个 CPU 核心的占用一直是 100%，并且通过 `top` 命令能看出就是上述的命令导致的。

## 分析

cpu 占用 100%，说明必然有系统调用。而且程序本身是多线程的，是不是有可能发生了什么死锁竞态？

因此就想用上面描述的两个工具看看发生了什么

## 方案

```Shell
strace -f -o strace_output.txt python3 -c "import dataflow_py" 

gdb -p /pid/of/python3/import/dataflow_py
(gdb) thread apply all bt
```

使用 `strace` 记录下全程的系统调用，发现是在不断的调用 nanosleep 指令，并且 `gdb` 中可以看到每个线程都在执行由 `tracy`(一个性能分析工具) 调用的 sleep。

因此暂时在进行 python binding 的时候关掉这个功能解决了这个问题。

# 后续

[[Tracy-Python-Binding-Conflict-Solution-Singleton-Pattern-and-Dynamic-Library-Loading]]