---
title: API Design for C++
draft: true
aliases: []
tags: []
created: 2025-12-18T19:15:46.4646+08:00
updated: 2025-12-23T11:16:21.2121+08:00
Author: Martin Reddy
Category:
Rating: ⭐️⭐️⭐️⭐️⭐️
---

# 点评

# Notes

- API 设计要考虑“概念完整性 (Conceptual Integrity)”，这里的“概念”不是指业务中的名词（如“用户”、“订单”），而是指**设计时的抉择（Design Decisions）**。例如：
	- 我们如何处理错误？（异常 vs 状态码）
	- 我们如何管理内存？（所有权归谁？）
	- 我们如何处理异步？（回调 vs Future vs 协程）
	- 我们的命名风格是什么？（驼峰式 vs 下划线）
	需要和**功能完备性**区分。功能完备性是横向的，关注 API 的**宽度**（功能覆盖面）。概念完整性是纵向的，关注 API 的**深度**（逻辑的一致性）。
- **需求文档**描述 API 的功能，**用户使用示例**从用户使用的角度考虑组合 API，二者结合使用。
- 架构文档中要描述高层次架构和设计的合理性，比较不同的设计和权衡，解释最终的结构为什么最优？
- 继承提供动态多态，模板提供静态多台。

# Highlight 摘选

## 让系统腐烂的八种致命“诱惑”

> [!quote] 
>  The code was never intended to last very long. For example, it was hastily written for a demo or it was meant to be throw-away prototype code.

作者列举的 8 点原因，几乎涵盖了所有失败项目的通用剧本：

- **短视（1, 3, 6）**：认为设计浪费时间，或者觉得“这就是个 Demo，以后会扔掉”，结果这个 Demo 跑了五年。
- **管理失控（4, 5, 7）**：让质量变差的代码随意合入，一味追求新功能而无视存量 Bug。
- **工程素养不足（2, 8）**：工程师不懂设计模式，或者**不写测试**。作者引用了 Michael Feathers 的名言：**“没有测试的代码就是遗留代码（Legacy Code）”**。这意味着你今天写的没测试的代码，下午就变成了沉重的历史包袱。

## 沟通的艺术

> [!quote] 
> Another useful technique when being asked to add a large new requirement without a change to the delivery schedule is to ask which of the existing requirements should be removed so that the new one can be added. This can often help to focus the discussion on the relative priority of the new requirement versus the existing ones.

在无法增加“时间”和“金钱”资源的情况下提出了新的需求时，强迫需求提出者对需求进行优先级排序，戳穿那种“既要、又要、还要”的幻觉。反问：“没问题，既然时间固定，那为了腾出时间做这个新功能，您觉得目前清单上的哪项旧功能可以被删掉或推迟？”