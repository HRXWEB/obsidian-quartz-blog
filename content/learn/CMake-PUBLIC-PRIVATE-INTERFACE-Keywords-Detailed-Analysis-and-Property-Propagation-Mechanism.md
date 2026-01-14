---
title: CMake PUBLIC-PRIVATE-INTERFACE关键字详解与属性传递机制
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2026-01-14T14:37:28.2828+08:00
---

CMake 自从 3.0 以后，就把使用的范式从 `director-oriented` 转换到了 `target-oriented`。

每个 target 都有 properties，而 PUBLIC / PRIVATE / INTERFACE 关键字就是用于控制属性在 target 之间的传递性。

- `PRIVATE`：属性仅自己使用
- `PUBLIC`：属性不仅自己使用，还会传递给依赖它的目标
- `INTERFACE`：属性自己不使用，只传递给依赖它的目标。

# 以 `target_link_libraries(target <PUBLIC/PRIVATE/INTERFACE> item)` 为例

- 若设为 `PUBLIC`：则 target 会更新其属性 `LINK_LIBRAIRIES` 和 `INTERFACE_LINK_LIBRARIES`
- 若设为 `PRIVATE`：则 target 只更新 `LINK_LIBRAIRIES`
- 若设为 `INTERFACE`：则 target 只更新 `INTERFACE_LINK_LIBRARIES`

假设如下情况

```cmake
target_link_libraries(B PRIVATE items...)
target_link_libraries(A B)
```

此时 A 只会关注 B 的 `INTERFACE_LINK_LIBRARIES` 属性，==其会被传递给 A 的 LINK_LIBRAIRIES 中==。在静态链接阶段 `ld` 会根据 A 的 `LINK_LIBRAIRIES` 属性去执行链接过程，如果链接后发现还是有的 api 没有定义，此时就会出现 `undefined reference to...` 的错误。

# 实例

在某次开发就碰到了这个问题，当时的情况是：

A 需要依赖 B，但是 B 设置成 private 依赖 C 后，导致 A 找不到 C 相关的 api，静态链接阶段的 link 报一大堆的 `undefined reference to` 错误。

## 各场景对应的解决方案

### 场景 1：使用 INTERFACE 关键字

**适用场景**：B 是一个纯接口库，本身不实现功能，只是将 C 的接口传递给使用者

**典型情况**：
- B 是头文件库（header-only library）
- B 提供 C 的包装接口，但不包含实现
- B 需要将 C 的链接信息传递给使用者

**实现方式**：
- B 的头文件包含 C 的头文件
- B 不链接 C 的库文件
- A 通过 B 获得 C 的链接信息

```cmake
# B 只需要 C 的接口，不需要链接 C
target_link_libraries(B INTERFACE C)

# A 依赖 B，会自动获得 C 的链接信息
target_link_libraries(A PRIVATE B)
```

**优势**：
- B 不增加额外的链接依赖
- A 可以直接使用 C 的功能
- 适合接口转发场景

### 场景 2：使用 PRIVATE 关键字

**适用场景**：A 只需要 B 的功能，不需要直接使用 C 的任何内容

**设计原则**：
- B 完全封装 C 的实现细节
- A 只通过 B 的接口使用功能
- B 的头文件不暴露 C 的类型或函数

**实现方式**：
- 使用 PIMPL 模式隐藏 C 的实现
- B 的头文件中不包含 C 的头文件
- B 提供包装函数，不直接暴露 C 的 API

```cmake
target_link_libraries(B PRIVATE C)
target_link_libraries(A PRIVATE B)
```

**优势**：
- 降低 A 对 C 的依赖
- 提高代码的可维护性
- 符合封装原则

### 场景 3：使用 PUBLIC 关键字

**适用场景**：A 确实需要直接使用 C 的类型、函数或常量

**典型情况**：
- B 的头文件暴露了 C 的类型
- A 需要提供 C 类型的回调函数
- A 需要访问 C 的配置或常量

```cmake
target_link_libraries(B PUBLIC C)
target_link_libraries(A PRIVATE B)
```

**判断标准**：
- 如果 A 的代码中直接使用了 C 的内容 → 使用 PUBLIC
- 如果 A 只是调用 B 的接口 → 应该使用 PRIVATE 并重新设计 B

# 补充

## 如何打印 target 的所有属性

```cmake
# Get all propreties that cmake supports
if(NOT CMAKE_PROPERTY_LIST)
    execute_process(COMMAND cmake --help-property-list OUTPUT_VARIABLE CMAKE_PROPERTY_LIST)
    
    # Convert command output into a CMake list
    string(REGEX REPLACE ";" "\\\\;" CMAKE_PROPERTY_LIST "${CMAKE_PROPERTY_LIST}")
    string(REGEX REPLACE "\n" ";" CMAKE_PROPERTY_LIST "${CMAKE_PROPERTY_LIST}")
    list(REMOVE_DUPLICATES CMAKE_PROPERTY_LIST)
endif()
    
function(print_properties)
    message("CMAKE_PROPERTY_LIST = ${CMAKE_PROPERTY_LIST}")
endfunction()
    
function(print_target_properties target)
    if(NOT TARGET ${target})
      message(STATUS "There is no target named '${target}'")
      return()
    endif()

    foreach(property ${CMAKE_PROPERTY_LIST})
        string(REPLACE "<CONFIG>" "${CMAKE_BUILD_TYPE}" property ${property})

        # Fix https://stackoverflow.com/questions/32197663/how-can-i-remove-the-the-location-property-may-not-be-read-from-target-error-i
        if(property STREQUAL "LOCATION" OR property MATCHES "^LOCATION_" OR property MATCHES "_LOCATION$")
            continue()
        endif()

        get_property(was_set TARGET ${target} PROPERTY ${property} SET)
        if(was_set)
            get_target_property(value ${target} ${property})
            message("${target} ${property} = ${value}")
        endif()
    endforeach()
endfunction()

# 使用方法
print_target_properties(<target>)
```

# 参考

1. [https://chunleili.github.io/cmake/understanding-INTERFACE](https://chunleili.github.io/cmake/understanding-INTERFACE)
2. [https://stackoverflow.com/questions/32183975/how-to-print-all-the-properties-of-a-target-in-cmake](https://stackoverflow.com/questions/32183975/how-to-print-all-the-properties-of-a-target-in-cmake)