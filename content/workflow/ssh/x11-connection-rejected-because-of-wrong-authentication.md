---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 10:44:58 am
---

# 表现

经过 [[配置X11Forward显示远程图形界面]] 后， `xeyes` 可以正常使用。

但是运行某个程序时出现 `x11 connection rejected because of wrong authentication`

# 解决方案

在远程终端上设置：

```Shell
export XAUTHORITY=$HOME/.Xauthority
```

# 参考

1. [https://unix.stackexchange.com/questions/162979/annoying-message-x11-connection-rejected-because-of-wrong-authentication-while](https://unix.stackexchange.com/questions/162979/annoying-message-x11-connection-rejected-because-of-wrong-authentication-while)