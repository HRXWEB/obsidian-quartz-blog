---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:28 pm
updated: Thursday, September 25th 2025, 7:12:22 pm
---

ctrl + T 打开重构列表

CLion中最流行的重构

|功能|快捷键|描述|具体描述链接|
|---|---|---|---|
|Safe Delete|Сmd + Delete|确保不会删除别的源文件中引用的文件|[Safe delete](https://www.jetbrains.com/help/clion/safe-delete.html?keymap=macOS)|
|Copy/Move|F5/F6|Copies/Moves 一个元素|[Move and Copy](https://www.jetbrains.com/help/clion/move-refactorings.html?keymap=macOS)|
|Extract Method|Сmd + Opt + M|将源代码重构成方法，保持dry|[Extract function](https://www.jetbrains.com/help/clion/extract-method.html?keymap=macOS)|
|Extract Constant|Сmd + Opt + C|声明一个新**常量**并使用所选表达式对其进行初始化，避免hard code|[Extract constant](https://www.jetbrains.com/help/clion/extract-constant.html?keymap=macOS)|
|Extract Parameter|Сmd + Opt + P|向方法声明添加新参数并相应更新函数调用|[Extract parameter](https://www.jetbrains.com/help/clion/introduce-parameter.html?keymap=macOS)|
|Introduce Variable|Сmd + Opt + V|声明一个新**变量**并使用所选表达式对其进行初始化|[Extract/Introduce variable](https://www.jetbrains.com/help/clion/extract-variable.html?keymap=macOS)|
|Rename|Shift + F6|安全地重命名元素/文件/目录，会改变声明和所有调用它的地方|[Rename](https://www.jetbrains.com/help/clion/rename-refactorings.html?keymap=macOS)|
|Inline|Сmd + Opt + N|内联一个元素，作用与extract相反|[Inline](https://www.jetbrains.com/help/clion/inline.html?keymap=macOS)|
|Change signature|Сmd + F6|更改方法或类的调用签名|[Change signature](https://www.jetbrains.com/help/clion/change-signature.html?keymap=macOS)|

## Extract XXX 演示

[https://www.youtube.com/watch?v=UYrhNG9bRng](https://www.youtube.com/watch?v=UYrhNG9bRng)

## Rename

### 元素

可以重命令所有匹配的地方，包括注释里面

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191138346.png)

更多精细化的配置可以点击 `more options`:

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191152823.png)

### 文件/目录

在 `Project tool window` 选择文件/目录 → shift + F6

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191203246.png)

Clear the **Rename associated file** checkbox if don't want CLion to rename the associated files with the same name.

如果在别的地方有相同名称的关联文件，可以选择要不要把这些文件也重命名了。

## **Change signature** 更改签名

- change the function name and return type
- add, remove, and reorder parameters

## 将类成员移动到父类/子类 **Pull members up, push members down**

1. **Refactor | Pull Members Up**
2. **Refactor | Push Members Down**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925191215502.png)

图上红色感叹号说明 `aabb` 依赖 `getRect` , 把 `aabb` 移走可能会有问题