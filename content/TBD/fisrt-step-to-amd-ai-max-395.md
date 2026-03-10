---
title: 
draft: true
aliases: []
tags: []
created: 2026-03-02T17:56:10.1010+08:00
updated: 2026-03-02T18:02:45.4545+08:00
---

# 随笔

gpu 代号 gfx1151，驱动安装好后，启动过程应该可以看到

amd-ttm 配置显存 [^2]

ubuntu 发型版本、kernel 版本、ROCm 版本依赖版本可能很复杂，还没有收敛，这方面可以看资料 [^1]

- 使用 `linux-firmware-2026010`  or newer，避免 `linux-firmware-20251125`
- 使用 `linux-kernel 6.18.4` or newer
- ROCm 版本要用 `7.2+`

toolboxes [^3]

benchmark [^4]

# 资料

[^1]: [ROCm+Linux Support on Strix Halo: January 2026 Stability Update : r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1qggxyy/rocmlinux_support_on_strix_halo_january_2026/)

[^2]: [Strix Halo + ROCm 7.1 + Ubuntu 24.04 - by Local Hake](https://hakedev.substack.com/p/strix-halo-rocm-71-ubuntu-2404)

[^3]: [GitHub - kyuz0/amd-strix-halo-toolboxes](https://github.com/kyuz0/amd-strix-halo-toolboxes)

[^4]: [AMD Strix Halo — Backend Benchmarks (Grid View)](https://kyuz0.github.io/amd-strix-halo-toolboxes/)

[^5]: [Welcome to the Strix Halo Wiki! – Strix Halo Wiki](https://strixhalo.wiki)

[^6]: [Strix Halo AI Toolboxes](https://strix-halo-toolboxes.com)