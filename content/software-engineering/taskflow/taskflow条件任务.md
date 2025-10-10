---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 简单示例

```C++
int main() { 
  tf::Taskflow taskflow;
  tf::Executor executor;

  auto [init, cond, yes, no] = taskflow.emplace(
   [] () { },
   [] () { return 0; },
   [] () { std::cout << "yes\n"; },
   [] () { std::cout << "no\n"; }
  );

  init.name("init");
  cond.name("cond");
  yes.name("yes");
  no.name("no");

  cond.succeed(init)
      .precede(yes, no);  // executes yes if cond returns 0
                          // executes no  if cond returns 1

  executor.run(taskflow).wait();
  taskflow.dump(std::cout);

  return 0;
}
```

`cond task` 返回一个整数，代表了接下来要执行**几号**任务，后继的任务的index取决于 是按照什么顺序传入的，比如 `cond.precede(yes, no)` 代表 `yes task` 是 **0** 号任务，`no task`是 **1** 号任务

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182845155.png)

> [!important] 如果cond task 返回的index超过了可选的范围，executor 不会执行任何任务

# 概念

- 强依赖 `strong dependency`：前继节点是非条件任务
- 弱依赖 `weak dependency`：前继节点是条件任务

# 常见的错误

1. 无源任务 `no source task` 和 任务竞争 `task race`

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182859179.png)

    - error1: exectutor的scheduler要从一个零依赖的节点开始执行，此图不存在这样的节点
    - fix1: 添加一个源节点s来解决 error1
    - error2: D可能被调度两次。一次`strong dependency`E →D，一次`weak dependency`C → D
    - fix2: 通过添加一个辅助的 D-aux 来打破 `strong dependency` 和 `weak dependency` 的混用
    - risky: 任务X被M和P竞争
    
    > [!important] 是不是只有弱依赖才有这些问题？
    > 
    > 强依赖都是要等前继节点都执行完之后才能执行本节点。
    
2. 死锁
    
    ```C++
    // wrong implementation of while-loop using only one condition task
    tf::Taskflow taskflow;
    
    int i;
    
    auto [init, cond, body, done] = taskflow.emplace(
      [&](){ std::cout << "i=0\n"; i=0; },
      [&](){ std::cout << "while i<5\n"; return i < 5 ? 0 : 1; },
      [&](){ std::cout << "i++=" << i++ << '\n'; },
      [&](){ std::cout << "done\n"; }
    );
    
    init.precede(cond);
    cond.precede(body, done);
    body.precede(cond);
    ```

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182938545.png)

    `while i < 5` 强依赖于 `init` 和 `i++` 但是， `i++` 又要等 `while i < 5` 输出 0 才会执行，由此造成了死锁。

    正确的实现：

    ```C++
    tf::Taskflow taskflow;
    
    int i;
    
    auto [init, cond, body, back, done] = taskflow.emplace(
      [&](){ std::cout << "i=0\n"; i=0; },
      [&](){ std::cout << "while i<5\n"; return i < 5 ? 0 : 1; },
      [&](){ std::cout << "i++=" << i++ << '\n'; },
      [&](){ std::cout << "back\n"; return 0; },
      [&](){ std::cout << "done\n"; }
    );
    
    init.precede(cond);
    cond.precede(body, done);
    body.precede(back);
    back.precede(cond);
    ```

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182914610.png)
