---
title: 软件分支管理策略
draft: false
aliases: []
tags: []
created: 2026-01-07T11:42:50.5050+08:00
updated: 2026-01-07T12:00:45.4545+08:00
---

# 管理策略

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20260107114350587.png)

图源：API Design for C++ Ch.10@Martin·Reddy

## Truck 分支

**主干是整个项目的“唯一真相之源”。**

- **功能定义**：存储当前最稳定、可发布的开发状态。所有计划进入下一版本的功能最终都必须汇聚于此。
- **演进策略**：
    - **单向合并**：新的 API 功能不应直接在 Release 分支修改，而应先提交到 Trunk。
    - **作为起点**：所有的 Release 分支和大型 Dev 分支都从 Trunk 的某个特定时间点（Snapshot）拉出。
    - **API 保护**：主干上的 API 必须保持向下兼容。

## Release 分支

**发布分支是 Trunk 在特定时刻的“冷冻快照”，用于版本维护。**

- **功能定义**：隔离开发与发布。当 Trunk 达到发布要求时，拉出如 `release/1.0` 或 `release/2.0` 的分支。
- **演进策略**：
    - **最小变动原则**：严禁在 Release 分支进行功能开发。
    - **补丁更迭**：通过 **Cherry-pick** 从 Trunk 搬运紧急修复（Bug Fix），使版本从 `1.1` 演进到 `1.2`。
    - **生命周期（X）**：当更高版本（如 2.0）发布且稳定后，旧的 Release 分支（1.x）标记为 X（终止维护），不再接受任何更新。

## Hotfix 分支

**热修复是针对已发布版本的“紧急手术室”。**

- **功能定义**：当已发布的版本（如 2.0）发现致命 Bug，而此时 Trunk 或 2.1 正在进行不兼容的实验时，需拉出此分支。
- **演进策略**：
    - **溯源回流**：在 Hotfix 分支完成修复并发布（如 2.0.1）后，该修复 **必须立即合并回 Trunk**。
    - **防止复燃**：由于 Trunk 是后续所有版本的母体，只有回到 Trunk，才能确保 2.1 或 3.0 版本中不会再次出现同一个 Bug。

## Development 分支

**开发分支是大型特性或破坏性 API 改动的“隔离沙盒”。**

- **功能定义**：用于开发那些需要长期研发（如 3.0 dev）或可能导致主干不稳定的功能。
- **演进策略**：
    - **定期对齐**：开发团队应定期将 Trunk 的改动合并到 Dev 分支中（Sync to Trunk），避免最后合并时出现巨大的冲突。
    - **全量回归**：开发完成后，整个分支合并回 Trunk，随后进入下一个 Release 周期。

## 总结演进流程图

1. **开发阶段**：在 **Dev** 分支编写代码。
2. **集成阶段**：将 **Dev** 合并回 **Trunk**。
3. **准备发布**：从 **Trunk** 拉出 **Release (2.0)**。
4. **线上修复**：若 2.0 出错，拉出 **Hotfix**，修复后同时更新 **Release (2.0.1)** 和 **Trunk**。
5. **跨代升级**：当 **Trunk** 积累了足够的 Dev 代码，拉出 **Release (3.0)**，原 **Release (2.0)** 标记为 **X** 停止服务。

# Commit Message 规范和自动化

## 1. 结构化的 Commit Message 规范

为了支持自动化识别和 pick，建议采用 **Conventional Commits** 风格，并增加针对分支管理的元数据。

### 对于 Feature (feat) 演进

当你在 Trunk 上开发功能，但由于该功能属于 `1.1` 的范畴时：

> 格式示例：
> 
> feat(parser): add support for JSON5 format
> 
> - Resolves: #102
> 
> - Target-Release: 1.1.x (关键：用于脚本自动识别)
> 
> - Description: Extended the NumberSequence class to handle hex values.

### 对于 Hotfix 修复

Hotfix 的信息必须包含 **“根源追踪”**。

> 格式示例：
> 
> fix(core): prevent null pointer in NumberSequence::Reverse
> 
> - Bug-ID: #505
> 
> - Severity: Critical
> 
> - Original-Commit: \[hash\] (如果是针对某个具体提交的修复)
> 
> - Action: Must backport to release/2.0, release/2.1

## 2. 演进过程中的自动化工作

要实现你提到的“不遗漏”、“完备性”，必须建立以下四道自动化防线：

### 第一道：Pick List 自动化生成

- **标签扫描器**：编写脚本（或使用 GitHub Actions/GitLab CI）每天扫描 Trunk 上所有带有 `Target-Release: 1.1.x` 标签但尚未出现在 `release/1.1` 分支中的 Commit。
- **待办看板**：自动生成一个清单，对比 Trunk 和 Release 分支的差异，列出“待同步”的提交。

### 第二道：Hash 碰撞检测与溯源 (Cherry-pick -x)

- **强制溯源**：在执行 cherry-pick 时，强制要求使用 `-x` 参数。这会在新的 commit message 中记录 `(cherry picked from commit <original_hash>)`。
- **双向检测**：自动化工具会对比 Trunk 和 Release 分支。如果 Trunk 有一个 `fix` 提交，但在所有 Release 分支中找不到对应的 `cherry picked from` 记录，它会发出报警。

### 第三道：ABI 与 API 兼容性检测 (API Review 的机器版)

- **API Checker**：每次 pick 后，CI 自动对比 Release 分支在 pick 前后的 `public header` 差异。
- **ABI Compliance**：使用工具（如 `abi-compliance-checker`）确保你的修改没有改变原有类的内存布局（如增加私有成员变量），防止破坏二进制兼容性。

### 第四道：回归测试 (Unit Test & Integration Test)

- **独立测试环境**：Pick 到 Release 分支后，立即在 **该分支环境** 下跑一遍全量测试。
- **对比测试**：确保 pick 进来的新功能在 `release/1.1` 下的表现与在 `Trunk` 下完全一致。

## 3. 总结演进管理策略

|**环节**|**工具/手段**|**解决的问题**|
|---|---|---|
|**识别**|`git log --grep="Target-Release"`|确保 1.0 到 1.1 的演进不漏掉 Feature。|
|**搬运**|`git cherry-pick -x`|建立原件与副本的“数字指纹”联系。|
|**验证**|**ABI Compliance Checker**|确保 pick 的过程没有意外破坏 API 的“严格超集”承诺。|
|**闭环**|**Jira/GitHub Issue 状态同步**|只有当 Fix 同时出现在 Trunk 和相关 Release 分支时，该 Issue 才标记为 Closed。|
