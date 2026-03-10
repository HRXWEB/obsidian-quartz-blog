---
title: 手撕智能指针
draft: true
aliases: []
tags: []
created: 2025-12-16T17:04:18.1818+08:00
updated: 2025-12-16T17:37:45.4545+08:00
---

# 使用场景&&设计意图

- 从声明周期的角度考虑

# 析构行为差异对前向声明的影响

```cpp
// MyObjectHolder.h

class MyObject; // 前向声明 Impl 类

class MyObjectHolder {
private:
    // 只需要知道 MyObject 的名字和它是指针类型
    std::shared_ptr<MyObject> m_pimpl; 

public:
    // 构造函数、SetObject 等
};
// 注意：这里甚至不需要在 .h 文件中显式声明 ~MyObjectHolder();
```

### 深入解释：为什么 `shared_ptr` 更容易解耦？

`std::shared_ptr` 之所以能做到这一点，是因为它使用了 **类型擦除 (Type Erasure)** 技术来管理析构和释放，这与 `std::unique_ptr` 略有不同。

#### 关键机制：控制块 (Control Block)

1. `std::shared_ptr` 的内部结构**： 一个 `std::shared_ptr` 对象实际上包含两个指针：
    
    - 指向数据的指针（`MyObject*`）。
    - 指向**控制块 (Control Block)** 的指针。
        
2. **控制块的功能**： 控制块是智能指针在首次创建时动态分配的一个内部结构，它存储了：
    
    - 引用计数 (Reference Count)。
    - 弱引用计数 (Weak Reference Count)。
    - **类型擦除的 Deleter (删除器)**。
        
3. **析构时发生的事情**： 当 `MyObjectHolder` 被销毁时，其成员 `m_pimpl` 的析构函数会被调用。
    
    - `m_pimpl` 的析构函数只需访问控制块，将引用计数减一。
    - 如果引用计数达到 0，`m_pimpl` 会调用控制块中存储的 **Deleter** 函数来释放 `MyObject` 对象。
        
4. **不需要完整类型的原因**： 这个 Deleter 函数是**在创建 `shared_ptr` 时**（通常在 `.cpp` 文件中，此时 `MyObject` 的完整定义是可见的）被捕获和存储到控制块中的。因此，当编译器在**头文件**中处理 `MyObjectHolder` 的析构时，它不需要知道 `MyObject` 的完整定义，它只需要知道如何调用 `shared_ptr` 的析构函数来减少引用计数。

### 对比 `std::unique_ptr`

如果使用 `std::unique_ptr` 作为 Pimpl 成员，情况会略微复杂：

| 智能指针                    | 头文件 (`.h`) 中      | 实现文件 (`.cpp`) 中 | 限制                                                                                            |
| ----------------------- | ----------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `std::shared_ptr<Impl>` | 只需要 `class Impl;` | 包含 `Impl.h`     | 可以在 `.h` 中使用**编译器默认生成的析构函数**。                                                                 |
| `std::unique_ptr<Impl>` | 只需要 `class Impl;` | 包含 `Impl.h`     | 必须在 `.cpp` 文件中**显式定义** `~OuterClass()`。否则的话编译器会在 `.h` 中自动生成析构函数，但头文件不知道 `Impl` 的大小和析构函数，就会报错。 |
