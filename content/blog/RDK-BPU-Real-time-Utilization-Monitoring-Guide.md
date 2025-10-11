---
title: RDK BPU实时利用率监控指南
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-11T16:54:41.4141+08:00
---

```Bash
watch -n 0.1 'hrut_somstatus -n 1 -d 0.1 | grep -A 2 "bpu status information---->"'
```

上述命令可以做到将 BPU 的信息提取出来并原地刷新，本质的命令是：

```Bash
/usr/bin/hrut_somstatus [-n count] [-d second]
```

某次统计的输出举例：

```Plain
=====================63=====================
temperature-->
	DDR      : 69.1 (C)
68205
	BPU      : 68.2 (C)
	CPU      : 67.3 (C)
cpu frequency-->
	      min(M)	cur(M)	max(M)
	cpu0: 300	1500	1500
	cpu1: 300	1500	1500
	cpu2: 300	1500	1500
	cpu3: 300	1500	1500
	cpu4: 300	1500	1500
	cpu5: 300	1500	1500
	cpu6: 300	1500	1500
	cpu7: 300	1500	1500
bpu status information---->
	      min(M)	cur(M)	max(M)	ratio
	bpu0: 500	1000	1000	97
ddr frequency information---->
	      min(M)	cur(M)	max(M)
	ddr:  266	4266	4266
GPU gc8000 frequency information---->
	      min(M)	cur(M)	max(M)
	gc8000:  200	1000	1000
```

# 参考

1. [https://developer.d-robotics.cc/api/v1/fileData/horizon_j5_open_explorer_cn_doc/runtime/source/tool_introduction/source/hrt_model_exec.html?highlight=%E8%B0%83%E5%BA%A6#latency](https://developer.d-robotics.cc/api/v1/fileData/horizon_j5_open_explorer_cn_doc/runtime/source/tool_introduction/source/hrt_model_exec.html?highlight=%E8%B0%83%E5%BA%A6#latency)