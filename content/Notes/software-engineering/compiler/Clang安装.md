---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```bash
# 使用官方源
apt install gnupg wget -y
wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
cat << EOF > /etc/apt/sources.list.d/llvm-apt.list
deb http://apt.llvm.org/focal/ llvm-toolchain-focal-16 main
EOF
apt update && apt install clang-16 -y

# 多版本管理
update-alternatives --install /usr/bin/clang clang /usr/bin/clang-10 100
update-alternatives --install /usr/bin/clang clang /usr/bin/clang-16 160
update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-10 100
update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-16 160
```

针对 ubuntu20 来说，可以在这个链接 [https://apt.llvm.org/focal/dists/](https://apt.llvm.org/focal/dists/) 看需要的 llvm-toolchain-focal-<version> 然后加入到 apt 源中。