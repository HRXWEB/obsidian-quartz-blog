---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 3:12:23 pm
---

效果类似：

```Plain
Thu May 15 02:34:50 2025       
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 540.4.0                Driver Version: 540.4.0      CUDA Version: 12.6     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  Orin (nvgpu)                  N/A  | N/A              N/A |                  N/A |
| N/A   N/A  N/A               N/A /  N/A | Not Supported        |     N/A          N/A |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
                                                                                         
+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|  No running processes found                                                           |
+---------------------------------------------------------------------------------------+
```

这是正常的现象，见此讨论：[https://forums.developer.nvidia.com/t/nvidia-jetson-orin-nano-driver-problem/304622/10](https://forums.developer.nvidia.com/t/nvidia-jetson-orin-nano-driver-problem/304622/10)