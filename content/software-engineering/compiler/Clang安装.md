---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 1:51:45 pm
---

```Bash
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