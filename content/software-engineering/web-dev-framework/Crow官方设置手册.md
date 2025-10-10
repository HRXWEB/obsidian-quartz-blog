---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!important] 针对 Linux 系统

Here's how you can install Crow on your favorite GNU/Linux distro.

# Getting Crow[¶](https://crowcpp.org/master/getting_started/setup/linux/#getting-crow)

## Requirements[¶](https://crowcpp.org/master/getting_started/setup/linux/#requirements)

- C++ compiler with at least C++11 support.
- Asio development headers (1.10.9 or later).
- **(optional)** ZLib for HTTP Compression.
- **(optional)** OpenSSL for HTTPS support.
- **(optional)** CMake for building tests, examples, and/or installing Crow.
- **(optional)** Python3 to build tests and/or examples.

> [!important] Crow's CI uses `g++-9.4` and `clang-10.0` running on AMD64 (x86_64) and ARM64v8 architectures.

## Using a package Manager[¶](https://crowcpp.org/master/getting_started/setup/linux/#using-a-package-manager)

You can install Crow on GNU/Linux as a pre-made package

Debian/Ubuntu

Simply download Crow's `.deb` file from the [release section](https://github.com/CrowCpp/Crow/releases/latest) and Install it.

Arch

Crow is available for Arch based distros through the AUR package `crow`.

## Release package[¶](https://crowcpp.org/master/getting_started/setup/linux/#release-package)

Crow provides an archive containing the framework and CMake files, just copy the `include`folder to `/usr/local/include` and `lib` folder to `/usr/local/lib`.

You can also download the `crow_all.h` file and simply include that into your project.

## Installing from source[¶](https://crowcpp.org/master/getting_started/setup/linux/#installing-from-source)

### **Using CMake[¶](https://crowcpp.org/master/getting_started/setup/linux/#using-cmake)**

1. Download Crow's source code (Either through Github's UI or by using`git clone https://github.com/CrowCpp/Crow.git`).
2. Run `mkdir build` inside of crow's source directory.
3. Navigate to the new "build" directory and run the following:`cmake .. -DCROW_BUILD_EXAMPLES=OFF -DCROW_BUILD_TESTS=OFF`
4. Run `make install`.

> [!important] You can ignore `-DCROW_BUILD_EXAMPLES=OFF -DCROW_BUILD_TESTS=OFF` if you want to build the Examples and Unit Tests.

> [!important] While building you can set: the `CROW_ENABLE_SSL` variable to enable the support for https the `CROW_ENABLE_COMPRESSION` variable to enable the support for http compression

> [!important] You can uninstall Crow at a later time using `make uninstall`.

### **Manually[¶](https://crowcpp.org/master/getting_started/setup/linux/#manually)**

Crow can be installed manually on your Linux computer.

==**MULTIPLE HEADER FILES**====**[¶](https://crowcpp.org/master/getting_started/setup/linux/#multiple-header-files)**==

- Project Only
    - Copy Crow's `include` directory to your project's `include` directory.
- System wide
    - Copy Crow's `include` directory to the `/usr/local/include` directory.

==**SINGLE HEADER (CROW_ALL.H)**====**[¶](https://crowcpp.org/master/getting_started/setup/linux/#single-header-crow_allh)**==

> [!important] `crow_all.h` is recommended only for small, possibly single source file projects, and ideally should not be installed on your system.

navigate to the `scripts` directory and run `./merge_all.py ../include crow_all.h`. This will generate a `crow_all.h` file that you can use in your projects.

> [!important] You can also include or exclude middlewares from your `crow_all.h` by using `-i` or `-e` followed by the middleware header file names separated by a comma (e.g. `merge_all.py ../include crow_all.h -e cookie_parser` to exclude the cookie parser middleware).

# Compiling your project[¶](https://crowcpp.org/master/getting_started/setup/linux/#compiling-your-project)

## Using CMake[¶](https://crowcpp.org/master/getting_started/setup/linux/#using-cmake_1)

In order to get your CMake project to work with Crow, all you need are the following lines in your CMakeLists.txt:

```Plain
find_package(Crow)
target_link_libraries(your_project PUBLIC Crow::Crow)
```

From there CMake should handle compiling and linking your project.

> [!important] For optional features like HTTP Compression or HTTPS you can set
> 
> the `CROW_ENABLE_SSL` variable to enable the support for https the `CROW_ENABLE_COMPRESSION` variable to enable the support for http compression

## Directly using a compiler[¶](https://crowcpp.org/master/getting_started/setup/linux/#directly-using-a-compiler)

All you need to do is run the following command:

```Plain
g++ main.cpp -lpthread
```

You can use arguments like `-DCROW_ENABLE_DEBUG`, `-DCROW_ENABLE_COMPRESSION -lz` for HTTP Compression, or `-DCROW_ENABLE_SSL -lssl` for HTTPS support, or even replace g++ with clang++.