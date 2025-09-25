---
title:
draft:
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Thursday, September 25th 2025, 7:34:31 pm
---

> [!info] VSCode C/C++ 开发环境和调试配置：Clangd+Codelldb  
> 卸了cpptools和C++ Intelligence吧，来试试clangd或者ccls  
> [https://zhangjk98.xyz/vscode-c-and-cpp-develop-and-debug-setting/](https://zhangjk98.xyz/vscode-c-and-cpp-develop-and-debug-setting/)  

安装如下的 4 个插件

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925193416400.png)

- clangd：做语法分析，提供跳转功能等。 需要
    - `sudo apt install clangd`
    - CMakeLists.txt 要添加 `set(CMAKE_EXPORT_COMPILE_COMMANDS ON)` 导出 compilation database
- Cmake Tools：控制 cmake 的行为，[参考](https://zhuanlan.zhihu.com/p/14736892119)
- CodeLLDB：调试程序，==**并且它打包了调试所需的工具，比如 lldb-server，所以不需要自行安装 lldb 或者 gdb 也能正常工作。**==
- Hex Editor：查看内存

# 参考

1. [https://zhangjk98.xyz/vscode-c-and-cpp-develop-and-debug-setting/](https://zhangjk98.xyz/vscode-c-and-cpp-develop-and-debug-setting/)