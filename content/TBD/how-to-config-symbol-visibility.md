---
title: 如何配置符号可见性
draft: true
aliases: []
tags: []
created: 2026-01-05T11:10:08.088+08:00
updated: 2026-01-05T11:39:42.4242+08:00
---

此前在 [[API-Design-for-C++]] 首次接触到配置符号可见性的简易流程

# 简易流程

- CMake 配置，注意 **CMake 默认会为 shared 库定义 `<TARGET_NAME>_EXPORTS` 宏**：
	```cmake
	add_library(MySDK SHARED src/api.cpp)

	# 1. 强制设为默认隐藏所有符号
	set_target_properties(MySDK PROPERTIES 
		C_VISIBILITY_PRESET hidden
		CXX_VISIBILITY_PRESET hidden
		VISIBILITY_INLINES_HIDDEN ON
	)
	
	# 2. 仅在 Windows 下定义导出开关（对应宏里的 _EXPORTING）
	# CMake 默认会为库定义 <TARGET_NAME>_EXPORTS 宏
	target_compile_definitions(MySDK PRIVATE _EXPORTING)
	```
- 代码，利用 CMake 默认为库定义的 `<TARGET_NAME>_EXPORTS` 宏：
	```c++
	#ifndef SDK_EXPORT_H
	#define SDK_EXPORT_H
	
	// --- 平台判定层 ---
	#if defined _WIN32 || defined __CYGWIN__
		// Windows 平台：使用 __declspec 语法
		// 利用 CMake 为库自动添加的 <TARGET_NAME>_EXPORTS，此时标记为“导出”
		#ifdef MySDK_EXPORTS 
			// 场景 A：构建库本身（编译 .dll 时）
			#ifdef __GNUC__
				#define DLL_PUBLIC __attribute__((dllexport))
			#else
				#define DLL_PUBLIC __declspec(dllexport)
			#endif
		#else
			// 场景 B：用户调用库（编译 sample 时）
			// 用户没有定义 _EXPORTING，此时标记为“导入”
			#ifdef __GNUC__
				#define DLL_PUBLIC __attribute__((dllimport))
			#else
				#define DLL_PUBLIC __declspec(dllimport)
			#endif
		#endif
		
		// Windows 上隐藏符号通常通过不加导出标记来实现，
		// 这里定义为空是为了保持跨平台语法一致。
		#define DLL_HIDDEN 
	
	#else
		// --- 类 Unix 平台（Linux, macOS 等） ---
		// 检查编译器是否支持可见性属性（GCC 4.0+ / Clang）
		#if __GNUC__ >= 4
			// 显式将符号设为“默认可见”（即导出）
			#define DLL_PUBLIC __attribute__ ((visibility("default")))
			// 显式将符号设为“隐藏”
			#define DLL_HIDDEN __attribute__ ((visibility("hidden")))
		#else
			// 老版本编译器不支持可见性控制，全部设为空
			#define DLL_PUBLIC
			#define DLL_HIDDEN
		#endif
	#endif
	
	#endif // SDK_EXPORT_H
	```

> [!question] 问题
> 如果你的 SDK 包含多个子模块（比如 `MySDK_Core`, `MySDK_Network`），每个模块都会有自己独立的 `_EXPORTS` 宏，也要编写自己独立的头文件，很麻烦！

针对这个问题，有两种解法：

1. 简易的惯常做法：自定义 `_EXPORTING` 编译选项
2. 进阶做法：CMake 其实提供了一个内置模块 `GenerateExportHeader`，可以自动生成这个 `Export.h` 文件，不用自己写代码

# 解决多个模块都有自己的 `<TargetName>_EXPORTS` 问题

> [!HINT]
> 有时候确实会想要单独精细化控制每个模块的导出，那就不存在这个问题了

## 惯常解法：自定义 `_EXPORTING` 编译选项

`CMakeLists.txt` 写法：

```cmake
add_library(mysdk SHARED MySDK.cpp)

# 1. 强制设为默认隐藏所有符号
set_target_properties(mysdk PROPERTIES 
    C_VISIBILITY_PRESET hidden
    CXX_VISIBILITY_PRESET hidden
    VISIBILITY_INLINES_HIDDEN ON
)

# 2. 仅在 Windows 下定义导出开关（对应宏里的 _EXPORTING）
target_compile_definitions(mysdk PRIVATE _EXPORTING)
```

此时宏定义：

```c++
#ifndef SDK_EXPORT_H
#define SDK_EXPORT_H

// --- 平台判定层 ---
#if defined _WIN32 || defined __CYGWIN__
    // Windows 平台：使用 __declspec 语法
    #ifdef _EXPORTING 
        // 场景 A：构建库本身（编译 .dll 时）
        // 我们在 CMake 中定义了 _EXPORTING，此时标记为“导出”
        #ifdef __GNUC__
            #define DLL_PUBLIC __attribute__((dllexport))
        #else
            #define DLL_PUBLIC __declspec(dllexport)
        #endif
    #else
        // 场景 B：用户调用库（编译 sample 时）
        // 用户没有定义 _EXPORTING，此时标记为“导入”
        #ifdef __GNUC__
            #define DLL_PUBLIC __attribute__((dllimport))
        #else
            #define DLL_PUBLIC __declspec(dllimport)
        #endif
    #endif
    
    // Windows 上隐藏符号通常通过不加导出标记来实现，
    // 这里定义为空是为了保持跨平台语法一致。
    #define DLL_HIDDEN 

#else
    // --- 类 Unix 平台（Linux, macOS 等） ---
    // 检查编译器是否支持可见性属性（GCC 4.0+ / Clang）
    #if __GNUC__ >= 4
        // 显式将符号设为“默认可见”（即导出）
        #define DLL_PUBLIC __attribute__ ((visibility("default")))
        // 显式将符号设为“隐藏”
        #define DLL_HIDDEN __attribute__ ((visibility("hidden")))
    #else
        // 老版本编译器不支持可见性控制，全部设为空
        #define DLL_PUBLIC
        #define DLL_HIDDEN
    #endif
#endif

#endif // SDK_EXPORT_H
```

## 进阶解法：利用 CMake 内置 `GenerateExportHeader` 模块

```cmake
include(GenerateExportHeader)

# 假设你的目标叫 MySDK
add_library(MySDK SHARED src/api.cpp)

set_target_properties(MySDK PROPERTIES
	C_VISIBILITY_PRESET hidden
    CXX_VISIBILITY_PRESET hidden
    VISIBILITY_INLINES_HIDDEN ON
)

# 核心命令：自动生成头文件
generate_export_header(MySDK
    BASE_NAME MY_SDK
    EXPORT_FILE_NAME "${CMAKE_CURRENT_BINARY_DIR}/my_sdk_export.h"
)

# 记得把生成的头文件目录加入包含路径，否则代码里找不到
target_include_directories(MySDK PUBLIC "${CMAKE_CURRENT_BINARY_DIR}")
```

CMake 会在构建目录生成一个 `my_sdk_export.h`。自动生成类似以下的宏（以 `BASE_NAME` 设定的 `MY_SDK` 为前缀）：

- **`MY_SDK_EXPORT`**: 等价于你之前的 `DLL_PUBLIC`。
- **`MY_SDK_NO_EXPORT`**: 等价于你之前的 `DLL_HIDDEN`。
- **`MY_SDK_DEPRECATED_EXPORT`**: 这是一个额外的惊喜，用来标记**已废弃但仍导出的接口**，编译器会给用户发警告。

在上面的例子中，设置了 `BASE_NAME MY_SDK`。

- 如果不设置，它默认使用 Target 名（即 `MySDK`）。
- 生成的宏就会变成 `MySDK_EXPORT`。
- 建议使用**全大写**的 `BASE_NAME`，这符合 C++ 宏命名的通用惯例，也让代码看起来更专业。

### 考虑预编译交付

```cmake
# 1. 之前生成的命令
generate_export_header(MySDK
    BASE_NAME MY_SDK
    EXPORT_FILE_NAME "${CMAKE_CURRENT_BINARY_DIR}/my_sdk_export.h"
)

target_include_directories(MySDK PUBLIC "${CMAKE_CURRENT_BINARY_DIR}")

# 2. 安装库文件（.dll, .so, .lib）
install(TARGETS MySDK
    EXPORT MySDKTargets
    LIBRARY DESTINATION lib    # 存储 .so
    ARCHIVE DESTINATION lib    # 存储 .lib
    RUNTIME DESTINATION bin    # 存储 .dll
)

# 3. 安装生成的头文件 (关键！)
# 注意这里的路径要指向编译目录下的那个文件
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/my_sdk_export.h"
    DESTINATION include/MySDK
)
```

这样用户在包含时会写 `#include "MySDK/my_sdk_export.h"`，非常专业。

> [!attention] 
> 不同平台的用户需要不同的宏定义展开，所以务必在各自的系统上运行 CMake 编译
