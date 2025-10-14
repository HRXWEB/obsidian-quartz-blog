---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-26T18:41:51.5151+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 安装 clang 特定版本

[[Clang安装]]

## 安装对应的 OpenMP

```Bash
apt install libomp-16-dev -y
# 安装后就可以在 /usr/lib/llvm-16/lib 下看到：
root@Nova85:/usr/lib/llvm-16/lib# ls | grep omp
libgomp.so
libiomp5.so
libomp-16.so.5
libomp.so
libomp.so.5
libompd.so
```

> [!important] ==**在容器和rootfs下都要安装**==

==下面解释解释一下为什么：==

在clang-10可以编译通过但是clang-16编译不能通过的情况下，先后对比了二者编译时产生的 `CMakeFiles/CMakeError.log` ：

clang-10

[CMakeError.log](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/CMakeError.log)

clang-16

[CMakeError 1.log](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/CMakeError%201.log)

对比可以发现二者都有一些共性的报错，既然clang-10可以 generate 成功，这些共性报错就不必关注，直接关注 clang-16 的特殊报错（并对比这一部分在clang-10上的表现）

clang-16 左 v.s. clang-10 右

```Plain
#include "..." search starts here:
#include <...> search starts here:
 /usr/lib/llvm-16/lib/clang/16/include
 /rootfs/usr/local/include
 /rootfs/usr/include/aarch64-linux-gnu
 /rootfs/usr/include
End of search list.
/workspace/nova_dataflow/cmake-build-release-nsd-remote-clang16/CMakeFiles/FindOpenMP/OpenMPTryFlag.c:2:10: fatal error: 'omp.h' file not found
#include <omp.h>
         ^~~~~~~
1 error generated.
```

```Plain
#include "..." search starts here:
#include <...> search starts here:
 /rootfs/usr/local/include
 /usr/lib/llvm-10/lib/clang/10.0.0/include
 /rootfs/usr/include/aarch64-linux-gnu
 /rootfs/usr/include
End of search list.
```

经过排查，发现 clang-10 是在 `/usr/lib/llvm-10/lib/clang/10.0.0/include` 下找到的 `omp.h`

可以发现这个路径是容器本身，因此要做的就是在容器安装 `libomp-16-dev`