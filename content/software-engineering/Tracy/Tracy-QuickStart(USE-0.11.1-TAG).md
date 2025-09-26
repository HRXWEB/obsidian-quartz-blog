---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 3:42:22 pm
---
[]()
Tracy Profiler是一款开源的游戏开发工具，主要用于性能分析和调试。Tracy Profiler在Linux上的运行相关的问题：

1. **XDG Portal支持**：为了在文件选择器中获得更好的用户体验，建议安装`dbus`库。对于不喜欢现代特性的用户，可以选择安装`gtk3`库并通过构建选项强制使用GTK文件选择器。
2. **Wayland协议**：Tracy Profiler在Linux上的构建默认使用Wayland协议，这提供了对高DPI屏幕缩放和高精度输入设备（如触摸板）的支持。因此，不再需要`glfw`库。
3. **依赖项**：虽然`glfw`不再是Tracy Profiler的直接依赖，但是`libstdc++`的一个依赖——`libudev`仍然可能需要手动安装。
4. **Wayland依赖**：使用Wayland协议还需要安装`libxkbcommon`, `wayland`, `wayland-protocols`, `libglvnd`(某些发行版可能是`libegl`)。
5. **X11支持**：如果想使用X11而不是Wayland，可以通过在CMake构建设置中启用LEGACY选项。

## 编译server

Server 有两种：

- full-fledged graphical profiling interface（交互界面）
- headless capture-only utility（命令行控制）

### Interactive graphical profiling interface

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926154406278.png)


==**使用gtk3和X11作为显示的配置**==

1. 安装依赖项
    
    ```Bash
    sudo apt install libxrandr-dev \
     libxinerama-dev \
     libxcursor-dev \
     libxi-dev \
     libgtk-3-dev \
     libdbus-1-dev \
     libxkbcommon-dev \
    ```
    
2. 编译
    
    ```Bash
    cd tracy
    cmake -B profiler/build -S profiler -DCMAKE_BUILD_TYPE=Release -DGTK_FILESELECTOR=ON -DLEGACY=ON -DGLFW_BUILD_WAYLAND=OFF
    make -C profiler/build -j8
    ```
    
3. 使用
    
    ```Bash
    ./profiler/build/tracy-profiler
    ```

### Headless capture-only utility

1. 编译
    
    ```Bash
    cd tracy
    cmake -B capture/build -S capture
    make -C capture/build -j8
    ```
    
    - 可能的问题
        1. `undefined reference to symbol 'pthread_create@@GLIBC_2.2.5` 解决方法：`SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread")` 加入到 `CMakeLists.txt` 中。
        
2. 使用
    
    ```Bash
    ./capture/build/tracy-capture -a 127.0.0.1 -o output.trace
    ```
    
    - `-o output.tracy` - the file name of the resulting trace (required)
    - `-a address` - specifies the IP address (or a domain name) of the client application (uses localhost if not provided).
    - `-p port` - network port which should be used (optional).
    - `-f` - force overwrite, if output file already exists.
    - `-s seconds` - number of seconds to capture before automatically disconnecting (optional).
    - `-m memlimt` - sets memory limit for the trace. The connection will be terminated, if it is exceeded. Specified as ==**a percentage of**== total system memory. Can be greater than 100%, which will use swap. (Disabled, if not set.)

## client demo

[tracy_demo.tar.gz](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/tracy_demo.tar.gz)

```Bash
tar xzvf tracy_demo.tar.gz
cd my_project
git clone https://github.com/wolfpld/tracy
mkdir build
cd build
cmake ..
make -j8
./bin/my_app
```