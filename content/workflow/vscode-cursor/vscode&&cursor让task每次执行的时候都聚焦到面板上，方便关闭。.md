---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Thursday, September 25th 2025, 7:37:57 pm
---

主要是调整如下这个字段：

```JSON
"presentation": {
                "echo": true,
                "reveal": "always",
                "focus": true,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": true,
                "close": false
            },
```

每个字段的含义：

- "echo": true, // 是否在终端回显命令
- "reveal": "silent", // "always": 总是显示, "silent": 仅在有问题时显示, "never": 从不显示
- "focus": true, // 运行时是否让终端获得焦点
- "panel": "shared", // "shared": 共享一个终端, "dedicated": 每个任务专用, "new": 每次都新建
- "showReuseMessage": true, // 控制是否显示“终端将被任务重用，按任意键关闭”提示。
- "clear": false, // 控制是否在执行任务之前清除终端。
- "close": true // 任务执行成功后自动关闭终端

---

> [!important] 将 focus 设置为 true 后每次都会让终端获得焦点，这样光标就会在终端，此时按下任意键即可关闭此任务。