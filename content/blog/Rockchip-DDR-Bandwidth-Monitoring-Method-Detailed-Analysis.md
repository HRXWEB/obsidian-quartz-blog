---
title: Rockchip DDR带宽监控方法详解
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:30.3030+08:00
updated: 2025-10-11T16:52:20.2020+08:00
---

[Linux_DDR_Bandwidth_Tool.tar.gz](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/Linux_DDR_Bandwidth_Tool.tar.gz)

```bash
tar xzvf Linux_DDR_Bandwidth_Tool.tar.gz
cd Linux_DDR_Bandwidth_Tool
chmod 777 ./rk-msch-probe-for-user-64bit
sudo ./rk-msch-probe-for-user-64bit -c rk3588
```

# 参考

1. [https://github.com/ArmSoM/Embedded-Technology-Blog/blob/main/armsom%E6%B5%8B%E8%AF%95/RK3588%20Mass%20Production%20TestingDDR%20Bandwidth%20Monitoring%20of%20ArmSoM-W3.md](https://github.com/ArmSoM/Embedded-Technology-Blog/blob/main/armsom%E6%B5%8B%E8%AF%95/RK3588%20Mass%20Production%20TestingDDR%20Bandwidth%20Monitoring%20of%20ArmSoM-W3.md)