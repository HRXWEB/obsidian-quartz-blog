---
title: 依赖库的搜索路径及其顺序
draft: false
aliases: []
tags: []
created: 2025-12-25T14:08:37.3737+08:00
updated: 2025-12-25T14:34:00.000+08:00
---

# 概述

动态链接库的搜索需要区分**编译时**和**运行时**两个阶段，每个阶段的搜索路径和优先级有所不同。本文详细介绍静态库和动态库的搜索路径顺序，以及如何配置这些路径。

# 库搜索路径顺序

## 静态库搜索顺序

静态库在编译时被完全链接到可执行文件中，搜索顺序如下：

1. `-L` 参数指定的库目录
2. 环境变量 `LD_PRELOAD`
3. 环境变量 `LIBRARY_PATH`
4. `/lib`
5. `/usr/lib`
6. `/usr/local/lib`

## 动态库搜索顺序

动态库需要区分编译时和运行时的搜索路径：

### 编译时搜索顺序

1. `-L` 参数指定的库目录
2. 环境变量 `LD_PRELOAD`
3. 环境变量 `LIBRARY_PATH`
4. `/etc/ld.so.conf` 文件中指定的路径
5. `/lib`
6. `/usr/lib`

### 运行时搜索顺序

1. `-Wl,-rpath` 参数指定的库目录（编译时嵌入到可执行文件中）
2. 环境变量 `LD_PRELOAD`
3. 环境变量 `LD_LIBRARY_PATH`
4. `/etc/ld.so.conf` 文件中指定的路径
5. `/lib`
6. `/usr/lib`

# 系统级配置库搜索路径，不推荐！

以下方法适用于 GCC 和 CMake 项目。

## 方法 1：配置 LD_PRELOAD

`LD_PRELOAD` 可以强制加载指定的动态库，优先级最高。

```bash
export LD_PRELOAD=<path_to_lib>:$LD_PRELOAD
```

## 方法 2：配置 LIBRARY_PATH

`LIBRARY_PATH` 用于编译时查找库文件。

```bash
export LIBRARY_PATH=<path_to_dir>:$LIBRARY_PATH
```

## 方法 3：配置 LD_LIBRARY_PATH

`LD_LIBRARY_PATH` 用于运行时查找动态库。

```bash
export LD_LIBRARY_PATH=<path_to_dir>:$LD_LIBRARY_PATH
```

## 方法 4：编辑 /etc/ld.so.conf

这是系统级的配置方法，适用于需要永久生效的场景。

### 查看当前配置

```bash
# 查看主配置文件
cat /etc/ld.so.conf

# 默认内容通常为：
# include /etc/ld.so.conf.d/*.conf
```

配置文件会包含 `/etc/ld.so.conf.d/` 目录下所有 `.conf` 文件。例如：

```bash
# 查看 libc 配置
cat /etc/ld.so.conf.d/libc.conf

# 输出示例：
# libc default configuration
# /usr/local/lib
```

### 添加自定义路径

**方法 A**：在 `/etc/ld.so.conf.d/` 下创建新配置文件（推荐）

```bash
sudo echo "/path/to/third_party_lib" > /etc/ld.so.conf.d/mylib.conf
sudo ldconfig
```

**方法 B**：直接编辑 `/etc/ld.so.conf`

```bash
sudo echo "/path/to/third_party_lib" >> /etc/ld.so.conf
sudo ldconfig
```

### ldconfig 命令详解

`ldconfig` 用于更新动态链接库缓存，执行以下操作：

1. **扫描目录**：在 `/lib`、`/usr/lib` 以及 `/etc/ld.so.conf` 指定的目录中搜索共享动态链接库
2. **更新缓存**：创建/更新 `/etc/ld.so.cache` 文件，该文件包含已排序的动态链接库列表

**最佳实践**：安装新库后，始终执行 `sudo ldconfig` 以更新缓存。

### ldconfig 常用命令

```bash
# 打印所有缓存的动态库路径
sudo ldconfig -p

# 查看帮助信息
sudo ldconfig --help

# 详细输出模式
sudo ldconfig -v
```

# GCC 编译器配置

## 使用 -L 和 -Wl,-rpath 参数

```bash
gcc -o helloworld helloworld.c \
    -I <path_to_include_dir> \
    -L <path_to_lib_dir> \
    -Wl,-rpath=<path_to_lib_dir> \
    -lxxx
```

**参数说明**：
- `-I <path>`：指定头文件搜索目录
- `-L <path>`：指定编译时库文件搜索目录
- `-Wl,-rpath=<path>`：指定运行时库文件搜索目录（嵌入到可执行文件中）
- `-lxxx`：链接库文件（对于 `libpthread.a` 或 `libpthread.so`，使用 `-lpthread`，省略 `lib` 前缀和扩展名）

**注意**：当动态库和静态库同时存在时，链接器默认优先使用动态库。

## 查看 GCC 头文件搜索路径

```bash
# 查看 C++ 编译器的头文件搜索路径
`gcc -print-prog-name=cc1plus` -v

# 查看 C 编译器的头文件搜索路径
`gcc -print-prog-name=cc1` -v
```

# CMake 配置

## 方法 1：使用 link_directories

```cmake
# 添加库搜索目录（编译时和运行时）
link_directories(<path_to_lib_dir>)

# 链接库文件
target_link_libraries(${target}
    XXX1
    XXX2
)
```

**注意**：`link_directories` 会影响其后所有目标的链接，建议在 `add_executable` 或 `add_library` 之前调用。

## 方法 2：使用 find_library

```cmake
# 查找库文件并保存到变量
find_library(ThirdPartyLib
    NAMES xxx
    PATHS <path_to_lib_dir>
)

# 链接找到的库
target_link_libraries(main ${ThirdPartyLib})
```

这种方法更精确，可以确保库文件存在，并获取其完整路径。

## 方法 3：设置 RPATH（推荐）

```cmake
# 设置运行时库搜索路径
set(CMAKE_INSTALL_RPATH "<path_to_lib_dir>")
set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)

# 或者使用相对路径
set(CMAKE_INSTALL_RPATH "$ORIGIN/../lib")
```

## 方法 4：使用 target_link_directories（CMake 3.13+）

```cmake
# 为特定目标添加库搜索目录
target_link_directories(${target} PRIVATE <path_to_lib_dir>)

target_link_libraries(${target}
    XXX1
    XXX2
)
```

这种方法比 `link_directories` 更现代，作用域更明确。

# 环境变量总结

| 环境变量              | 作用阶段 | 说明               |
| ----------------- | ---- | ---------------- |
| `LIBRARY_PATH`    | 编译时  | GCC/G++ 查找库文件的路径 |
| `LD_LIBRARY_PATH` | 运行时  | 动态链接器查找共享库的路径    |
| `LD_PRELOAD`      | 运行时  | 强制优先加载指定的共享库     |

# 参考资料

1. [静态库与动态库链接、执行时的搜索路径顺序](https://blog.csdn.net/sunshixingh/article/details/52185307)
2. [Linux 环境变量 LIBRARY_PATH 和 LD_LIBRARY_PATH](https://blog.csdn.net/qq_42731705/article/details/123937127)
3. [链接选项 rpath 的应用和原理](https://bewaremypower.github.io/2020/07/14/链接选项-rpath-的应用和原理/)