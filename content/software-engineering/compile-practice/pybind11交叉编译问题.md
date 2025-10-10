---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 使用 `pybind11_add_module` 时 target 的扩展名从何而来？

在使用 `pybind11NewTools.cmake` 中定义的 `pybind11_add_module` 添加新的模块的时候，会依赖几个变量。简化调用过程为如下：

```Shell
function(pybind11_add_module target_name)
	...
	# If we don't pass a WITH_SOABI or WITHOUT_SOABI, use our own default handling of extensions
  if(NOT ARG_WITHOUT_SOABI AND NOT "WITH_SOABI" IN_LIST ARG_UNPARSED_ARGUMENTS)
    pybind11_extension(${target_name})
  endif()
  ...
endfunction()

function(pybind11_extension name)
  # The extension is precomputed
  set_target_properties(
    ${name}
    PROPERTIES PREFIX ""
               DEBUG_POSTFIX "${PYTHON_MODULE_DEBUG_POSTFIX}"
               SUFFIX "${PYTHON_MODULE_EXTENSION}")
endfunction()
```

可以看到当增加新的库时，扩展名取决于 `PYTHON_MODULE_EXTENSION`

# 扩展名 `PYTHON_MODULE_EXTENSION` 是在哪里设置的？

在使用 `pybind11NewTools.cmake` 中相关的代码为：

```Shell
if(NOT _PYBIND11_CROSSCOMPILING)
	# code about set PYTHON_MODULE_EXTENSION
else()
	if(NOT DEFINED PYTHON_IS_DEBUG
     OR NOT DEFINED PYTHON_MODULE_EXTENSION
     OR NOT DEFINED PYTHON_MODULE_DEBUG_POSTFIX)
    include("${CMAKE_CURRENT_LIST_DIR}/pybind11GuessPythonExtSuffix.cmake")
    pybind11_guess_python_module_extension("${_Python}")
  endif()
  # When cross-compiling, we cannot query the Python interpreter, so we require
  # the user to set these variables explicitly.
  if(NOT DEFINED PYTHON_IS_DEBUG
     OR NOT DEFINED PYTHON_MODULE_EXTENSION
     OR NOT DEFINED PYTHON_MODULE_DEBUG_POSTFIX)
    message(
      FATAL_ERROR
        "When cross-compiling, you should set the PYTHON_IS_DEBUG, PYTHON_MODULE_EXTENSION and PYTHON_MODULE_DEBUG_POSTFIX \
        variables appropriately before loading pybind11 (e.g. in your CMake toolchain file)")
  endif()
endif()
```

可以发现经过设置之后，本应该触发 `_PYBIND11_CROSSCOMPILING = TRUE` ，但是经过实验发现，走的是 `NOT _PYBIND11_CROSSCOMPILING` 分支，这就很奇怪了。而且这也是交叉编译时 `PYTHON_MODULE_EXTENSION` 被错误设置成 host-triplet 的后缀的原因，正常应该设置成 targt-triplet

# 怎么触发 `_PYBIND11_CROSSCOMPILING=TRUE`

在 `pybind11Common.cmake` 中，相关的代码如下：

```Shell
if(CMAKE_CROSSCOMPILING AND PYBIND11_USE_CROSSCOMPILING)
  set(_PYBIND11_CROSSCOMPILING
      ON
      CACHE INTERNAL "")
else()
  set(_PYBIND11_CROSSCOMPILING
      OFF
      CACHE INTERNAL "")
endif()
```

因此需要在 `find_package(pybind11)` 之前设置 `PYBIND11_USE_CROSSCOMPILING=TRUE`

# 触发后报错

报错的原因来自于上面列出过的代码，即如下片段：

```Shell
message(
      FATAL_ERROR
        "When cross-compiling, you should set the PYTHON_IS_DEBUG, PYTHON_MODULE_EXTENSION and PYTHON_MODULE_DEBUG_POSTFIX \
        variables appropriately before loading pybind11 (e.g. in your CMake toolchain file)")
```

因此，除了设置 `PYBIND11_USE_CROSSCOMPILING=TRUE` 以外，还需要：

```Shell
set(PYTHON_IS_DEBUG FALSE)
set(PYTHON_MODULE_EXTENSION .cpython-38-aarch64-linux-gnu.so)
set(PYTHON_MODULE_DEBUG_POSTFIX "")

# 另外还需要先，copy from jetson_utils
message("-- detecting Python ${PYTHON_BINDING_VERSION}...")

find_package(PythonInterp ${PYTHON_BINDING_VERSION} QUIET)
find_package(PythonLibs ${PYTHON_BINDING_VERSION} QUIET)

if(NOT ${PYTHONLIBS_FOUND})
	message("-- Python ${PYTHON_BINDING_VERSION} wasn't found")
	return()
endif()

message("-- found Python version:  ${PYTHON_VERSION_MAJOR}.${PYTHON_VERSION_MINOR} (${PYTHONLIBS_VERSION_STRING})")
message("-- found Python include:  ${PYTHON_INCLUDE_DIRS}")
message("-- found Python library:  ${PYTHON_LIBRARIES}") 
# 如果不设置的话，第二个代码块中的
# if(NOT _PYBIND11_CROSSCOMPILING) 和 else 分支都不会被触发，这个现象我没有深究。
```

# 参考资料：

1. [https://pybind11.readthedocs.io/en/stable/changelog.html#version-2-13-0-june-25-2024](https://pybind11.readthedocs.io/en/stable/changelog.html#version-2-13-0-june-25-2024) 
    
    ```Shell
    In CMake, if PYBIND11_USE_CROSSCOMPILING is enabled, then CMAKE_CROSSCOMPILING will be respected and will keep pybind11 from accessing the interpreter during configuration. Several CMake variables will be required in this case, but can be deduced from the environment variable SETUPTOOLS_EXT_SUFFIX. The default (currently OFF) may be changed in the future. #5083
    ```
    
2. [https://github.com/pybind/pybind11/pull/5083](https://github.com/pybind/pybind11/pull/5083)

---

---

# 补充

## 其他解决办法

> [!important] 根据最上面代码中的注释 WITH_SOABI 来看，给 `pybind11_add_module` 的 WITH_SOABI 参数传递值应该也能解决问题，但是没有尝试。

## 如何确定开发板支持的 soabi

```Shell
python3
Python 3.8.10 (default, Nov 22 2023, 10:22:35) 
[GCC 9.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import _imp
>>> _imp.extension_suffixes()
['.cpython-38-aarch64-linux-gnu.so', '.abi3.so', '.so']
>>>
```