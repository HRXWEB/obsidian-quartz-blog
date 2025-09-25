---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Thursday, September 25th 2025, 7:06:49 pm
---

- [[#Quick start]]
- [[#CLion Nova vs CLion Classic]]
- [[#配置项目]]
- [[#源代码相关操作]]
- [[#静态代码分析]]
- [[#Build, run and Debug]]
- [[#远程开发 remote development]]

# Quick start

## 可以使用的编译器

- GCC-based
- Clang
- Clang-cI
- Visual Studio C++ compiler
- IAR compiler
- custom-defined compiler

可以在用任何平台（MacOS、Windows、Linux）使用gdb调试

可以在 MacOS/Linux 使用 LLDB 调试

Windows端 MSVC 工具链还有一个 LLDB-based 调试工具

## 代码生成

最常用的使用方式是 `create from usage` ：

调用了某个并未实现的 ==**function**==，你不应该打断当前的工作流，按下 `opt + Enter` 来生成 stub code，可以之后再回来实现具体的函数。`create from usage` 同样适用于 ==**variables**== 和 ==**classes**==

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190644117.png)

⚠️ opt + enter 可以生成很多种代码，它实际上是根据💡的提示来修复潜在的问题代码或者优化代码，比如：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190708069.png)


选择相应的修改建议就会自动修改了，上图选择第一个就会自动在成员函数的声明处加上 `static`

可以通过 `cmd + N` 列出所有可行的代码生成选项，

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190724973.png)


`cmd + j` 用于插入实时代码模板，具体有哪些 live template 可以在设置中找到

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190743633.png)


比如可以在键入 `fori` 之后 按下 `cmd + j` 就可以自动补全

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190758972.png)


![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190809691.png)


按下tab键就可以选择替换 `i` `MAX` 为想要的变量值

## 运行时分析 Analyze at run time

To help you catch run-time problems, CLion integrates [Valgrind Memcheck](https://www.jetbrains.com/help/clion/memory-profiling-with-valgrind.html) and [Google Sanitizers](https://www.jetbrains.com/help/clion/google-sanitizers.html).

# CLion Nova vs CLion Classic

> [!info] CLion Nova | CLion  
> CLion Nova is an improved version of CLion, which uses the ReSharper C++ / Rider C++ language engine instead of the CLion legacy engine.  
> [https://www.jetbrains.com/help/clion/clion-nova-introduction.html#nova-performance](https://www.jetbrains.com/help/clion/clion-nova-introduction.html#nova-performance)  

CLion Nova is an improved version of CLion, which uses the ReSharper C++ / Rider C++ language engine instead of the CLion legacy engine. This version is focused on responsiveness, accuracy, and performance of the IDE:

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190828671.png)


# 配置项目

[[CLion-CMake项目配置]]

[[CLion配置工具链toolchain]]

[[CLion索引indexing]]

# 源代码相关操作

[[CLion操作代码快捷键]]

[[CLion多光标操作快捷键]]

[[CLion配置代码风格]]

[[CLion重构]]

# 静态代码分析

在 CLion 中，有一组 code inspections，可以==在编译项目之前==检测并纠正项目中的异常代码。IDE 可以发现并突出显示各种问题，定位死代码，查找可能的错误、拼写问题，并改进整体代码结构。

和这个功能配合的最好的快捷键是 `opt + enter` ，可以打开快速修复的悬浮窗，选择修复的方式

[[CLion运行Inspections]]

# Build, run and Debug

[[CLion编译单-多个文件]]

[[CLion查看汇编代码]]

# 远程开发 remote development

[[CLion使用本地源远程开发]]

[[CLion远程调试]]

[[CLion使用docker远程开发]]

[[CLion-Local+Remote-Docker+Remote-Board]]