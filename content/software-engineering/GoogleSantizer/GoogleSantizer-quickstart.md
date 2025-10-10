---
title: 
draft: 
aliases: []
tags: []
URL: https://github.com/google/sanitizers
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

[介绍](https://www.cnblogs.com/thammer/p/17117286.html)：

Sanitizersers是一个工具集合，由google开发并开源，项目地址[sanitizers](https://github.com/google/sanitizers) 。Sanitizers包括系列工具：

- **AddressSanitizer**，检测内存访问问题
- **MemorySanitizer**，检测未初始化内存问题
- **ThreadSanitizer**，检测线程竞态和死锁问题
- **LeakSanitizer**，检测内存泄露问题

sanitizers自gcc4.8加入，即编译器自带。相比于我第一个了解的检测工具valgrind，它对程序性能的影响更小。用过valgrind的就知道，使用valgrind后，程序的性能大大降低。大多数的这类工具的基本原理都差不多，就是将原程序的相关函数替换，然后里面加入分析手段。

---

和其他内存分析工具的对比：

> [!info] AddressSanitizerComparisonOfMemoryTools  
> AddressSanitizer, ThreadSanitizer, MemorySanitizer - google/sanitizers  
> [https://github.com/google/sanitizers/wiki/AddressSanitizerComparisonOfMemoryTools](https://github.com/google/sanitizers/wiki/AddressSanitizerComparisonOfMemoryTools)  

---

优势对比 tldr:

> [!info] Memory/Address Sanitizer vs Valgrind  
> I want some tool to diagnose use-after-free bugs and uninitialized bugs.  
> [https://stackoverflow.com/questions/47251533/memory-address-sanitizer-vs-valgrind](https://stackoverflow.com/questions/47251533/memory-address-sanitizer-vs-valgrind)  

---

# 使用

> [!info] 嵌入式开发调试利器|Sanitizer检测器-电子工程专辑  
> 大家好，我是杂烩君。本次我们来分享一个开发调试利器——Sanitizer。Sanitizer简介Sanitizer是由Google发起的开源工具集，用于检测内存泄露等问题。链接：https://git  
> [https://www.eet-china.com/mp/a304005.html](https://www.eet-china.com/mp/a304005.html)  

> [!info] Sanitizers使用介绍 - thammer - 博客园  
> Sanitizersers是一个工具集合，由google开发并开源，项目地址sanitizers 。Sanitizers包括系列工具： AddressSanitizer，检测内存访问问题 MemorySanitizer，检测未初始化内存问题 ThreadSanitizer，检测线程竞态和死锁问题 L  
> [https://www.cnblogs.com/thammer/p/17117286.html](https://www.cnblogs.com/thammer/p/17117286.html)  

---

[最基本的使用方法(@clion)](https://www.jetbrains.com/help/clion/google-sanitizers.html#Configuration)：

**Specify compiler flags**

- Adjust the following template line and add it to your **CMakeLists.txt**:
    
    ```Plain
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=[sanitizer_name] [additional_options] [-g] [-OX]")
    ```
    
    > Use `CMAKE_C_FLAGS` instead of `CMAKE_CXX_FLAGS` for C projects.

    For `[sanitizer_name]` use one of the following:

    - _**address**_ for AddressSanitizer
    - _**leak**_ for LeakSanitizer
    - _**thread**_ for ThreadSanitizer
    - _**undefined**_ for UndefinedBehaviorSanitizer (other options are also available, refer to the [UBSan section](https://www.jetbrains.com/help/clion/google-sanitizers.html#UbSanChapter))
    - _**memory**_ for MemorySanitizer

    `[Additional_flags]` are other compilation flags, such as `-fno-omit-frame-pointer`, `fsanitize-recover/fno-sanitize-recover`, `-fsanitize-blacklist`, etc.

    Use `[-g]` to have file names and line numbers included in warning messages.

    Add optimization level `[-OX]` to get reasonable performance (see recommendations in the particular Sanitizer documentation).

> 上面的文字摘抄自clion的官方文档，从这里面可以看出官方的文档确实比较符合现代C++的概念，可以抽空学习一下。  
> 这几个话题看起来比较有趣：
> 
> ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926153927946.png)
