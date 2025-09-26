---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 3:31:16 pm
---

CMake 自从3.0以后，就把使用的范式从 `director-oriented` 转换到了 `target-oriented`。

每个 target 都有 properties，而 PUBLIC / PRIVATE / INTERFACE 关键字就是用于控制属性在 target 之间的传递性。

- `PRIVATE`：属性仅自己使用
- `PUBLIC`：属性不仅自己使用，还会传递给依赖它的目标
- `INTERFACE`：属性自己不使用，只传递给依赖它的目标。

# 以 `target_link_libraries(target <PUBLIC/PRIVATE/INTERFACE> item)` 为例

- 若设为 `PUBLIC`：则 target 会更新其属性 `LINK_LIBRAIRIES` 和 `INTERFACE_LINK_LIBRARIES`
- 若设为 `PRIVATE`：则 target 只更新 `LINK_LIBRAIRIES`
- 若设为 `INTERFACE`：则 target 只更新 `INTERFACE_LINK_LIBRARIES`

假设如下情况

```Plain
target_link_libraries(B PRIVATE items...)
target_link_libraries(A B)
```

此时 A 只会关注 B 的 `INTERFACE_LINK_LIBRARIES` 属性，==其会被传递给 A 的 LINK_LIBRAIRIES 中==。那么静态编译时 `ld` 会根据 A 的 `LINK_LIBRAIRIES` 属性去执行链接过程，如果链接后发现还是有的 api 没有定义，此时就会出现 `undefined reference to...`

# 实例

在 [dataflow](http://192.168.3.224:8081/nsd/nova_dataflow/) 的研发过程，就碰到了这个问题，当时的情况是：

dataflow 需要依赖 fastdeploy，但是 fastdeploy 设置成 private 依赖 libnrt.so 后，导致 dataflow 找不到 nrt 相关的 api，静态编译阶段的 link 报错一大堆的 `undefined reference to`

暂时通过改成 public 依赖解决这个问题，但是理想情况下 fastdeploy 本身应该封装 nrt 的细节，dataflow 不需要知道 nrt 的存在。

# 补充

## 如何打印 target 的所有属性

```Plain
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