---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

> [!info] Understanding the CMake `COMPONENT` keyword in the `install` command  
> Hello there, I recently had a number of questions around the CMake COMPONENT keyword used in the CMake install command and using COMPONENTS in the CMake find_package command.  
> [https://discourse.cmake.org/t/understanding-the-cmake-component-keyword-in-the-install-command/971](https://discourse.cmake.org/t/understanding-the-cmake-component-keyword-in-the-install-command/971)  

> 为了更好的组织 build 产物

# 实践效果

## install command

- 只安装 `lib component`

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926153522333.png)

- 安装所有（`NOT CMAKE_INSTALL_COMPONENT` 条件成立）

    ![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926153555747.png)

## cpack

如[文章](https://decovar.dev/blog/2021/09/23/cmake-cpack-package-deb-apt/)所说，设置 `CPACK_COMPONENTS_ALL` 即可指定需要打包的组件。

# 相关资料及理解

> @cmake.org: If `COMPONENT` is not provided a default component "Unspecified" is created. The default component name may be controlled with the `**[CMAKE_INSTALL_DEFAULT_COMPONENT_NAME](https://cmake.org/cmake/help/latest/variable/CMAKE_INSTALL_DEFAULT_COMPONENT_NAME.html#variable:CMAKE_INSTALL_DEFAULT_COMPONENT_NAME)**` variable.