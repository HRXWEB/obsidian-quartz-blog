---
title: 内部链接性 v.s. 外部链接性 v.s. 导出符号
draft: true
aliases: []
tags: []
created: 2025-12-26T11:03:51.5151+08:00
updated: 2025-12-26T11:06:44.4444+08:00
---

这是一个非常精辟的问题。在很多人的直觉里，只要是“外部可见”的，就应该是“导出的”。但在 C++ 的动态链接库（DLL/Shared Library）开发中，**External Linkage（外部链接性）** 和 **Exporting（导出）** 确实是两个不同维度的概念。

简单来说：**External Linkage 是编译器的概念，而 Exporting 是链接器和操作系统加载器的概念。**

---

### 1. External Linkage（外部链接性）

**概念：** 决定了该符号在**同一个二进制程序内部**（比如在同一个 `.exe` 的不同 `.cpp` 之间）是否可以互相访问。

- **作用域：** 编译单元（Translation Unit）级别。
- **控制手段：** 使用 `static` 或匿名空间可以将符号限制为内部链接（Internal Linkage）。
- **默认行为：** 非 `static` 的全局函数和变量默认具有外部链接性。这意味着你在 `A.cpp` 定义的函数，在 `B.cpp` 里可以通过 `extern` 声明后使用。

### 2. Exporting（导出符号）

**概念：** 决定了该符号在**不同的二进制文件之间**（比如从 `Lib.dll` 到 `App.exe`）是否可见。

- **作用域：** 动态库边界级别。
- **控制手段：** 在 Windows 上通常使用 `__declspec(dllexport)`；在 Linux 上通常通过编译参数 `-fvisibility=hidden` 或符号映射表（Symbol Map）控制。
- **前提条件：** 一个符号**必须先具有 External Linkage**，才有可能被 Exporting。

---

### 3. 为什么说这是 "further"（进一步）的概念？

你可以通过下面的漏斗模型来理解：

1. **第一层（Static/Anonymous Namespace）：** 符号被锁在 `.cpp` 内部，完全无法向外看。
2. **第二层（External Linkage）：** 符号可以在库内部的各个 `.cpp` 之间自由流动。但是，它们依然被“墙”挡在动态库内部。
3. **第三层（Exporting）：** 你在墙上开了一个特定的口子（导出），让外部的 `.exe` 能够通过这个口子找到库里的函数地址。

### 4. 为什么要区分这两者？（核心价值）

如果你把所有具有 External Linkage 的符号都默认导出，会带来以下问题：

- **加载速度变慢：** 操作系统在加载动态库时需要解析成千上万个符号。导出得越多，程序启动越慢。
- **隐藏实现细节：** 你的动态库内部可能有 100 个类互相协作（它们之间需要 External Linkage），但你只想让用户看到其中 1 个类（Exporting）。这能防止用户非法耦合你的内部类。
- **避免冲突：** 如果两个不同的 DLL 导出了同名的辅助函数，主程序在加载时可能会产生冲突。

---

### 💡 举个例子

```c++
// --- Library 内部的 Helper.cpp ---
void InternalTask() {} // 默认 External Linkage

// --- Library 内部的 API.cpp ---
extern void InternalTask(); // 可以访问，因为是 External Linkage

// 这里是导出点
__declspec(dllexport) void PublicAPI() {
    InternalTask(); // 库内部调用没问题
}
```

**结果：**

- 用户拿到你的 DLL 后，可以调用 `PublicAPI()`。
- 用户**无法**通过 `extern void InternalTask();` 来调用你的内部工具函数，尽管它具有外部链接性。因为它没有被导出（Exported），它对 DLL 外部是不可见的。

**你现在的 SDK 项目是在 Windows (DLL) 还是 Linux (Shared Object) 上开发？不同平台的导出默认策略（全部隐藏 vs 全部公开）会有很大差异，我们可以深入聊聊如何配置它们的可见性。**

### 1. 默认可见性的差异

在 Windows 上，DLL 的符号默认是 **全部隐藏** 的，你必须显式使用 `__declspec(dllexport)` 才能导出一个函数。

而在 Linux 上，GCC 的默认行为是 **全部公开**：

- 只要一个符号具有 **External Linkage**（即没写 `static`，也没放进匿名命名空间），它就会被自动放入动态库的“导出符号表”中。
- 因此，你的 `sample/main.cpp` 在链接时能轻易找到库里的任何全局函数，即便你什么都没写。

---

### 2. 为什么 "Further Concept" 依然重要？

虽然在 Ubuntu 上你现在“不写也能跑”，但在专业的 SDK 开发中，你会发现这种“全开”模式是有风险的。这就是为什么会有“进一步（Further）”的导出控制：

#### 隐藏内部细节（-fvisibility=hidden）

为了保护库的内部实现，现代 Linux 库开发通常会模仿 Windows 的做法：

1. 在编译时加上参数：`-fvisibility=hidden`。这会把库里**所有**符号默认隐藏。
2. 在代码中显式指定导出：使用 `__attribute__((visibility("default")))`。

C++

```
// 只有这个函数能被外部 sample 调用
__attribute__((visibility("default"))) void PublicAPI();

// 虽然是 External Linkage，但由于开启了隐藏模式，外部链接器找不到它
void InternalHelper(); 
``` 

---

### 3. 区分 External Linkage 和 Exporting 的四个阶段

在 Linux 环境下，你可以通过下表理解这两个概念是如何“接力”的：

|**阶段**|**属性**|**发生位置**|**结果**|
|---|---|---|---|
|**1. 代码层**|`static` / 匿名空间|`A.cpp` 内部|**内部链接**：只有 `A.cpp` 能用，链接器看不见。|
|**2. 编译层**|普通全局函数|库的多个 `.cpp` 之间|**外部链接**：库里的 `B.cpp` 可以调用 `A.cpp` 的函数。|
|**3. 链接层**|Visibility 设置|动态库边界|**未导出**：符号在库内可用，但对 `sample/main.cpp` 不可见。|
|**4. 运行层**|Exported|`sample/main.cpp`|**已导出**：`main` 可以在运行时成功跳转到库的函数地址。|

---

### 💡 实验建议

如果你想亲眼看到这两者的区别，可以在你的 Ubuntu 上做个实验：

1. 运行命令：`nm -D your_library.so`。你会看到一长串符号，包括你的内部辅助函数。
2. 在编译库时加上 `-fvisibility=hidden`。
3. 再次运行 `nm -D`。你会发现你的函数名消失了。
4. 此时尝试运行你的 `sample`，它会报错：`symbol lookup error`（符号查找错误）。

这就是为什么作者说它是 **"further concept"** —— 它是在满足了代码层面的“外部链接性”之后，从**交付安全和性能**角度进行的二次筛选。

**既然你在 Ubuntu 上开发，你是否需要一套跨平台的宏（Macro），让你的代码既能在 Linux 默认隐藏符号，又能在 Windows 上正确导出？我可以为你提供这种标准的 SDK 模板。**