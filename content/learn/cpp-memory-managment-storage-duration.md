---
title: c++ 内存管理——存储期
draft: false
aliases: []
tags: []
created: 2025-12-17T12:55:30.3030+08:00
updated: 2025-12-17T13:01:59.5959+08:00
---

# 存储期分类

1.  静态存储期 (Static Storage Duration)
    
    - **概念：** 具有静态存储期的对象，其寿命与**程序的运行周期**相同。它们在程序启动时分配内存（通常在数据段或 BSS 段），并在程序退出时才销毁。
    - **特征：**
        - **持久性：** 无论函数是否退出，该变量的值都会一直保持。
        - **唯一性：** 在其定义的作用域内，该变量在内存中只有一份副本。
        - **对应：** 全局变量、使用 `static` 关键字修饰的局部变量、`static` 成员变量。
            
2.  自动存储期 (Automatic Storage Duration)
    
    - **概念：** 具有自动存储期的对象，其寿命与**其定义所在的代码块**（如函数体）的执行时间相同。它们通常分配在**栈 (Stack)** 上。
    - **特征：**
        - **局部性：** 进入代码块时创建（初始化），退出代码块时自动销毁。
        - **不可持久性：** 退出代码块后，变量的值和存储空间即不再有效。
        - **对应：** 普通局部变量（非 `static` 的函数内变量）。
            
3.  动态存储期 (Dynamic Storage Duration)
    
    - **概念：** 具有动态存储期的对象，其寿命由**程序员显式控制**。它们通常分配在**堆 (Heap)** 上。
    - **特征：**
        - **手动管理：** 需要使用 `new` / `delete` (C++) 或 `malloc` / `free` (C) 等函数进行分配和释放。
        - **灵活性：** 对象的生命周期可以跨越其创建时的代码块。
        - **潜在风险：** 若忘记释放内存，会导致内存泄漏。
        - **对应：** 通过动态内存分配函数或运算符创建的对象。
            
4.  线程存储期 (Thread Storage Duration)
    
    - **概念：** 具有线程存储期的对象，其寿命与**创建它的线程**的执行时间相同。
    - **特征：**
        - **线程独立：** 每个线程都会拥有该变量的一份独立的副本。
        - **持久性（在线程内）：** 变量在整个线程生命周期内保持有效。
        - **对应：** 使用 `thread_local` 关键字声明的变量。

# 示例

```cpp
#include <iostream>
#include <thread>
#include <chrono>
#include <memory> // For std::unique_ptr in dynamic storage

// --- 1. 静态存储期 (Static Storage Duration) ---
// 全局变量：程序启动时创建，程序退出时销毁
int global_static_counter = 0;

void function_with_static_local() {
    // 静态局部变量：第一次调用时创建，但生命周期贯穿整个程序运行。
    // 每次调用函数时，它都会保持上一次的值。
    static int local_static_counter = 0; 
    local_static_counter++;
    std::cout << "  - 静态局部计数器 (local_static): " << local_static_counter << std::endl;
}

// --- 4. 线程存储期 (Thread Storage Duration) ---
// 线程局部变量：每个线程拥有自己独立的副本，生命周期与线程一致
thread_local int thread_specific_id = 100;

void thread_function(int thread_id) {
    // 每个线程都有自己独立的 thread_specific_id 副本
    thread_specific_id += thread_id; 
    std::cout << "\n[Thread " << thread_id << " 启动]" << std::endl;
    std::cout << "  - 线程存储期变量 (thread_local): " << thread_specific_id << std::endl;
    // 线程退出时，thread_specific_id 的副本被销毁
    std::cout << "[Thread " << thread_id << " 退出]" << std::endl;
}

// 主函数
int main() {
    std::cout << "--- 静态存储期示例 ---" << std::endl;
    global_static_counter = 10;
    std::cout << "  - 全局静态变量 (global_static_counter): " << global_static_counter << std::endl;
    function_with_static_local(); // local_static_counter = 1
    function_with_static_local(); // local_static_counter = 2
    
    // ----------------------------------------------------
    
    std::cout << "\n--- 自动存储期示例 ---" << std::endl;
    { // 这是一个代码块，用于演示自动存储期的生命周期
        // 自动局部变量 (栈变量)：进入代码块时创建
        int automatic_local_var = 50; 
        std::cout << "  - 自动存储期变量 (automatic_local_var): " << automatic_local_var << std::endl;
        // 退出代码块时，automatic_local_var 被自动销毁
    } 
    // std::cout << automatic_local_var; // 错误：超出作用域，变量已销毁

    // ----------------------------------------------------

    std::cout << "\n--- 动态存储期示例 ---" << std::endl;
    // 使用 new/delete 或智能指针 (推荐) 来管理动态存储期的对象
    
    // 动态存储期对象 (堆变量)：使用 new 分配，程序员控制生命周期
    // 推荐使用智能指针 std::unique_ptr 来避免内存泄漏
    std::unique_ptr<int> dynamic_ptr = std::make_unique<int>(123);
    std::cout << "  - 动态存储期变量 (Heap Value): " << *dynamic_ptr << std::endl;
    // 当 unique_ptr 离开 main 函数作用域时 (或程序结束时)，
    // 它会自动调用 delete 释放内存，实现了“手动”控制。
    
    // ----------------------------------------------------
    
    std::cout << "\n--- 线程存储期示例 ---" << std::endl;
    // 创建两个线程来演示 thread_local 的独立性
    std::thread t1(thread_function, 1);
    std::thread t2(thread_function, 2);
    
    // 等待线程执行完毕
    t1.join();
    t2.join();
    
    return 0; // 程序退出时，所有静态和动态对象（由 unique_ptr 管理的）被销毁。
}
```

---

**总结：** 核心区别在于变量的**生命周期**和**内存位置**：

- **静态/全局**：程序启动 - 程序结束 (数据段/BSS)
- **自动/局部**：进入代码块 - 退出代码块 (栈)
- **动态**：手动分配 - 手动释放 (堆)
- **线程**：线程启动 - 线程结束 (线程的独立存储空间)

