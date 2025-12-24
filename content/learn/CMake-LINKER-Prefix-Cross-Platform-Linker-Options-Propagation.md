---
title: CMake LINKER前缀详解：跨平台链接器选项传递
draft: 
aliases: []
tags: []
created: 2025-10-12T15:13:06.066+08:00
updated: 2025-10-12T15:21:30.3030+08:00
---

# 引入的原因

在不同的编译器驱动程序（如 GCC、Clang、MSVC 等）上，向底层链接器传递选项的语法是不同的：

- **GCC/Clang：** 需要使用 `-Wl,` 作为前缀，用逗号 `,` 分隔选项（例如：`-Wl,--gc-sections`）。
- **MSVC (Visual Studio)：** 通常直接传递选项（例如：`/INCREMENTAL:NO`）。

# 具体使用

`target_link_options` 引入了一个特殊的 `LINKER:` 前缀，CMake 会自动将其转换为当前平台和编译器所需的正确语法。

```cmake
target_link_options(my_target PRIVATE
    "LINKER:--gc-sections" # CMake 会自动处理 -Wl, 或其他所需的前缀
)
```

这样，CMake 就能在各种平台上生成正确的链接命令，极大地提高了可移植性。

# 参考

1. [target\_link\_options — CMake 4.1.2 Documentation](https://cmake.org/cmake/help/latest/command/target_link_options.html#handling-compiler-driver-differences)