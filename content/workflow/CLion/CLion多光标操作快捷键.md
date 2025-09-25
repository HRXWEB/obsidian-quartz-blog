---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:28 pm
updated: Thursday, September 25th 2025, 6:59:09 pm
---

1. opt + shift + click： 在鼠标指着的位置添加光标，再次点击取消
2. opt + opt不松开： 此时按住上下箭头可以添加光标
    1. 如果设置了 `Allow placement of caret after end of line` 那就会在正上/下方添加光标
    2. 如果没启动上面的设置，碰到更短的行，会在行尾添加光标
3. cmd + shift + 8： 启用列选择模式，状态栏会显示：

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925185839139.png)

4. 选中代码块→opt + shift + G： 将光标添加到所选块的每行的末尾

## 选择多个不连续的范围

1. ctrl + G 查找并选择下一个出现的并区分大小写的匹配单词/文本
2. cmd + ctrl + G 选择文档所有匹配的单词/文本

特别说明：

若直接选中了整个单词，会匹配所有有这几个字符的地方，==**不是单词匹配**==

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925185854037.png)

若将光标放在单词后面，会准确匹配单词，如下准确匹配了 `NRT_LOG` ，不匹配 `NRT_LOGW`

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925185905893.png)

1. opt + click + 鼠标拖移 按矩形模式选择代码块
2. cmd + opt + shift + click + 鼠标拖移 选择多个矩形代码块