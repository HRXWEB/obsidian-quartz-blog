---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

## 安装

```Shell
sudo apt-get update
sudo apt-get install linux-tools-common linux-tools-generic linux-tools-`uname -r`
find /usr -name perf
# ex:
ln -s /usr/lib/linux-tools/5.4.0-169-generic/perf /usr/bin/perf
```

安装中可能遇到的问题  
`E: Unable to locate package linux-tools-<kernel_version> ... ...`  
即使用的内核版本没有对应的linux-tools, 那就取消安装最后一个 linux-tools-`uname -r`. 例如笔者使用的4.14.48的内核版本就找不到. 最终链接的如上所示是5.4.0的版本.

> [!important] 不知道这么使用会不会有问题, 总之目前使用下来没什么问题.

## 使用

```Shell
cd <workspace>

# 准备生成火焰图的工具：
git clone <https://github.com/brendangregg/FlameGraph.git>

# 生成perf.data文件
perf record -g -- <command with arguments>

# 生成火焰图
perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > process.svg
```

## 扩展资料

后续想要进一步了解的话可以看看下面的资料：

1. [系统级性能分析工具perf的介绍与使用](https://www.cnblogs.com/arnoldlu/p/6241297.html)
2. [brendangregg/FlameGraph](https://github.com/brendangregg/FlameGraph)
3. [Linux Perf Example](https://www.brendangregg.com/perf.html)
4. [Perf 使用指南](https://yoc.docs.t-head.cn/linuxbook/Chapter4/perf.html)

# 参考资料

1. [Install Perf Tool in Linux](https://xiaoyanzhuo.github.io/2019/01/18/Perf-Tool.html)
2. [linux 性能分析工具perf使用详解](https://blog.csdn.net/cyq6239075/article/details/104371328)