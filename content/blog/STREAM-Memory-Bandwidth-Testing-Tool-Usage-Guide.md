---
title: STREAM内存带宽测试工具使用指南
draft: 
aliases: []
tags: []
created: 2025-09-28T18:17:03.033+08:00
updated: 2025-10-11T16:42:47.4747+08:00
---

# stream 文件

[stream.c](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/stream.c)

运行测试：

```shell
gcc -O3 -fopenmp -DSTREAM_ARRAY_SIZE=50000000 stream.c -o stream
export OMP_NUM_THREADS=核心数
./stream
```

# 参考资料

1. [内存性能 - STREAM](https://zhuanlan.zhihu.com/p/510954835)