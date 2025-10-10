---
title:
draft:
aliases: [buy-domain-and-configure-dns]
tags: []
created: 2025-09-17T11:34:42.4242+08:00
updated: 2025-10-10T18:01:17.1717+08:00
---

# 为什么要改 DNS 服务器

cloudflare：

- 更快的 DNS 解析速度和更高的可靠性
- 提供免费的 DDos 防护
- Cloudflare 本身就是一个内容分发网络，将 DNS 解析指向 Cloudflare，可以免费使用其 CDN 服务
- DNS 更改传播速度非常快
- 更多免费功能...

# 购买域名

自行搜索域名注册商即可，我用的是 [Godaddy](https://www.godaddy.com/en-ph)

# 获取 cloudflare 域名 NS[^1][^2]

按照脚注的链接操作，得到 cloudflare 分配的两个 NameServers 地址

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917143115074.png)

# 在域名注册商处配置域名 NS

按照上图的提示，一般都会填入域名之后，会自动识别你的域名注册商，点击链接打开。

默认情况下域名注册商会有自己的 NS，需要修改成 cloudflare 的。另外 `DNSSEC` 默认也是关闭的。

点击 `Change Nameservers` 将 cloudflare 提供（上图）的两个 NS 粘贴进去，效果如下

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250917143713512.png)

Tips：为了安全，截图中的 NS 的 prefix 我没截完全。

# [[写在最后]]

域名好贵

[^1]: https://vpszhijia.com/godaddy怎么设置nameservers

[^2]: https://cn.fahaiseo.com/how-to-add-site-set-up-dns-enable-cdn-in-cloudflare/
