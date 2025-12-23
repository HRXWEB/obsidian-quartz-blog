---
title: 纯虚函数可以有实现
draft: false
aliases: []
tags: []
created: 2025-12-17T19:22:44.4444+08:00
updated: 2025-12-17T19:29:08.088+08:00
---

> [!HINT] 纯虚函数 != 没有实现
> C++ 允许为纯虚函数编写函数体

---

# 核心矛盾：强制性 vs. 便利性

在普通的虚函数中，如果你提供了实现，派生类可以**选择性**地重写。如果你忘了重写，程序会默认运行基类的版本。

而在某些设计场景下，你希望达成以下两个看似矛盾的目标：

1. **强制性**：我要求每一个派生类**必须**显式地重写这个函数，不能偷懒直接用基类的（防止意外的默认行为）。
2. **复用性**：虽然每个子类都要重写，但它们重写时的“核心逻辑”其实是一样的。我想把这部分公共代码写在基类里供它们调用。

**这就是纯虚函数实现的用武之地。**

---

# 实例

```cpp
// IRenderer.h
class IRenderer {
public:
    // 纯虚函数：强制派生类必须重写
    virtual void SetViewportSize(int w, int h) = 0; 
    virtual ~IRenderer() {}
};

// IRenderer.cpp
// 居然可以有实现！
void IRenderer::SetViewportSize(int w, int h) {
    std::cout << "Updating internal state: " << w << "x" << h << std::endl;
    // 这里存放所有渲染器通用的逻辑（如更新成员变量、日志记录等）
}

// ---------------------------------------------------------

// OpenGLRenderer.cpp
class OpenGLRenderer : public IRenderer {
public:
    void SetViewportSize(int w, int h) override {
        // 1. 调用基类的纯虚实现（复用通用逻辑）
        IRenderer::SetViewportSize(int w, int h);

        // 2. 实现 OpenGL 特有的逻辑
        // glViewport(0, 0, w, h);
    }
};
```

---

# 意义

#### A. 消除“默认行为”的危险

如果 `SetViewportSize` 只是普通的虚函数，开发者在写 `VulkanRenderer` 时可能忘了重写它。编译器不会报错，程序会运行基类的代码。如果基类代码对 Vulkan 来说是不完整的，就会产生难以排查的 Bug。

- **纯虚函数强制开发者必须写下这个函数名**，作为一种“签到”机制。

#### B. 提供“积木式”的基类行为

派生类在重写时，不需要从零开始。它可以通过 `Base::Method()` 调用基类的实现。基类就像提供了一套“标准组件”，子类在自己的函数体内决定**何时**以及**如何**组装这些组件。

#### C. 纯虚析构函数 (The Special Case)

这是纯虚函数实现最常见的用途。如果你想让一个类变成抽象基类，但它又没有任何合适的成员函数可以作为纯虚函数，你可以把析构函数设为纯虚：[]()

```cpp
class AbstractBase {
public:
    virtual ~AbstractBase() = 0; // 纯虚析构
};

// 必须提供实现，因为派生类析构时会向上调用基类析构
AbstractBase::~AbstractBase() {} 
``` 

---

# 接口 (Interface) vs. 抽象基类 (ABC)

- **纯接口 (Interface)**：不包含任何实现，只定义行为协议。
- **抽象基类 (ABC)**：包含部分实现（即便这些实现是在纯虚函数里）。

当你为纯虚函数提供实现时，这个类在语义上就从“纯协议”变成了“带有部分预设逻辑的骨架”。

---

# 总结

为纯虚函数提供实现，是为了实现一种**“有条件的强制重写”**：

1. 编译器确保你**不会忘记**重写（强制多态）。
2. 基类确保你**不必重复**编写通用逻辑（代码复用）。