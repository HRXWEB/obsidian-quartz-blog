本文为个人使用 `cmake` 编译 `protobuf` 生成源码的经验总结，下面将介绍两种生成 `protobuf` 源码的 `cmake` 编写方式

# 法一：protobuf_generate_cpp 生成源码

`cmake` 提供了 `FindProtobuf` 模块，可以通过 `find_package` 命令查找 `Protobuf` 进行使用，官网给的使用示例如下：

```Makefile
find_package(Protobuf REQUIRED)
include_directories(${Protobuf_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_BINARY_DIR})
protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS foo.proto)
protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS EXPORT_MACRO DLL_EXPORT foo.proto)
protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS DESCRIPTORS PROTO_DESCS foo.proto)
protobuf_generate_python(PROTO_PY foo.proto)
add_executable(bar bar.cc ${PROTO_SRCS} ${PROTO_HDRS})
target_link_libraries(bar ${Protobuf_LIBRARIES})
```

这里使用 `protobuf_generate_cpp` 命令将 `foo.proto` 文件生成源码，使用 `PROTO_SRC` `PROTO_HARS` 变量分别指代生成的 `cpp` 和 `h` 文件并可用于连接到 `target` 和设置 `include`  
不过这种方法有两个缺点：

- 要求 `protobuf_generate_cpp` 命令和生成 `add_executable()` 或 `add_library()` 的命令必须在同一个 CMakeList 中
- 该方法 (当前3.18) 仍无法设置源码的生成路径,只能默认在相应的 build-tree 中生成

# 法二：使用 add_custom_target 与 add_custom_command 生成源码

在该方法中引入 `add_custom_target` 命令生成一个自定义 `target`，并令该 `target` 依赖于生成源码的 `add_custom_command` 命令

```Makefile
find_package(Protobuf 3 REQUIRED)

\#设置输出路径
SET(MESSAGE_DIR ${CMAKE_BINARY_DIR}/message)
if(EXISTS "${CMAKE_BINARY_DIR}/message" AND IS_DIRECTORY "${CMAKE_BINARY_DIR}/message")
        SET(PROTO_META_BASE_DIR ${MESSAGE_DIR})
else()
        file(MAKE_DIRECTORY ${MESSAGE_DIR})
        SET(PROTO_META_BASE_DIR ${MESSAGE_DIR})
endif()

\#设置protoc的搜索路径
LIST(APPEND PROTO_FLAGS -I${CMAKE_SOURCE_DIR}/msg/message)
\#获取需要编译的proto文件
file(GLOB_RECURSE MSG_PROTOS ${CMAKE_SOURCE_DIR}/msg/message/*.proto)
set(MESSAGE_SRC "")
set(MESSAGE_HDRS "")

foreach(msg ${MSG_PROTOS})
        get_filename_component(FIL_WE ${msg} NAME_WE)

        list(APPEND MESSAGE_SRC "${PROJECT_BINARY_DIR}/message/${FIL_WE}.pb.cc")
        list(APPEND MESSAGE_HDRS "${PROJECT_BINARY_DIR}/message/${FIL_WE}.pb.h")

		# 使用自定义命令
        add_custom_command(
          OUTPUT "${PROJECT_BINARY_DIR}/message/${FIL_WE}.pb.cc"
                 "${PROJECT_BINARY_DIR}/message/${FIL_WE}.pb.h"
          COMMAND  ${PROTOBUF_PROTOC_EXECUTABLE}
          ARGS --cpp_out  ${PROTO_META_BASE_DIR}
            -I ${CMAKE_SOURCE_DIR}/msg/message
            ${msg}
          DEPENDS ${msg}
          COMMENT "Running C++ protocol buffer compiler on ${msg}"
          VERBATIM
        )
endforeach()

# 设置文件属性为 GENERATED
set_source_files_properties(${MESSAGE_SRC} ${MESSAGE_HDRS} PROPERTIES GENERATED TRUE)

# 添加自定义target
add_custom_target(generate_message ALL
                DEPENDS ${MESSAGE_SRC} ${MESSAGE_HDRS}
                COMMENT "generate message target"
                VERBATIM
                )
```

值得注意的有两点：

- 设置生成的源码文件属性 `GENERATED` 为 `TRUE`，否则 `cmake` 时会因找不到源码而报错
- 使用 `add_custom_target` 添加目标时要设置 `ALL` 关键字，否则 `target` 将不在默认编译列表中

这样就能实现 `proto` 生成源码配置定制化并避免不必要的重新编译了

# 总结

如果只有少量 `proto` 文件且在同一文件夹下，可使用方法一的 `protobuf_generate_cpp` 生成源码，若 `proto` 文件较多且层次复杂，建议使用方法二。

具体使用可以参考该项目 [https://github.com/mingjitianming/transmit_asio](https://github.com/mingjitianming/transmit_asio) 中CMakeLists的使用方式

  

# 参考（不如说是备份）

1. [https://blog.csdn.net/qq_37868450/article/details/113727764](https://blog.csdn.net/qq_37868450/article/details/113727764)