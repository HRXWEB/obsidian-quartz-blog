---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-12-25T12:57:06.066+08:00
---

# 为什么要做这件事情

1. **性能优化**：当你有一个计算密集型任务，并且发现 Python 实现的性能不足时，可以考虑将这部分逻辑用 C++ 实现，然后通过 `pybind11` 暴露给 Python 使用。
2. **复用已有 C++ 代码**：如果你已经有一套成熟的 C++ 库，并希望在新的 Python 项目中利用这些资源，那么 `pybind11` 是一个理想的选择。
3. **科学计算和机器学习领域**：在需要高性能计算或深度集成硬件加速的情况下（比如 GPU 运算），常常会遇到这种情况。例如，PyTorch 使用 `pybind11` 来实现其扩展模块，以便于研究人员可以在 Python 环境中轻松地调用高效的 C++ 后端。
4. **游戏开发或其他实时系统**：在这些对响应时间和性能有极高要求的应用中，可能会选择使用 C++ 作为核心引擎，同时利用 Python 的灵活性来进行快速原型设计或脚本编写。

# 注意事项

## **ImportError: dynamic module does not define module export function (PyInit__xxx)**

`PYBIND11_MODULE` 传入的名字和 `pybind11_add_module` 传入的名字要一样

这个 [例子](https://www.cnblogs.com/wakuwaku/p/17143206.html) 就不一样，所以就报错了：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154707484.png)
