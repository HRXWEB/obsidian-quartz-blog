---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

1. 开机时一直按 `shift+Esc` 进入 grub menu，选择 `Adavanced options for ubuntu`

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926104802076.png)

> [!important] 如果碰到一闪而过无法进入 grub 的情况：
    > ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926104922329.png)
    > 
    > 参考
    > 
    > > [!info] 关于 Ubuntu 长按 shift 无效, 按 Esc 直接进入 grub 命令行的解决方案_ubuntu开机按住shift没反应-CSDN博客  
    > > [https://blog.csdn.net/geekqian/article/details/82912518](https://blog.csdn.net/geekqian/article/details/82912518)  
    > 
    > 解决。
    > 
    > 解决方法总结如下：
    > 
    > 进入 grub 命令行键入 `normal` 回车，然后立马狂按 `Esc`
    
2. 进入高级选项后，按上下键切换选择，选择第二行（不要按回车），直接按 `e` 键
3. 倒数第 `N` 行找到 `recovery nomodeset`, 如果后面还跟有东西就单独删除这两单词, 并把下面的代码加在句尾.否则就直接修改为下面这行代码 `quiet splash rw init=/bin/bash`
4. 按 F10 保存引导并进入下一个命令行界面
5. 使用 nvidia-smi 进行验证，如果链接不成功，说明是驱动出了问题。
6. 运行如下命令删除之前的显卡驱动

    ```Bash
    sudo apt remove --purge nvidia*
    ```
    
> [!important] 如果出现因为要升级，而此时没有网络来拉取包的问题，那就找到详细的要删除的包，命令行会提示类似这样的关键字， xx packages wil be removed：xxx xxx xxxx xxxxx。
    > 
    > 比如提示了 `linux-compute-nvidia-535*` ，慢慢的小范围的删除，而不是 `nvidia*` 这么大的一个范围
    
7. 重启 `reboot -f`

# 参考资料

1. [https://blog.csdn.net/geekqian/article/details/82912518](https://blog.csdn.net/geekqian/article/details/82912518)
2. [https://www.initroot.com/notes/linux/ubuntuNoGraphic.html](https://www.initroot.com/notes/linux/ubuntuNoGraphic.html)