---
title:
draft:
aliases: [cmake_sysroot-cmake_find_root_path]
tags: []
created: Monday, September 15th 2025, 6:42:20 pm
updated: Wednesday, September 17th 2025, 11:15:50 pm
---

1. CMAKE_FIND_ROOT_PATH用来<font color =red>控制</font>find_\*命令搜索路径的前缀。
	```cmake
   # adjust the default behavior of the FIND_XXX() commands:
   # search programs in the host environment
   set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
   
   # search headers and libraries in the target environment
   set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
   set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
	```
2. CMAKE_SYSROOT的参数会被find_\*命令<font color =red>用作</font>搜索路径的前缀。并且会传递给编译器的 --sysroot 参数，那么此时究竟作用是什么就取决于编译器了。并且这一参数还有细分：
	1. CMAKE_SYSROOT_COMPILE: used only for compiling sources and not linking.
	2. CMAKE_SYSROOT_LINK: used only for linking and not compiling sources.

# 参考资料

1. [CMAKE_SYSROOT](https://cmake.org/cmake/help/v3.16/variable/CMAKE_SYSROOT.html#cmake-sysroot)
2. [CMAKE_FIND_ROOT_PATH](https://cmake.org/cmake/help/latest/variable/CMAKE_FIND_ROOT_PATH.html)
3. [Cross Compiling With CMake](https://cmake.org/cmake/help/book/mastering-cmake/chapter/Cross%20Compiling%20With%20CMake.html)