---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 3:31:35 pm
---

`LINK_FLAGS` 和 `INSTALL_RPATH` 是 CMake 中用于配置库或可执行文件链接时和安装后运行时库路径的不同属性。它们的作用范围和应用场景有所不同：

# **LINK_FLAGS**

- **作用范围**：链接阶段
- **描述**：`LINK_FLAGS` 属性允许你为特定目标（如库或可执行文件）设置额外的链接器标志。这些标志会在链接该目标时传递给链接器。
- **例子**：在你的例子中，`"-Wl,-rpath,$ORIGIN/third_libs/install/${NOVAUTONPU_FILE_BASENAME}/lib"` 设置了一个运行时路径 (`rpath`) 指向 `$ORIGIN/third_libs/install/${NOVAUTONPU_FILE_BASENAME}/lib` 目录。这里 `$ORIGIN` 是一个特殊的标记，它代表可执行文件或共享库所在的目录。这个 `rpath` 标志告诉动态链接器在运行时查找依赖的共享库时也检查指定的路径。

# **INSTALL_RPATH**

- **作用范围**：安装后的运行时
- **描述**：`INSTALL_RPATH` 属性专门用于设置安装后的二进制文件（库或可执行文件）的运行时搜索路径。当使用 `install()` 命令安装目标时，CMake 会将 `INSTALL_RPATH` 的值设置为目标的运行时路径。
- **例子**：在你的例子中，`"$ORIGIN/third_libs/install/${NOVAUTONPU_FILE_BASENAME}/lib"` 表示安装后的文件在运行时应该从相对其自身位置的 `third_libs/install/${NOVAUTONPU_FILE_BASENAME}/lib` 目录查找依赖的共享库。

# **关键区别**

- **应用时间点**：`LINK_FLAGS` 影响的是构建过程中的链接阶段，而 `INSTALL_RPATH` 影响的是安装后的运行时行为。
- **适用场景**：如果你希望在开发环境中测试时也能找到特定路径下的库，可以使用 `LINK_FLAGS` 设置 `rpath`。而如果你希望确保安装后的程序能够正确地找到它的依赖库，你应该使用 `INSTALL_RPATH`。
- **持久性**：`LINK_FLAGS` 设置的 `rpath` 只会影响构建过程中生成的文件，并且这些设置可能会被后续的安装过程覆盖。`INSTALL_RPATH` 确保了安装后的文件具有正确的运行时路径设置，这对于分发和部署非常重要。

简而言之，`LINK_FLAGS` 是一种更通用的设置链接器选项的方法，它可以包含任何有效的链接器标志，而 `INSTALL_RPATH` 则是专门为控制安装后二进制文件的运行时路径而设计的属性。如果你的目标是在安装后保持运行时路径设置，那么 `INSTALL_RPATH` 是更为推荐的选择。

# 问题

- 设置了 INSTALL_RPATH，即给目标设置 RUNPATH 属性后依然找不到部分库
    - 可能原因1：因为其依赖的库也需要能够找到它自己依赖的库。例如 a 依赖 b，b 依赖 c，虽然 RUNPATH 可以让 a 能够找到 b，但是 b 不一定能找到 c，此时 ldd： a 间接依赖的 c 仍然会报错找不到。

---

---

# ldd 工作原理

Q：ldd是否会显示依赖项的依赖项？

A：会，[请参考此回答](https://stackoverflow.com/questions/15064685/does-ldd-also-show-dependencies-of-dependencies)，另外补充 `readelf -d` 只会显示直接依赖项