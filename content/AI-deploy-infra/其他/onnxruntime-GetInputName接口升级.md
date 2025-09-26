---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 4:49:47 pm
---

# 问题描述

1. `GetInputName` 和 `GetOutputName` 接口从1.12升级到1.13之后，变成了 `GetInputNameAllocated` 和 `GetOutputNameAllocated`
2. 新接口返回值是 `Ort::AllocatedStringPtr` ，其是 `std::unique_ptr<char, detail::AllocatedFree>` 的别名。
3. 要注意 `unique_ptr` 出了scope之后就会自动释放其持有的资源，就会造成这样的问题：

    https://github.com/microsoft/onnxruntime/issues/14157

# 解决方法（from the issue above）：

```C++
std::vector<const char*> inputNodeNames; //
std::vector<AllocatedStringPtr> inputNodeNameAllocatedStrings; // <-- newly added
...
...
auto inputNodesNum = session->GetInputCount();
for (int i = 0; i < inputNodesNum; i++) {
	auto input_name = session->GetInputNameAllocated(i, allocator);
	inputNodeNameAllocatedStrings.push_back(std::move(input_name));
	inputNodeNames.push_back(inputNodeNameAllocatedStrings.back().get());
}
```

# 编译相关

```Plain
# 从onnxruntime下载预编译包，此处用aarch64-1.19.2做示例

set(ONNXRUNTIME_ROOT_PATH "${CMAKE_CURRENT_SOURCE_DIR}/onnxruntime-linux-aarch64-1.19.2")
set(ONNXRUNTIME_INCLUDE_DIRS "${ONNXRUNTIME_ROOT_PATH}/include"
                             "${ONNXRUNTIME_ROOT_PATH}/include/core/providers")
message(STATUS "ONNXRUNTIME_INCLUDE_DIRS: ${ONNXRUNTIME_INCLUDE_DIRS}")
set(ONNXRUNTIME_LIB ${ONNXRUNTIME_ROOT_PATH}/lib/libonnxruntime.so)

add_executable(main main.cpp)
target_include_directories(main PRIVATE ${ONNXRUNTIME_INCLUDE_DIRS})
target_link_libraries(main
    ${ONNXRUNTIME_LIB}
)
```