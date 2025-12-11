---
title: 
draft: true
aliases: []
tags: []
created: 2025-10-24T14:56:03.033+08:00
updated: 2025-10-24T14:58:44.4444+08:00
---

# 检查模型量化编译的信息

```shell
# 用法
hb_model_info </path/to/model/bin/file>

# ex.
hb_model_info stereo_800x1280_nv12.bin
```

# 检查模型输入输出信息

```shell
# 用法
hrt_model_exec model_info --model_file </path/to/model/bin/file>

# ex.
hrt_model_exec model_info --model_file stereo_800x1280_nv12.bin
```