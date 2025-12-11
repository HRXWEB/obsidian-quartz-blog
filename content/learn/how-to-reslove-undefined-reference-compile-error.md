---
title: 如何解决undefined reference编译错误
draft: 
aliases: []
tags: []
created: 2025-10-11T19:14:55.5555+08:00
updated: 2025-11-27T01:45:47.4747+08:00
---

# 情形一：没有链接相应的库

这是最简单的情形，只需要在编译时链接相应的库即可。

# 情形二：库的链接顺序问题

假设依赖关系是 main -> A -> B，那么正确的链接顺序是：main -> A -> B。

```cmake
target_link_libraries(main PRIVATE A B)

# 错误写法
target_link_libraries(main PRIVATE B A)
```

# 情形三：未设置 RPATH

当主程序依赖库 A，而 A 依赖库 B，但是 A 没有设置 RPATH，导致 B 的符号无法被找到。

下面描述遇到过的一个具体例子。

## 具体报错为：

1. 链接器警告信息
    ```bash
    ld: warning: libclass_loader.so, needed by libimage_transport.so, not found (try using -rpath or -rpath-link)
    ```
2. 未定义引用错误
    ```bash
    ld: libimage_transport.so: undefined reference to `class_loader::ClassLoader::loadLibrary()`
    ```

## 问题分析

### 目录结构

```
/opt/ros/humble/lib/
├── libclass_loader.so          # 依赖库 B
└── aarch64-linux-gnu/
    └── libimage_transport.so   # 库 A，依赖 libclass_loader.so
```

### 依赖关系检查

使用 `readelf -d libimage_transport.so` 可以看到：

```
0x0000000000000001 (NEEDED)             Shared library: [libclass_loader.so]
```

### 问题根源

- `libimage_transport.so` 声明依赖 `libclass_loader.so`
- 但 `libimage_transport.so` 没有设置 RPATH，无法找到位于父目录的 `libclass_loader.so`
- 链接器默认只在当前目录和系统库路径中查找，不会向上级目录查找

## 解决方案

在 CMake 中使用 `target_link_options` 设置库搜索路径：

```cmake
target_link_options(your_target PRIVATE 
    LINKER:-rpath-link,/opt/ros/humble/lib
)
```

理解 [[CMake-LINKER-Prefix-Cross-Platform-Linker-Options-Propagation]] 的作用

### 参数说明

- **`-rpath-link`**：只在链接时有效，帮助链接器找到依赖库，不会写入到最终文件中
- **`-rpath`**：设置运行时库搜索路径，会写入到可执行文件/库文件中

对于库与库之间的依赖问题，推荐使用 `-rpath-link`。（构建目录所在路径，通常是 `build` 目录）