---
title: RK3588性能测试与NPU驱动配置指南
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:30.3030+08:00
updated: 2025-10-11T16:51:55.5555+08:00
---

## 软件升级

从 [https://blog.csdn.net/sinat_37322535/article/details/113867789](https://blog.csdn.net/sinat_37322535/article/details/113867789) 可以看到是直接通过 apt 安装的驱动，猜测 apt 源里面有 firefly 相关的链接，一查果然有，直接升级：

```bash
sudo apt install firefly-rk3588npu-driver
sudo apt install fireflydev
```

也可以直接使用在 [https://github.com/airockchip/rknn-toolkit2/tree/v2.3.0/rknpu2/runtime/Linux](https://github.com/airockchip/rknn-toolkit2/tree/v2.3.0/rknpu2/runtime/Linux) 中下载相关的库和头文件，替换后就能直接升级到 `2.3.0`

### 升级到 2.3.0 的问题

升级过程：

```bash
teamhd@teamhd:/usr/include$ sudo scp -r username@192.168.7.102:/workspace/rknn-toolkit2/rknpu2/runtime/Linux/librknn_api/include/* .
rknn_api.h                                          100%   35KB  17.9MB/s   00:00
rknn_custom_op.h                                    100% 6056     7.6MB/s   00:00
rknn_matmul_api.h                                   100%   18KB  16.7MB/s   00:00

teamhd@teamhd:/usr/lib$ sudo scp -r username@192.168.7.102:/workspace/rknn-toolkit2/rknpu2/runtime/Linux/librknn_api/aarch64/* .
librknnrt.so

teamhd@teamhd:/usr/bin$ sudo scp -r username@192.168.7.102:/workspace/rknn-toolkit2/rknpu2/runtime/Linux/rknn_server/aarch64/usr/bin/* .
restart_rknn.sh                                     100%  252   313.7KB/s   00:00
rknn_server                                         100%  445KB  46.7MB/s   00:00
start_rknn.sh                                       100%   71   133.4KB/s   00:00
```

问题：

后面在给板端发送推理请求的时候，虽然正常推理了，但是会报错：

```plaintext
17232 SERVER get_all_plugin_paths(232): Can not access plugin directory: /usr/lib/rknpu/op_plugins, please check it!
42289 SERVER get_all_plugin_paths(232): Can not access plugin directory: /usr/lib/rknpu/op_plugins, please check it!
70331 SERVER get_all_plugin_paths(232): Can not access plugin directory: /usr/lib/rknpu/op_plugins, please check it!
74328 SERVER get_all_plugin_paths(232): Can not access plugin directory: /usr/lib/rknpu/op_plugins, please check it!
```

## 硬件资源

## 测试的模型

## 模型生成配置

模型生成阶段可以考虑，配置config，比如 single_core_mode来对比

## 性能评估

# 资料

1. [https://www.cnblogs.com/wsg1100/p/18106749](https://www.cnblogs.com/wsg1100/p/18106749)
2. [http://weike-iot.com:2211/rockchip/bsp/rk3568_linuxSDK/sdkV1.4.0_linux5.10/docs/cn/Common/NPU/rknpu2/02_Rockchip_RKNPU_User_Guide_RKNN_SDK_V1.6.0_CN.pdf](http://weike-iot.com:2211/rockchip/bsp/rk3568_linuxSDK/sdkV1.4.0_linux5.10/docs/cn/Common/NPU/rknpu2/02_Rockchip_RKNPU_User_Guide_RKNN_SDK_V1.6.0_CN.pdf)
3. API Reference
    [03_Rockchip_RKNPU_API_Reference_RKNN_Toolkit2_V2.3.0_CN.pdf](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/03_Rockchip_RKNPU_API_Reference_RKNN_Toolkit2_V2.3.0_CN.pdf)