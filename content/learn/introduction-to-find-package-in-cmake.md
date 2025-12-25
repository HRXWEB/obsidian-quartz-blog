---
title: CMake find_package 初解
draft: false
aliases: []
tags: []
created: 2025-12-25T14:06:03.033+08:00
updated: 2025-12-25T14:28:45.4545+08:00
---

# 概述

`find_package` 是 CMake 中用于查找和配置外部依赖包的核心命令。当项目需要使用已经构建好的第三方库时，无论该库是由 CMake 构建、其他构建系统构建，还是无需编译的文件集合，都可以通过 `find_package` 来处理。

## 基本使用示例

```cmake
# REQUIRED 表示必须找到该包，否则 CMake 配置将失败
# 默认先使用 Module 模式，找不到时自动切换到 Config 模式
find_package(OpenCV 4 REQUIRED)

# 配置文件加载后，通常会定义包含目录和库文件变量
include_directories(${OpenCV_INCLUDE_DIRS})

add_executable(main src/main.cpp)

# 链接库文件
target_link_libraries(main ${OpenCV_LIBRARIES})
```

## 搜索模式说明

CMake 提供两种搜索模式，默认先使用 Module 模式，找不到配置文件后自动切换到 Config 模式：

1. **Config Mode**：更可靠的方式，使用包自带的配置文件
2. **Module Mode**：使用 CMake 提供或第三方维护的 Find 模块

## Config 模式

Config 模式是相对更可靠的搜索方式，因为配置文件由软件包本身提供，信息总是与软件包保持同步。

### 配置文件位置

配置文件通常位于 `<prefix>/lib/cmake/<PackageName>/` 目录下，文件命名规范为：

- `<PackageName>Config.cmake` 或 `<lowercasepackagename>-config.cmake`
- `<PackageName>ConfigVersion.cmake`（可选，用于版本检查）

这些配置文件是 CMake 进入包的入口点。即使存在其他 `.cmake` 文件，它们通常也会通过 `include()` 命令在主配置文件中被加载，因此用户只需调用 `find_package()` 即可。

### 安装前缀（Installation Prefix）概念

`CMAKE_PREFIX_PATH` 是一个分号分隔的目录列表，指定了安装前缀路径。这些前缀会被 `find_package()`、`find_program()`、`find_library()` 等命令搜索。

**安装前缀的含义**：当使用 `set(CMAKE_INSTALL_PREFIX /path/to/install)` 并执行 `make install` 后，会生成如下目录结构：

```plaintext
/path/to/install/
├── bin/
│   ├── my_application
│   └── my_other_application
├── lib/
│   ├── libmy_library.so
│   ├── libmy_library.a
│   ├── cmake/
│   │   └── my_library/
│   │       ├── my_libraryConfig.cmake
│   │       ├── my_libraryConfigVersion.cmake
│   │       └── my_libraryTargets.cmake
│   └── pkgconfig/
│       └── my_library.pc
└── include/
    └── my_library/
```

配置文件自动生成在 `<prefix>/lib/cmake/` 子目录下，因此只需将 `/path/to/install` 添加到 `CMAKE_PREFIX_PATH`，CMake 会自动搜索其子目录。

### 配置路径的三种指定方式

1. **系统默认路径**：`CMAKE_SYSTEM_PREFIX_PATH`（如 `/usr`、`/usr/local`）
2. **用户指定前缀**：`list(APPEND CMAKE_PREFIX_PATH /opt/somepackage)`
3. **直接指定配置目录**：`set(SomePackage_DIR /opt/somepackage/lib/cmake/SomePackage)`

**注意**：`<PackageName>_DIR` 是 CMake 变量，需要指向直接包含配置文件的目录，而不是安装前缀。这与环境变量 `<PackageName>_DIR` 不同。

## Module 模式

并非所有软件包都提供 CMake 配置文件，此时需要使用 `Find<PackageName>.cmake` 模块文件。由于这些文件通常与软件包独立维护，可靠性相对较低。

### Module 模式特点

1. **独立维护**：Find 模块文件不由包本身提供，而是由 CMake 社区或第三方维护，因此可能与实际软件包版本不同步
2. **搜索路径**：CMake 在 `CMAKE_MODULE_PATH` 中搜索 Find 模块文件。注意这不是前缀路径，需要直接指向包含 `Find<PackageName>.cmake` 的目录
3. **维护负担**：由于第三方软件包更新频繁，CMake 社区难以及时更新所有 Find 模块，因此许多现代库不再提供标准 Find 模块

### 配置文件命名规范

`find_package` 搜索的配置文件有两种命名方式：

1. **Module 模式**：`Find<PackageName>.cmake`
2. **Config 模式**：`<PackageName>Config.cmake` 或 `<packagename>-config.cmake`

### 配置文件的常见位置

1. **编译安装路径**：`${CMAKE_PREFIX_PATH}/lib/cmake/` 或 `${CMAKE_INSTALL_PREFIX}/lib/cmake/`
2. **系统默认路径**：`/usr/lib/cmake/`、`/usr/local/lib/cmake/`

# find_package 命令语法

## 基础语法

```cmake
find_package(<PackageName> [version] [EXACT] [QUIET] [MODULE]
             [REQUIRED] [[COMPONENTS] [components...]]
             [OPTIONAL_COMPONENTS components...]
             [REGISTRY_VIEW (64|32|64_32|32_64|HOST|TARGET|BOTH)]
             [GLOBAL]
             [NO_POLICY_SCOPE]
             [BYPASS_PROVIDER])
```

## 高级语法

```cmake
find_package(<PackageName>
             [NAMES name1 [name2 ...]]
             [CONFIGS config1 [config2 ...]]
             [HINTS path1 [path2 ...]]
             [PATHS path1 [path2 ...]]
             [PATH_SUFFIXES suffix1 [suffix2 ...]]
             [NO_DEFAULT_PATH]
             [NO_PACKAGE_ROOT_PATH]
             [NO_CMAKE_PATH]
             [NO_CMAKE_ENVIRONMENT_PATH]
             [NO_SYSTEM_ENVIRONMENT_PATH]
             [NO_CMAKE_PACKAGE_REGISTRY]
             [NO_CMAKE_SYSTEM_PATH]
             [NO_CMAKE_INSTALL_PREFIX]
             [NO_CMAKE_SYSTEM_PACKAGE_REGISTRY]
             [CMAKE_FIND_ROOT_PATH_BOTH |
              ONLY_CMAKE_FIND_ROOT_PATH |
              NO_CMAKE_FIND_ROOT_PATH])
```

## 常用参数说明

- **version**：指定所需版本，默认要求大版本号相同
- **EXACT**：要求版本号完全匹配（如 4.1.20）
- **QUIET**：找不到包时不输出警告信息
- **MODULE**：强制使用 Module 模式，不会回退到 Config 模式
- **REQUIRED**：必须找到包，否则产生致命错误并停止配置
- **COMPONENTS**：指定需要的包组件
- **NO_DEFAULT_PATH**：禁用所有默认搜索路径，启用所有 `NO_*` 选项

## 使用示例

```cmake
# 示例 1：指定包目录变量
set(protobuf_DIR "/home/<user_name>/temp_work/install_aarch64/grpc/lib/cmake/protobuf")
find_package(protobuf REQUIRED)

# 示例 2：添加到 CMAKE_PREFIX_PATH
list(APPEND CMAKE_PREFIX_PATH "/opt/somepackage")
find_package(SomePackage 2.0 REQUIRED COMPONENTS Core Network)
```

# Config 模式搜索过程详解

## 前缀子目录搜索规则

CMake 3.24+ 会首先在 `CMAKE_FIND_PACKAGE_REDIRECTS_DIR` 目录搜索配置文件。如果未找到，则按照以下规则在各个前缀路径下搜索子目录（Unix 系统）：

**前缀子目录搜索模式**（按优先级排列）：

| 搜索路径模式 | 平台 |
|-------------|------|
| `<prefix>/(lib/<arch>\|lib*\|share)/cmake/<name>*/` | Unix |
| `<prefix>/(lib/<arch>\|lib*\|share)/<name>*/` | Unix |
| `<prefix>/(lib/<arch>\|lib*\|share)/<name>*/(cmake\|CMake)/` | Unix |
| `<prefix>/<name>*/(lib/<arch>\|lib*\|share)/cmake/<name>*/` | Unix |
| `<prefix>/<name>*/(lib/<arch>\|lib*\|share)/<name>*/` | Unix |
| `<prefix>/<name>*/(lib/<arch>\|lib*\|share)/<name>*/(cmake\|CMake)/` | Unix |

**路径模式说明**：
- `(lib/<arch>|lib*|share)`：三选一
  - `lib/<arch>`：特定架构的库目录，如 `lib/x86_64-linux-gnu`
  - `lib*`：任意 lib 开头的目录，如 `lib`、`lib64`
  - `share`：共享数据目录
- `<name>*`：以包名开头的任意目录名
- `(cmake|CMake)`：cmake 或 CMake 目录

## 前缀路径搜索顺序

安装前缀（`<prefix>`）按照以下顺序搜索。注意：如果设置了 `NO_DEFAULT_PATH`，则所有 `NO_*` 选项都会启用。

### 1. 包特定的根路径

跳过条件：`NO_PACKAGE_ROOT_PATH` 或 `set(CMAKE_FIND_USE_PACKAGE_ROOT_PATH FALSE)`

- CMake 变量：`<PackageName>_ROOT`
- CMake 变量：`<PACKAGENAME>_ROOT`
- 环境变量：`<PackageName>_ROOT`
- 环境变量：`<PACKAGENAME>_ROOT`

### 2. CMake 路径变量

跳过条件：`NO_CMAKE_PATH` 或 `set(CMAKE_FIND_USE_CMAKE_PATH FALSE)`

可通过 `-DVAR=value` 或在 CMakeLists.txt 中 `set()` 指定（推荐后者）：

- `CMAKE_PREFIX_PATH`
- `CMAKE_FRAMEWORK_PATH`
- `CMAKE_APPBUNDLE_PATH`

### 3. CMake 环境变量

跳过条件：`NO_CMAKE_ENVIRONMENT_PATH` 或 `set(CMAKE_FIND_USE_CMAKE_ENVIRONMENT_PATH FALSE)`

- `<PackageName>_DIR`（环境变量）
  - **重要**：作为环境变量时被当作前缀处理，需要按照 [前缀子目录规则](#prefix) 搜索
  - 与 CMake 变量 `<PackageName>_DIR` 不同，后者应直接指向配置文件所在目录
- `CMAKE_PREFIX_PATH`
- `CMAKE_FRAMEWORK_PATH`
- `CMAKE_APPBUNDLE_PATH`

### 4. HINTS 选项指定的路径

### 5. 系统环境变量

跳过条件：`NO_SYSTEM_ENVIRONMENT_PATH` 或 `set(CMAKE_FIND_USE_SYSTEM_ENVIRONMENT_PATH FALSE)`

- `PATH`

### 6. CMake 用户包注册表

跳过条件：`NO_CMAKE_PACKAGE_REGISTRY` 或 `set(CMAKE_FIND_USE_PACKAGE_REGISTRY FALSE)`

参见 [User Package Registry](https://cmake.org/cmake/help/latest/manual/cmake-packages.7.html#user-package-registry)

### 7. CMake 系统路径

跳过条件：`NO_CMAKE_SYSTEM_PATH` 或 `set(CMAKE_FIND_USE_CMAKE_SYSTEM_PATH FALSE)`

平台文件定义的变量（`NO_CMAKE_INSTALL_PREFIX` 会跳过 `CMAKE_INSTALL_PREFIX` 和 `CMAKE_STAGING_PREFIX`）：

- `CMAKE_SYSTEM_PREFIX_PATH`
- `CMAKE_SYSTEM_FRAMEWORK_PATH`
- `CMAKE_SYSTEM_APPBUNDLE_PATH`

### 8. CMake 系统包注册表

参见 [System Package Registry](https://cmake.org/cmake/help/latest/manual/cmake-packages.7.html#system-package-registry)

### 9. PATHS 选项指定的路径

## 实际配置方法

### 方法 1：配置 Module 模式搜索路径

```cmake
# 添加 Find 模块搜索路径
list(APPEND CMAKE_MODULE_PATH "<prefix_path>/lib/cmake/<third_party>")
# Module 模式会优先搜索此路径
```

### 方法 2：直接指定包配置目录

```cmake
# 直接指定包的配置文件目录
set(OpenCV_DIR "<prefix_path>/lib/cmake/<third_party>")
```

### 方法 3：添加到前缀路径

```cmake
# 添加安装前缀，CMake 会自动搜索其子目录
list(APPEND CMAKE_PREFIX_PATH "<prefix_path>")
```

然后调用：

```cmake
find_package(OpenCV REQUIRED)
```

# 链接库常见问题

## 问题描述

调用 `find_package` 后，通常会生成以下变量：

- `<PackageName>_INCLUDE_DIRS`：头文件目录
- `<PackageName>_LIBRARIES`：库文件路径

使用 `include_directories` 一般不会出现问题，但 `target_link_libraries` 可能会报错，提示链接器（ld）找不到库文件。

## 原因分析

部分第三方库的配置文件提供的 `${<PackageName>_LIBRARIES}` 变量只包含库名称（如 `opencv_core`），而不是库文件的绝对路径（如 `/usr/lib/libopencv_core.so`）。此时需要配置动态库搜索路径。

## 解决方案

详见 [[order-of-searching-dependency-library]]，其中介绍了：

- 编译时和运行时的库搜索路径
- 如何配置 `LD_LIBRARY_PATH`、`LIBRARY_PATH` 等环境变量
- 如何使用 `-Wl,-rpath` 指定运行时库路径

# 参考资料

1. [CMake Using Dependencies Guide](https://cmake.org/cmake/help/latest/guide/using-dependencies/index.html#guide:Using%20Dependencies%20Guide)
2. [CMake find_package 命令文档](https://cmake.org/cmake/help/latest/command/find_package.html#package-file-interface-variables)
3. [CMAKE_PREFIX_PATH 变量文档](https://cmake.org/cmake/help/latest/variable/CMAKE_PREFIX_PATH.html#variable:CMAKE_PREFIX_PATH)