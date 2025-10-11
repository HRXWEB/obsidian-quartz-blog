---
title: GPG密钥过期时间修改方法
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-11T17:30:11.1111+08:00
---

# 生成 gpg 密钥

```Shell
gpg --gen-key
>>> # 会要求填写如下几个部分，冒号后面是我填写的一个具体的例子
Real Name: username
Email address: user@example.com.cn
You need a Passphrase to protect your secret key: 5aidaYUMAOQIU    # 这个是用来保护密钥的密码。。。
>>>
```

这样生成的情况下，默认是两年过期，因此接下来说明如何修改过期时间

# 修改 gpg 密钥过期时间

```Shell
gpg --list-keys
>>>
gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
/home/username/.gnupg/pubring.kbx
------------------------------------
pub   rsa3072 2025-02-06 [SC]
      14A8D54DAE457C5233A63C8483558764B2FCCCA1
uid           [ultimate] username <user@example.com.cn>
sub   rsa3072 2025-02-06 [E] [expires: 2027-02-06]
>>>

# 选中 14A8D54DAE457C5233A63C8483558764B2FCCCA1 来修改
gpg --edit-key 14A8D54DAE457C5233A63C8483558764B2FCCCA1
>>>
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Secret key is available.

sec  rsa3072/83558764B2FCCCA1
     created: 2025-02-06  expires: never       usage: SC
     trust: ultimate      validity: ultimate
ssb  rsa3072/2B236CED728F1B1F
     created: 2025-02-06  expires: 2027-02-06  usage: E
[ultimate] (1). username <user@example.com.cn>

gpg> 
```

## 操作 gpg> 提示符

```Shell
# 可以看到子密钥 sub 才会过期，因此先通过 `key 1` 选中它
gpg> key 1
gpg> expire
# 根据提示选择 `0` 表示永不过期
gpg> save
```

# 后续收尾工作

## 更新已经分发过的位置

比如[[reprepro-Self-hosted-APT-Package-Repository-Practice-Guide]]中：

- 服务端重新导出 `gpg --output /var/www/html/apt-repository/public.key --armor --export 14A8D54DAE457C5233A63C8483558764B2FCCCA` 选择 y 进行 overwrite
- 客户端重新添加添加密钥 `wget -qO -` `[http://192.168.7.102/public.key](http://192.168.7.102/public.key)` `| sudo apt-key add -`