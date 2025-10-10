---
title:
draft: true
aliases: []
tags: []
created: Sunday, September 28th 2025, 6:17:03 pm
updated: Monday, September 29th 2025, 4:28:14 pm
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