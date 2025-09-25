---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:28 pm
updated: Thursday, September 25th 2025, 7:15:33 pm
---

# 定义

> A toolchain is a set of all the necessary tools required for building and running your application: the CMake executable (CMake projects), the build tool, the C/C++ compilers, the debugger binary, and the working environment.

这些工具是以什么文件存在系统当中的呢？它们各自的作用：

- **CMake 可执行文件 (CMake projects)**
    - 名称： `cmake`
    - 作用：CMake 是一个跨平台的自动化构建系统，==用于生成和管理构建文件（如 Makefiles）==。CMake 使用一种称为 CMakeLists.txt 的文本文件来描述项目的结构和构建指令。通过运行 `cmake` 命令，可以生成针对不同构建系统的构建文件，如 Makefiles 或 Visual Studio 解决方案文件。
    - 示例命令：`cmake .` 或 `cmake -S . -B build`
- **构建工具 (Build tool)**
    - **名称**：取决于使用的构建系统，常见的有 `make`、`ninja`、`msbuild` 等。
    - **作用**：构建工具负责实际的构建过程，==根据 CMake 生成的构建文件来编译和链接源代码==，最终生成可执行文件或其他输出。
    - **示例命令**：`make` 或 `ninja`
- **C/C++ 编译器 (C/C++ compilers)**
    - **名称**：`gcc`、`g++`（GNU 编译器集合）、`clang`、`clang++`（LLVM 编译器）
    - **作用**：编译器负责将源代码转换成机器代码。C 编译器用于编译 C 语言源代码，C++ 编译器用于编译 C++ 源代码。
    - **示例命令**：`g++ main.cpp -o myprogram`
- **调试器 (Debugger binary)**
    - **名称**：`gdb`（GNU Debugger）、`lldb`（LLVM Debugger）
    - **作用**：调试器用于在开发过程中调试程序，帮助开发者查找和修复程序中的错误。它可以设置断点、单步执行、查看变量值等。
    - **示例命令**：`gdb myprogram` 或 `lldb myprogram`
- **工作环境 (Working environment)**
    - **名称**：通常指的是构建和运行程序所需的各种环境配置，包括但不限于：
    - **Shell**：如 Bash、Zsh 等，用于执行命令。
    - **环境变量**：如 `PATH`、`LD_LIBRARY_PATH` 等，用于指定可执行文件和库文件的位置。
    - **工具链**：一组用于编译、链接和其他开发任务的工具，通常包括编译器、链接器、汇编器等。
    - **库文件**：如标准库、第三方库等，用于链接到可执行文件中。
    - **IDE 或编辑器**：如 Visual Studio Code、IntelliJ IDEA、Eclipse 等，用于编写和管理源代码。

# 创建工具链

CLion支持三种类型的工具链：

1. 在本地编译
2. 在远程主机编译
3. 用docker编译

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191528406.png)

默认情况下CLion将使用捆绑的 Ninja 作为构建工具(build tool)，可以自行指定。