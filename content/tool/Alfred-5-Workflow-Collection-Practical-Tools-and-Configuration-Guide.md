---
title: Alfred 5工作流集合：实用工具与配置指南
draft: 
aliases: []
tags: []
created: 2025-09-25T19:52:43.4343+08:00
updated: 2025-10-12T17:02:18.1818+08:00
---

# vika.cn

> [!example] vika.cn  
> [https://vika.cn/share/shrSQy9vTf6yVzt58CSD8/mirdjWxqdZWbkRSpHY/dstBi2ucPcbGT53Nso/viwHgQ5VFCkR0](https://vika.cn/share/shrSQy9vTf6yVzt58CSD8/mirdjWxqdZWbkRSpHY/dstBi2ucPcbGT53Nso/viwHgQ5VFCkR0)  

# notion-search-alfred5-workflow

> [!example] notion-search-alfred5-workflow
> https://github.com/wrjlewis/notion-search-alfred5-workflow

# alfred-terminalfinder

> [!example] alfred-terminalfinder
> https://github.com/LeEnno/alfred-terminalfinder

# alfred-open-with-vscode-workflow

> [!example] alfred-open-with-vscode-workflow
> https://github.com/alexchantastic/alfred-open-with-vscode-workflow

# Menu-Bar-Search

> [!example] Menu-Bar-Search
> https://github.com/BenziAhamed/Menu-Bar-Search

可能遇到的问题：

	`Assistive applications are not enabled in System Preferences.`

解决：

设置→安全性与隐私→辅助功能→允许Alfred

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925183218685.png)

如果还是不行的话，先按住图片里面的减号去掉Alfred，然后重新添加一次。

# alfred-process-killer

> [!example] alfred-process-killer
> https://github.com/ngreenstein/alfred-process-killer

# alfred-github-workflow

> [!example] alfred-github-workflow
> https://github.com/gharlan/alfred-github-workflow

前置依赖安装：`brew install php`

碰到命令不起作用的问题，什么都不输出，具体的表现可以看看：[Current version breaks in latest php from Homebrew · Issue #138 · gharlan/alfred-github-workflow](https://github.com/gharlan/alfred-github-workflow/issues/138)

然后同样按照开发者的排查方法操作了：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250925183348274.png)

在本地的 `~/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows` 目录下找到这个workflow的目录，并修改 `curl.hpp` 但是我多加了几行用来确定是不是调用的brew环境下php依赖的curl，而不是系统的 `/usr/bin/curl`

具体修改：

```PHP
$curlVersionInfo = curl_version();
echo "cURL Version Info: \n";
var_dump($curlVersionInfo);
print_r($info); exit;
```

发现和这个issue的提出者的输出是一样的，碰到了 http code = 0 的问题。

然后在 [https://stackoverflow.com/questions/10227879/php-curl-http-code-return-0](https://stackoverflow.com/questions/10227879/php-curl-http-code-return-0) 的第一个回答找到了可能的原因和测试代码，把里面请求的网址改成了这个workflow要请求的地址

[test.php](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/test.php)

运行 `php test.php` 后输出

```Plain
Return code is 0 
error setting certificate file: /opt/homebrew/etc/openssl@3/cert.pem
```

发现 `/opt/homebrew/etc/openssl@3/cert.pem` 软链接到了一个不存在的文件：

`/opt/homebrew/etc/openssl@3/cert.pem -> ../ca-certificates/cert.pem`

看起来是和 `ca-certificates` 的安装有关系，因此尝试 `brew install ca-certificates` 但是发现已经安装了，最终尝试，解决：

> [!important]
> 
> `brew reinstall ca-certificates`

# alfred-gitlab-workflow

> [!example] alfred-gitlab-workflow
> https://github.com/lukewaite/alfred-gitlab

配置：

1. 在gitlab上生成 access token，而后 `glsetkey <access_token>`
2. 设置GitLab API： `glseturl <host>/api/v4/projects`
    1. 其中 host 替换成相应的域名或者ip，例如
        1. 官网: `glseturl` `[http://gitlab.com/api/v4/projects](http://gitlab.com/api/v4/projects)`
        2. 自建: `glseturl` `[http://192.168.3.224:8081/api/v4/projects](http://192.168.3.224:8081/api/v4/projects)`

# clashx-alfred

> [!example] clashx-alfred
> https://github.com/mikelxc/clashx-alfred

# alfred-browser-tabs

> [!example] alfred-browser-tabs
> https://github.com/epilande/alfred-browser-tabs

# alfred-markdown-table

> [!example] alfred-markdown-table
> https://github.com/crispgm/alfred-markdown-table