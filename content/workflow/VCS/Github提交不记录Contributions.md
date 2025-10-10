---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:28.2828+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!info] Github提交不记录Contributions  
>  
> [https://yuhongjun.github.io/tech/2017/04/26/Github提交不记录Contributions.html](https://yuhongjun.github.io/tech/2017/04/26/Github提交不记录Contributions.html)  

**Contributions未被Github计入的几个常见原因：**

1. 进行Commits的用户邮箱没有被关联到你的Github帐号中。
2. 不是在这个版本库的默认分支（master）进行的Commit。
3. 这个仓库是一个Fork仓库，而不是独立仓库。

针对第一种情况，做一下特别说明：区分pull、clone、push等操作的权限和是否设置`user.email` `user.name` 之间的关系。

- 在进行pull、clone、push等操作时，权限是通过sshkey或者http输入用户名和密码来验证的。
- `user.email` `user.name` 设置是会被git读取并写在 `git log` 信息里面的。
- 因此二者之间没有任何关系，在github计算cotributions的时候，只会看 `log message` 记录的用户，和是谁提交的，怎么提交的(ssh/http)没有关系。

# 拓展

设置和查看设置

```Bash
# 设置，去掉 --global 就是针对某个仓库独立设置
git config [--global] user.emial <email>
git config [--global] user.name <name>

# 查看设置
git config -l --global
git config -l --local
```