---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Thursday, September 25th 2025, 8:00:41 pm
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