---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

`Craig Scott` 在 cppconf 2019 的演讲：

> [!info] CppCon 2019: Deep CMake For Library Authors  
> This talk highlights key CMake features relevant to C++ cross-platform library authors, digging deeper into platform-specific quirks and conventions.  
> [https://crascit.com/2019/10/16/cppcon-2019-deep-cmake-for-library-authors/](https://crascit.com/2019/10/16/cppcon-2019-deep-cmake-for-library-authors/)  

文档：

[https://crascit.com/wp-content/uploads/2019/09/Deep-CMake-For-Library-Authors-Craig-Scott-CppCon-2019.pdf](https://crascit.com/wp-content/uploads/2019/09/Deep-CMake-For-Library-Authors-Craig-Scott-CppCon-2019.pdf)

要点：

1. API Control 可见性
    
    ```Plain
    # generate_export_header command 介绍：https://www.cnblogs.com/fortunely/p/16297277.html
    
    set(CMAKE_CXX_VISIBILITY_PRESET     hidden)
    set(CMAKE_VISIBILITY_INLINES_HIDDEN YES)
    add_library(MyTgt ...)
    include(GenerateExportHeader)
    generate_export_header(MyTgt)
    
    # 结果
    # 1. 生成 mytgt_export.h 头文件
    # 2. 文件中定义了几个宏用于控制 visibility deprecated 等
    # 3. 宏举例：MYTGT_EXPORT, MYTGT_NO_EXPORT, MYTGT_DEPRECATED, MYTGT_DEPRECATED_EXPORT, MYTGT_DEPRECATED_NO_EXPOR
    ```
    
2. API Compatibility

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926153618325.png)

    设置了 target 的属性 `SOVERSION` 和 `VERSION` 之后，就会生成三个 `.so` 文件

    1. 图中第三个时人类可读的，具体的库文件
    2. 图中第二个 `SONAME` 是 `ldd` 会读取的，它用来判断API的兼容性。如果没设置 `SOVERSION` ，那么 `SOVERSION = VERSION` 。此时要求 `major.minor.patch` 全匹配才能被 `ldd` 加载
3. 如何被打包
    
    ```Plain
    include(GNUInstallDirs)
    install(TARGETS Example
      RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
              COMPONENT   SomeProj_RunTime
      LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
              COMPONENT          SomeProj_RunTime
              NAMELINK_COMPONENT SomeProj_Development
      ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
              COMPONENT   SomeProj_Development
    )
    
    # 要点：
    # 1. 使用 ${CMAKE_INSTALL_BINDIR} 等变量指定安装路径，避免绝对路径
    # 2. COMPONENT 关键字组织产出物
    # 3. 加上 project name 前缀避免和其他库 component 冲突
    ```
    
4. 考虑用户使用

    注意的点是在安装的时候会把 DT_RPATH 清空（默认情况下）

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926153630229.png)

    考虑下图所示情况，APP 间接依赖 `Vendor` 库

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926153643837.png)

    > DT_RUNPATH ==dynamic section== attribute of the binary if present. Such directories are searched only to find those objects required by DT_NEEDED (direct dependencies) entries and ==do not apply to those objects' children==, which must themselves have their own DT_RUNPATH entries. This is unlike DT_RPATH, which is applied to searches for all children in the dependency tree.

    `APP` 的 `DT_RUNPATH` 中记录的目录只用来寻找 `APP` 的直接依赖 `[libExample.so](http://libExample.so)` ，找不到 `Vendor` 库。

    解决方法：

    ```Plain
    # insatll 后在 Example 的 DT_RPATH 存着 Example 依赖项的查找路径，这个路径就是 libExample.so 所在的路径。
    set(CMAKE_INSTALL_RPATH $ORIGIN)
    
    add_library(Example ...)
    ```

    查看 DT_RPATH：

    ```Bash
    readelf -d <path/to/target>
    ```