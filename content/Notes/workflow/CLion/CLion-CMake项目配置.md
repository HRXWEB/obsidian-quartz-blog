---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:28.2828+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!info] Quick CMake tutorial | CLion  
> This tutorial will guide you through the process of creating and developing a simple CMake project in CLion.  
> [https://www.jetbrains.com/help/clion/quick-cmake-tutorial.html](https://www.jetbrains.com/help/clion/quick-cmake-tutorial.html)  

在CLion中无论是添加文件还是删除文件，都会影响 `CMakeLists.txt` 文件的配置，这也符合CLion是通过 `CMakeLists.txt` 来建立各类文件之间的联系的，只有这样才能到处跳转。

添加文件时，可以选择添加的具体的文件类型，而且还可以选择加入到某个 `target` 这样 CLion 会自动更新 `CMakeLits.txt` 文件，这是其精妙之处。比如下图真点了ok就会把 `test.cpp` 加入到 `cmake_testapp` 这个 target 里面去，即 `add_executable(cmake_testapp main.cpp general.cpp` ==`test.cpp`==`)`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190938098.png)

每个target都会有自己的配置，比如执行参数，工作目录，环境变量。启动之前需要做些什么，通常是 🔨`build`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925190949710.png)

按下 `F1` 还能快速查看CMake 相关的文档

> [Quick Documentation popup](https://www.jetbrains.com/help/clion/viewing-inline-documentation.html) helps you get more information on code elements. To invoke it, use mouse hover or press F1.
> 
> You can view quick documentation even for completion suggestions:
> 
> ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191004621.png)

又比如：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191017587.png)
