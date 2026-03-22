---
title: Excalidraw E2E 测试
draft: false
aliases: []
tags:
  - test
  - excalidraw
created: 2026-03-22T00:00:00.000+08:00
updated: 2026-03-22T00:00:00.000+08:00
---

# Excalidraw 端到端测试

> [!info] 集成方案文档
> 完整技术方案见 [[Excalidraw-Quartz-Integration-Guide|Excalidraw + Quartz v4 集成方案]]

![[e2e-full-test.excalidraw]]

## 测试清单

### 基础流程
- [x] autoexport：Obsidian 保存后自动生成 `e2e-full-test.excalidraw.svg`
- [x] pre-commit hook：`git commit` 时 `upload_excalidraw_svgs.sh` 自动上传 SVG 到 CDN
- [x] CDN URL：transformer 生成正确的 `cdnBase/e2e-full-test.excalidraw.svg`
- [x] SVG 内联注入：页面加载后 fetch CDN SVG 并通过 `innerHTML` 注入 DOM

### 链接重写
- [x] 1. 外部链接（蓝色）→ Excalidraw GitHub，点击跳转外部
- [x] 2. 外部链接（橙色）→ blog.rickyyel.org，点击跳转外部
- [x] 3. 内部双链 blog/（绿色）→ `/blog/Obsidian-Quartz-Blog-Setup-and-Configuration-Guide`
- [x] 4. 内部双链 learn/（紫色）→ `/learn/ABI-of-C-vs-ABI-of-CPP`
- [x] 5. 内部双链 book-review/（黄色）→ `/book-review/API-Design-for-C++`
- [x] 6. 内部双链 life/（灰色）→ `/life/climb-mount-tai`

### 嵌入（foreignObject iframe）
- [x] YouTube 嵌入 — 紫色边框，Chrome 正常显示播放器（Safari 通过 HTML 覆盖层实现）
- [x] 外部网页嵌入 — 橙色边框，excalidraw.com（被 X-Frame-Options 阻止，符合预期）
- [x] 内部笔记嵌入 — 绿色边框，`obsidian://` 已改写为站内路径

### 交互 & 样式
- [x] 深色模式：SVG 绘图反色，foreignObject 内容 counter-invert
- [x] 长按（1s）切换放大模式
- [x] Shift+滚轮缩放
- [x] 拖拽平移（20px 死区）
- [x] ESC 重置

### 浏览器兼容性
- [x] Chrome：所有功能正常，foreignObject iframe 原生渲染
- [x] Safari：SVG 形状/链接正常，foreignObject iframe 通过 HTML 覆盖层 fallback 渲染

### 已知限制
- Safari 的 `<foreignObject>` 不支持 CSS-only 尺寸（需要 `width`/`height` 属性），但添加属性会导致缩放错乱，因此采用 HTML 覆盖层方案
- `excalidraw.com` 等设置了 `X-Frame-Options` 的外部网站无法在 iframe 中嵌入
- jsDelivr CDN 默认缓存 7 天，更新 SVG 后可能需要手动 purge
