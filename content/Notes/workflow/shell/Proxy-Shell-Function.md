---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```shell
function set_proxy() {
    export https_proxy=http://127.0.0.1:7890 
    export http_proxy=http://127.0.0.1:7890
    export all_proxy=socks5://127.0.0.1:7890
}

function unset_proxy() {
    unset https_proxy
    unset http_proxy
    unset all_proxy
}
```