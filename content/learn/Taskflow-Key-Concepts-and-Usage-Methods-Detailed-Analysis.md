---
title: Taskflow关键概念与使用方法详解
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-12T16:53:35.3535+08:00
---

A `Task` in `Taskflow` is a _**callable**_ object for which the operation [std::invoke](https://en.cppreference.com/w/cpp/utility/functional/invoke) is applicable. It can be either a functor, a lambda expression, a bind expression, or a class object with `operator()` overloaded. All tasks are created from **[tf::Taskflow](https://taskflow.github.io/taskflow/classtf_1_1Taskflow.html)**, the class that manages a task dependency graph.

# tf::Taskflow

可以理解成计算图，用于管理计算节点，添加节点的方法：

- `placeholder` 返回一个task对象的handle
- `emplace` 参数可以是多个callable对象，返回对应的task handle

示例：

```C++
tf::Taskflow taskflow;
tf::Task A = taskflow.placeholder();
tf::Task B = taskflow.emplace([] () { std::cout << "task B\n"; });

auto [D, E, F] = taskflow.emplace(
  [](){ std::cout << "Task A\n"; },
  [](){ std::cout << "Task B\n"; },
  [](){ std::cout << "Task C\n"; }
);
```

# tf::Task

可以理解成计算图的计算节点，管理计算任务。常用方法：

- `name(const std::string &name)` 赋予名字给任务
- `name()` 获取任务名字
- `work(CallableObj&& callable)` 赋予新“工作”给节点
- `template <typename... Ts> Task& precede(Ts&&... tasks)` 指定前继节点
- `template <typename... Ts> Task& Task::succeed(Ts&&... tasks)` 指定后继节点
- `template <typename T> Task& Task::composed_of(T& object)` 添加子图

在每个task，都是使用通用的多态函数包装器— [std::function](http://en.cppreference.com/w/cpp/utility/functional/function.html) 来存储和调用每个 _**callable，**_因此函数callable需要满足function的要求：

1. 可复制
    
    ```C++
    \#include <iostream>
    \#include <functional>
    \#include <memory>
    
    int main() {
        // 创建一个 std::function 对象
        std::function<void()> task = [ptr = std::make_unique<int>(1)]() {
            std::cout << "captured unique pointer is not copyable";
        };
    
        // 调用 task
        task();
    
        // 尝试复制 task
        std::function<void()> task_copy = task;  // 编译失败
    
        return 0;
    }
    
    // compile error:
    /usr/include/c++/11/bits/std_function.h: In instantiation of ‘std::function<_Res(_ArgTypes ...)>::function(_Functor&&) [with _Functor = main()::<lambda()>; _Constraints = void; _Res = void; _ArgTypes = {}]’:
    main.cpp:17:5:   required from here
    /usr/include/c++/11/bits/std_function.h:439:69: error: static assertion failed: std::function target must be copy-constructible
      439 |           static_assert(is_copy_constructible<__decay_t<_Functor>>::value,
    // 过不了可复制这一静态断言
    ```
    
2. …

# tf::Executor

特点：

- 可以前后用于多次执行相同/不同的taskflow
- 线程安全
- `run_*` 方法是非阻塞返回
- 使用 `work-stealing` 算法来调度任务执行

> [!important]
> 
> ### **Attention**
> 
> A running taskflow must remain alive during its execution. It is your responsibility to ensure a taskflow not being destructed when it is running.
> 
> Similarly, you should avoid touching a taskflow while it is running.