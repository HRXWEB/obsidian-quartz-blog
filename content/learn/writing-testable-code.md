---
title: TDD——写能测试的代码
draft: false
aliases: []
tags: []
created: 2026-01-08T10:42:06.066+08:00
updated: 2026-01-08T13:13:56.5656+08:00
---

# TDD——测试驱动开发

经验之谈：

- 先写测试，一开始肯定 fail。要做的就是写一个最简单的实现，让测试通过
	```c++
	void TestAverageRating
	{
	MovieRating *nemo = new MovieRating("Finding Nemo");
	nemo->AddRating(4.0f);
	nemo->AddRating(5.0f);
	AssertEqual(nemo->GetAverageRating(), 4.5f, "nemo avg rating");
	}
	// 仅仅为了让测试通过，实现就是很简单
	// 如果实现没法满足使用的要求，那就是测试数量不够，没覆盖用户可能的 API 调用场景
	class MovieRating
	{
	public:
	MovieRating(const std::string &name) {}
	int GetRatingCount() const { return 0; }
	void AddRating(float r) {}
	float GetAverageRating() const { return 4.5f; }
	};
	```
- 开发的过程遇到 bug，要先针对 bug 先写测试再修复，确保之后回归测试的时候 bug 不会再遇到

# fake v.s. stub v.s. mock objects

## 快速对比

| **类型**   | **像什么** | **核心目标**      | **举例**                    |
| -------- | ------- | ------------- | ------------------------- |
| **Fake** | 简易版组件   | 替代沉重的真实系统     | 用 `List` 模拟数据库存储          |
| **Stub** | 答录机     | 提供固定输入以驱动测试   | 无论查谁都返回 `User(ID=1)`      |
| **Mock** | 监工/契约员  | 验证函数调用过程和逻辑顺序 | 验证 `SendEmail` 是否被调用了 1 次 |

## Fake（伪对象）

**用途：提供一个轻量化、但在功能上可运行的替代品。**

- **核心逻辑**：Fake 是一个具有简化业务逻辑的真实实现。
- **使用场景**：最经典的例子是**内存数据库（In-memory Database）**。相比于连接真实的生产数据库，Fake 数据库运行在内存中，速度极快且不产生持久化副作用。
- **特点**：它确实能工作，但由于性能或简化原因，不适合用于生产环境。

## Stub（桩对象）

**用途：为测试提供“预定义好”的固定响应。**

- **核心逻辑**：Stub 是对依赖项的硬编码实现。
- **使用场景**：例如，你有一个 `TestDatabase` 实例，无论你查询什么，它都始终返回同一个预设的对象。
- **特点**：它通常不关心调用者传了什么参数，也不记录调用过程，仅仅是为了让被测代码能够拿到数据并继续运行。

## Mock（模拟对象）

**用途：不仅提供数据，还负责验证“行为和过程”。**

- **核心逻辑**：Mock 是一个经过特殊设计的对象，具有预设的行为并能验证其方法被调用的顺序和次数。
- **使用场景**：
    - **预设复杂行为**：可以指定 `GetValue()` 前两次返回 10，之后返回 20。
    - **交互验证**：验证某个函数是否被调用了（例如：必须正好调用 3 次，或者至少 5 次）。
    - **顺序验证**：验证类中的函数是否按特定的给定顺序被调用。
- **特点**：Mock 是“有记忆”的监工，它会检查被测代码是否按照约定的“契约”在工作。

> [!question]
> 测试类的时候，可能会碰到因为测试，所以要把类作为基类来设计 API。这样 Mock Object 才能继承它替代它去测试环节工作。这在高性能场景感觉不可接受，怎么办呢？
> 
> 简单描述几个方案，具体不展开了，不属于本文范围：
> - CRTP 静态多态
> - 条件编译 `TEST_VIRTUAL void Shuffle();` 只有测试后 TEST_VIRTUAL 才是 virtual
> - 链接时替换

# 测试 Private 访问权限代码

> [!NOTE]
> 测试需要暴露实现细节，这与 API 的设计理念矛盾

## public 成员函数

缺点：

- 多了一个用户不会使用的专门用于测试的接口
- 这个“多余的”接口导致代码膨胀
	- 不过可以把实现放到测试单元里面，这样就不会膨胀库了
	- 但这种做法会让用户可以自己实现这个接口，破坏类的状态

## 友元函数

……

## 友元类

```c++
class Testable
{
	public:
		virtual ~Testable() = default;
	private:
		virtual void SelfTest() const = 0;
		friend class TestRunner;
};
class TestRunner
{
public:
	void RunTests(const Testable &test) const
	{
	test.SelfTest();
	}
};
class BBox : public Testable
{
	...
private:
	void SelfTest() const { ... }
};
```

ps: Testable 抽象基类是提升复用性的，每个需要测试的类都继承它并强制实现纯虚函数 `SelfTest`

# 自动化测试工具

## 测试套件/框架

 - [CppUnit](http://cppunit.sourceforge.net/)
 - [Boost Test](http://www.boost.org/)
 - [Google Test](https://github.com/google/googletest)
 - [Template Unit Test](http://tut-framework.sourceforge.net/)

## 代码覆盖度

指标：

- Function coverage
- Line coverage
- Statement coverage
- Basic block coverage
- Decision coverage
- Condition coverage

工具：

- [Gcov](http://gcc.gnu.org/onlinedocs/gcc/Gcov.html)
- [Intel Code Coverage Tool](http://www.intel.com/)
- [Bullseye Coverage](http://www.bullseye.com/)
- [Rational PureCoverage](http://www.rational.com/)

## Bug 跟踪

- **开源方案（如 Bugzilla）**：适合需要深度定制的大型开源项目（如 Linux 内核、Mozilla）。
- **商业方案（如 JIRA）**：极其强大且可定制，通常配合项目管理插件（如 GreenHopper/Jira Software）使用。
- **集成托管方案（如 GitHub Issues）**：将代码仓库、讨论区和 Bug 追踪集成在一起，适合追求“一站式”体验的项目

## 持续构建系统

- [Jenkins](https://www.jenkins.io/)
- [TeamCity](https://www.jetbrains.com/teamcity/)
- [CircleCI](https://circleci.com/)
- [Travis CI](https://travis-ci.com/)

