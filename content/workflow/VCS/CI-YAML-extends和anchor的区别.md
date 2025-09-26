---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 11:08:17 am
---

# 核心区别概览

|   |   |   |
|---|---|---|
|特性|`extends`|`anchor` (锚点)|
|**来源**|GitLab CI 的原生关键字|YAML 语言的标准特性|
|**作用域**|可跨文件（与 `include` 结合使用）|仅限当前单个 YAML 文件|
|**合并策略**|**反向深度合并 (Reverse Deep Merge)**|**简单覆盖合并**|
|**数组合并**|**覆盖**整个数组|**覆盖**整个数组（但可以通过合并键 `<<` 实现变通）|
|**可读性**|通常更清晰、易于理解|对于复杂场景，可能导致可读性下降|
|**推荐使用**|**GitLab 官方推荐**，功能更强大|适用于文件内的简单、小范围复用|

---

# 详细解析与示例

## 1. 来源与基本用法

- `**extends**`: 这是 GitLab CI 为了提升配置复用性而专门设计的关键字。你可以在一个 job 中通过 `extends` 继承一个或多个其他 job 的配置。
    
    ```YAML
    .template:
      script:
        - echo "This is a template"
      tags:
        - docker
    
    my_job:
      extends: .template
      script:
        - echo "This is my job"
    ```
    
- `**anchor**` **(锚点)**: 这是 YAML 语言自身的特性，允许你在文档的一个地方定义一个锚点 (`&`)，然后在其他地方通过别名 () 引用它。通常与合并键 `<<` 结合使用。YAML
    
    ```YAML
    .template: &template_definition
      script:
        - echo "This is a template"
      tags:
        - docker
    
    my_job:
      <<: *template_definition # 使用合并键 << 引用锚点
      script:
        - echo "This is my job"
    ```

## 2. 作用域：跨文件 vs. 单文件

这是两者最核心的区别之一。

- `**extends**` 可以与 `include` 关键字完美结合，让你能够继承在其他文件中定义的模板。这对于构建可维护、模块化的 CI/CD 配置至关重要。

    `**templates.yml**`**:**

    ```YAML
    .base_job:
      image: ruby:3.1
    ```

    `**.gitlab-ci.yml**`**:**

    ```YAML
    include: 'templates.yml'
    
    test_job:
      extends: .base_job
      script:
        - echo "Running tests..."
    ```
    
- `**anchor**` 的作用域严格限制在定义它的那个 YAML 文件内。你无法在一个文件中定义锚点，然后在通过 `include` 引入的另一个文件中引用它。

## 3. 合并策略：深度合并 vs. 简单覆盖

当继承的模板和当前 job 中存在相同的键时，它们的合并行为不同。

- `**extends**` 使用**反向深度合并 (Reverse Deep Merge)** 策略：
    
    - **对于哈希（Hashes/Maps）**：会递归地合并。如果键冲突，当前 job 中的值会覆盖 `extends` 模板中的值。这对于嵌套结构（如 `variables`）非常有用。
    - **对于数组（Arrays）**：**不会合并，而是直接覆盖**。当前 job 的数组会完全替换模板中的数组。
    
    **示例 (深度合并哈希):**
    
    ```YAML
    .template:
      variables:
        VAR1: "template_var1"
        VAR2: "template_var2"
    
    my_job:
      extends: .template
      variables:
        VAR2: "job_var2"
        VAR3: "job_var3"
    ```
    
    **合并后的** `**my_job**`**：**
    
    ```YAML
    variables:
      VAR1: "template_var1"
      VAR2: "job_var2" # 被覆盖
      VAR3: "job_var3" # 新增
    ```
    
- `**anchor**` 使用的是 YAML 的标准合并，行为更像简单的键值覆盖。
    
    **示例 (数组覆盖):**
    
    ```YAML
    .template: &template_script
      script:
        - echo "Step 1 from template"
        - echo "Step 2 from template"
    
    my_job:
      <<: *template_script
      script:
        - echo "This is the only step in my job" # 整个 script 数组被覆盖
    ```
    
    **合并后的** `**my_job**`**：**
    
    ```YAML
    script:
      - echo "This is the only step in my job"
    ```

    `**extends**` **在这种情况下的行为是相同的，也会覆盖整个** `**script**` **数组。**

---

# 总结：如何选择？

- **优先使用** `**extends**`：
    - 当你需要跨多个文件组织和复用 CI/CD 配置时。
    - 当你需要更精细的哈希（如 `variables`）合并控制时。
    - 当你希望遵循 GitLab 官方推荐的最佳实践，以获得更好的可读性和可维护性时。
- **在特定场景下使用** `**anchor**`：
    - 当你只需要在**同一个文件内**进行非常简单、小范围的代码片段复用。
    - 当你对 YAML 的原生特性非常熟悉，并且确定不会有跨文件的需求时。

在绝大多数现代 GitLab CI/CD 的实践中，`extends` 因其强大的功能和灵活性，已经成为代码复用的首选方案。它与 `include` 的结合为构建复杂、可扩展的流水线提供了坚实的基础。