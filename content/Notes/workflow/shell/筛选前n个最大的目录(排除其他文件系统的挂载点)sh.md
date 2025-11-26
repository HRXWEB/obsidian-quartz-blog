---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

对于这样一个文件系统：

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            378G     0  378G   0% /dev
tmpfs            76G   11M   76G   1% /run
/dev/sda3       961G  785G  127G  87% /
tmpfs           378G  595M  378G   1% /dev/shm
tmpfs           5.0M  4.0K  5.0M   1% /run/lock
tmpfs           378G     0  378G   0% /sys/fs/cgroup
/dev/loop0      128K  128K     0 100% /snap/bare/5
/dev/loop2       66M   66M     0 100% /snap/gtk-common-themes/1515
/dev/loop6       13M   13M     0 100% /snap/snap-store/1216
/dev/loop7      219M  219M     0 100% /snap/gnome-3-34-1804/93
/dev/loop8      350M  350M     0 100% /snap/gnome-3-38-2004/143
/dev/loop17      92M   92M     0 100% /snap/gtk-common-themes/1535
/dev/loop16     506M  506M     0 100% /snap/gnome-42-2204/176
/dev/loop15      13M   13M     0 100% /snap/snap-store/1113
/dev/loop10     517M  517M     0 100% /snap/gnome-42-2204/202
/dev/loop12     219M  219M     0 100% /snap/gnome-3-34-1804/90
/dev/loop14     350M  350M     0 100% /snap/gnome-3-38-2004/140
/dev/sda1       2.0G  6.1M  1.9G   1% /boot/efi
/dev/sda4       2.4T  1.5T  873G  63% /home
tmpfs            76G   20K   76G   1% /run/user/125
cpfs             10T  1.1T  9.0T  11% /public
tmpfs            76G   56K   76G   1% /run/user/2028
tmpfs            76G     0   76G   0% /run/user/2084
tmpfs            76G   56K   76G   1% /run/user/2033
/dev/loop3       64M   64M     0 100% /snap/core20/2582
/dev/loop1       64M   64M     0 100% /snap/core20/2599
/dev/loop11      51M   51M     0 100% /snap/snapd/24718
/dev/loop18      74M   74M     0 100% /snap/core22/2010
tmpfs            76G  684K   76G   1% /run/user/2032
/dev/loop19      50M   50M     0 100% /snap/snapd/24792
/dev/loop13      74M   74M     0 100% /snap/core22/2045
tmpfs            76G   44K   76G   1% /run/user/1000
/dev/loop5       56M   56M     0 100% /snap/core18/2923
/dev/loop4       56M   56M     0 100% /snap/core18/2934
tmpfs            76G  4.0K   76G   1% /run/user/2040
```

如果想要分析 `/` 目录，最困难的事 `/public` 和 `/home` 两个特别大的挂载点，这两个我不想分析，怎么办呢？

---

# 方法

```bash
sudo du -hx --max-depth=1 / | sort -rh | head -10
```

- `x` 或 `-one-file-system`: 这是关键选项，它确保 `du` 只在 `/` 所在的**同一文件系统**上进行计算，从而忽略 `/public`、`/home`、`/perception` 等其他挂载点。
- `h`: 以人类可读的格式（如G、M）显示大小。
- `-max-depth=1`: 只计算第一级子目录，让你能快速定位根目录下哪个大目录是问题所在。

使用这个命令后，`du` 的结果就会真实反映 `/dev/sda3` 分区的空间占用情况。你可以根据结果（比如 `/var`、`/opt`等）进一步深入分析，找出具体是哪个子目录占用了大量空间。