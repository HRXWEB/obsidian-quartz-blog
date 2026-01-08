---
title: API Design for C++
draft: false
aliases: []
tags: []
created: 2025-12-18T19:15:46.4646+08:00
updated: 2026-01-08T14:46:28.2828+08:00
Author: Martin Reddy
Category:
Rating: ⭐️⭐️⭐️⭐️⭐️
---

# 点评

还是学习到了比较多的知识，理清了一些细节上的概念，比如 [[understanding-static-keyword-first-principles|static的作用]]、[[Initialization-time-is-not-the-start-of-the-lifetime|生命周期和初始化的关系]] 等等。

大方向上对接口和实现分离有了一个更深刻的认识。

# Notes

- API 设计要考虑“概念完整性 (Conceptual Integrity)”，这里的“概念”不是指业务中的名词（如“用户”、“订单”），而是指**设计时的抉择（Design Decisions）**。例如：
	- 我们如何处理错误？（异常 vs 状态码）
	- 我们如何管理内存？（所有权归谁？）
	- 我们如何处理异步？（回调 vs Future vs 协程）
	- 我们的命名风格是什么？（驼峰式 vs 下划线）
	需要和**功能完备性**区分。功能完备性是横向的，关注 API 的**宽度**（功能覆盖面）。概念完整性是纵向的，关注 API 的**深度**（逻辑的一致性）。
- **需求文档**描述 API 的功能，**用户使用示例**从用户使用的角度考虑组合 API，二者结合使用。
- 架构文档中要描述高层次架构和设计的合理性，比较不同的设计和权衡，解释最终的结构为什么最优？
- 继承提供动态多态，模板提供静态多台。
- [[prefer-to-return-by-value-rather-than-const-reference|返回值优于返回常量引用]]
- 移动语义（移动构造 + 移动拷贝）的时候考虑是否加 `noexcept` 关键字
	- 因为有的函数比如 `std::vector.resize()` 会通过 `std::move_if_noexcept` 来检测是否可以安全移动，这样 `resize` 的过程就会把元素移动到新申请的内存，性能更好。否则只能执行拷贝构造
	- 还有 `std::is_nothrow_constructible` 在移动拷贝时起作用
	- 没有加 `noexcept` 关键字时，默认是会抛出异常的
	- 编译器默认生成的移动构造 or 移动拷贝会自动检测是否可以加 `noexcept`，减少心智负担
	- 智能指针默认是 `noexcept` 的，Pimpl 时可以用来优化 OuterClass 的性能
		```c++
		// OuterClass.cpp
		OuterClass::OuterClass(OuterClass&& other) noexcept = default; 
		OuterClass& OuterClass::operator=(OuterClass&& other) noexcept = default;
		```
- 符号可见性的配置：
	- CMake 配置，注意 **CMake 默认会为 shared 库定义 `<TARGET_NAME>_EXPORTS` 宏**：
		```cmake
		add_library(MySDK SHARED src/api.cpp)

		# 强制设为默认隐藏所有符号
		set_target_properties(MySDK PROPERTIES 
		    C_VISIBILITY_PRESET hidden
		    CXX_VISIBILITY_PRESET hidden
		    VISIBILITY_INLINES_HIDDEN ON
		)
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
- 识别共享资源的“三步法”，当你写下一个 API 函数时，可以问自己三个问题：
	-  **它动了“外面”的东西吗？**（全局变量、静态变量、单例）
	-  **它动了“传进来”的东西吗？**（指针、引用、回调函数里的上下文）
	-  **它动了“自己身上”的东西吗？**（类的普通成员变量 `m_xxx`）
	如果以上三个问题的答案有一个是“是”，你就必须启动并发思维：**谁会来调我？他们会同时调我吗？如果同时调，这块内存会发生什么？**
- 

# Highlight 摘选

## 让系统腐烂的八种致命“诱惑”

> [!quote] 
>  The code was never intended to last very long. For example, it was hastily written for a demo or it was meant to be throw-away prototype code.

作者列举的 8 点原因，几乎涵盖了所有失败项目的通用剧本：

- **短视（1, 3, 6）**：认为设计浪费时间，或者觉得“这就是个 Demo，以后会扔掉”，结果这个 Demo 跑了五年。
- **管理失控（4, 5, 7）**：让质量变差的代码随意合入，一味追求新功能而无视存量 Bug。
- **工程素养不足（2, 8）**：工程师不懂设计模式，或者**不写测试**。作者引用了 Michael Feathers 的名言：**“没有测试的代码就是遗留代码（Legacy Code）”**。这意味着你今天写的没测试的代码，下午就变成了沉重的历史包袱。

## 沟通的艺术

> [!quote] 
> Another useful technique when being asked to add a large new requirement without a change to the delivery schedule is to ask which of the existing requirements should be removed so that the new one can be added. This can often help to focus the discussion on the relative priority of the new requirement versus the existing ones.

在无法增加“时间”和“金钱”资源的情况下提出了新的需求时，强迫需求提出者对需求进行优先级排序，戳穿那种“既要、又要、还要”的幻觉。反问：“没问题，既然时间固定，那为了腾出时间做这个新功能，您觉得目前清单上的哪项旧功能可以被删掉或推迟？”

# [[写在最后]]

前面 10 章有仔细的阅读，后面的 5 章在两天内就草草结束了，越到后面耐心就会被耗尽。下次看书可以试试先阅读后面几章再回头看前面的，因为前面的基础概念或多或少接触过，容易看进去。