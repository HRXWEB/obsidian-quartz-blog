---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

```Bash
hrut_ddr -t all -p 1000
```

输出示例

```Plain
Time 364160.876s
MB/S   P0:CPU   P1:BPU  P2:VIN  P3:CODEC  P4:GPU      SUM
Read :    110     4035        0        0        0     4145
Write:    103     1175        0        0        0     1278

Time 364161.330s
MB/S   P0:CPU   P1:BPU  P2:VIN  P3:CODEC  P4:GPU      SUM
Read :    126     3857        0        0        0     3983
Write:    119     1163        0        0        0     1282

Time 364161.777s
MB/S   P0:CPU   P1:BPU  P2:VIN  P3:CODEC  P4:GPU      SUM
Read :    119     3997        0        0        0     4116
Write:    106     1186        0        0        0     1292
```

# 命令解析

```Bash
hrut_ddr -h
DDR MONITOR HELP INFORMATION
>>> -t/--type   sample type: cpu,bpu,vin,codec,gpu,sum,all
>>> -p/--period sample period: [1-1000] ms
>>> -r/--raw    print raw data
```