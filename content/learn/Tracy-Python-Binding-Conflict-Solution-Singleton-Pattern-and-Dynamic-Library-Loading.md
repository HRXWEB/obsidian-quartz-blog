---
title: Tracy与Python绑定冲突问题解决方案：单例模式与动态库加载
draft: false
aliases: []
tags: []
created: 2025-09-24T16:54:28.2828+08:00
updated: 2025-10-12T16:58:52.5252+08:00
---

# 正确解法

当前的项目 A 依赖 B，之前只有 A 依赖 tracy 做性能分析，之后 guizu 在给 B 也同时加上 tracy 做性能分析的时候，也碰到了初始化时会卡死的问题。

A 和 B 的 `CMakeLists.txt` 都写下了 `add_subdirectory(tracy)` 源码编译 tracy 依赖。

通过 deepwiki 解读 tracy 的源码和文档，得到了下面的[对话](https://deepwiki.com/search/-tracy-tracyinstancea-tracyins_fc794d7b-5cfd-4360-9e41-75dcf9ac1f6a)：

> **问**：您的单个进程中存在两个完全独立、互不知道对方存在的 Tracy 客户端实例 (Tracy_Instance_A 和 Tracy_Instance_B)。 多个全局队列：每个 Tracy 实例都有它自己的全局/静态 moodycamel::ConcurrentQueue (Queue_A 和 Queue_B)。这是一个高性能的、无锁的队列，但它的无锁特性是建立在“只有一个队列实例被多个线程访问”的前提下的。 状态冲突与死锁：Tracy 的设计假定在一个进程中它是一个 单例（Singleton）。它在初始化时会启动一个后台工作线程，这个线程负责从全局队列中取出数据，并通过网络发送给 Tracy 分析器。 当 [libnrt.so](http://libnrt.so/) 被加载时，Tracy_Instance_A 初始化，启动了第一个后台线程。 当 dataflow_py.so 被加载（Python 的 import 底层就是加载动态库）时，Tracy_Instance_B 也尝试初始化，它不知道已经有另一个实例存在，于是它也尝试去配置全局状态、启动第二个后台线程。 这两个实例在争夺一些底层的、可能是系统级的资源（比如网络套接字），或者在进行某些非线程安全的初始化步骤时，就产生了竞争条件，最终导致了死锁（程序卡死）。 所以，moodycamel::ConcurrentQueue 本身没有问题，问题在于我们错误地创建了它的多个实例，破坏了 Tracy 作为一个整体的设计。

> **答**：
> 
> Tracy 确实被设计为单例模式，在多个动态库中创建多个 Tracy 实例会导致严重问题。
> 
> ### **Tracy 的单例设计**
> 
> Tracy 使用全局静态变量来确保单例行为： TracyProfiler.cpp:1437-1438:
> 
> ```C++
>     assert( !s_instance );
>     s_instance = this;
> ```
> 
> 在 `**Profiler**` 构造函数中，Tracy 通过断言确保只有一个实例存在，并将该实例赋值给全局静态指针 `**s_instance**`。 TracyProfiler.cpp:1658-1660:
> 
> ```C++
> assert( s_instance );
>     s_instance = nullptr;
> }
> ```
> 
> ### **全局队列和状态管理**
> 
> 每个 Tracy 实例确实拥有自己的 `**moodycamel::ConcurrentQueue**`： TracyProfiler.cpp:1362:
> 
> ```C++
> moodycamel::ConcurrentQueue<QueueItem> init_order(103) s_queue( QueuePrealloc );
> ```
> 
> Tracy 还维护多个全局静态变量来管理状态： TracyProfiler.cpp:1363-1364:
> 
> ```C++
> std::atomic<uint32_t> init_order(104) s_lockCounter( 0 );
> std::atomic<uint8_t> init_order(104) s_gpuCtxCounter( 0 );
> ```
> 
> ### **多 DLL 项目的正确配置**
> 
> Tracy 文档明确说明了多 DLL 项目的问题和解决方案： tracy.tex:557-559
> 
> 正确的做法是创建一个专门的 profiler DLL，让所有其他 DLL 都链接到这个共享的 Tracy 实例，而不是在每个 DLL 中都编译 `**TracyClient.cpp**`。 tracy.tex:559-561：
> 
> ```LaTeX
> Things are a bit different in projects that consist of multiple DLLs/shared objects. Compiling \texttt{TracyClient.cpp} into every DLL is not an option because this would result in several instances of Tracy objects lying around in the process. We instead need to pass their instances to the different DLLs to be reused there.
> 
> For that, you need a \emph{profiler DLL} to which your executable and the other DLLs link. If that doesn't exist, you have to create one explicitly for Tracy\footnote{You can use the top-level Meson or CMake build scripts to get it. Make sure that the same build flags are set for both the library and your application, or you may find yourself chasing weird issues.}. This library should contain the \texttt{public/TracyClient.cpp} source file. Link the executable and all DLLs you want to profile to this DLL.
> 
> If you are targeting Windows with Microsoft Visual Studio or MinGW, add the \texttt{TRACY\_IMPORTS} define to your application.
> ```
> 
> ### **潜在的竞争条件**
> 
> 您提到的网络资源竞争确实可能发生。Tracy 在初始化时会创建网络套接字和 UDP 广播： TracyProfiler.cpp:1406-1407:
> 
> ```C++
>     , m_sock( nullptr )
>     , m_broadcast( nullptr )
> ```
> 
> 多个实例同时尝试绑定相同的网络端口或进行网络初始化可能导致冲突。
> 
> ### **解决方案**
> 
> 对于您的情况（`**libnrt.so**` 和 `**dataflow_py.so**`），应该：
> 
> 1. 创建一个共享的 Tracy 动态库
> 2. 确保两个 DLL 都链接到同一个 Tracy 实例
> 3. 在 Windows 上使用 `**TRACY_IMPORTS**` 定义： tracy.tex:561
>     
>     ```LaTeX
>     If you are targeting Windows with Microsoft Visual Studio or MinGW, add the \texttt{TRACY\_IMPORTS} define to your application.
>     ```
>     
> 
> ## **Notes**
> 
> Tracy 的设计确实假设进程中只有一个实例。文档中专门有一节讲述多 DLL 项目的配置，说明这是一个已知问题。您的分析准确地识别了问题的根源：多个独立的 Tracy 实例试图同时管理全局资源，违反了单例设计原则。

# 以下是一些尝试（可以不用看，仅作为排查记录）

使用的 tracy 版本是 v0.11.1

[strace_output_nanosleep.txt](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/strace_output_nanosleep.txt)

[strace_output.txt](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/strace_output.txt)

# binding 时 打开/关闭 tracy 现象对比

打开 tracy（左） v.s. 关闭 tracy（右）：

[content/attachments.nosync/assets/image 83.png|image 83.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/content/attachments.nosync/assets/image%2083.png%7Cimage%2083.png)

### `**mmap**` **调用**

- **2641098**:
    - 多次调用 `mmap` 分配匿名内存区域，大小分别为：
        - `983040` 字节（960 KB）
        - `8458240` 字节（约 8 MB）
        - `4259840` 字节（约 4 MB）
        - 两次 `33624064` 字节（约 32 MB）。
    - 这些调用表明该进程需要大量的动态内存分配，可能用于处理大块数据或复杂计算。
- **2640269**:
    - 没有调用 `mmap` 分配新的内存区域。
    - 相反，它调用了多次 `munmap` 来释放已分配的内存：
        - `munmap(0xffff9c808000, 224894)` 和 `munmap(0xffff925e5000, 135168)`。
        - 表明该进程在清理资源，可能准备退出。

### **信号处理相关调用**

- **2640269**:
    - 调用了 `rt_sigaction` 设置信号处理函数，将 `SIGINT` 信号的处理方式设置为默认行为（`SIG_DFL`）。
    - 调用了两次 `sigaltstack`：
        - 第一次查询当前的信号栈状态。
        - 第二次禁用信号栈（`ss_flags=SS_DISABLE`）。
    - 这些操作表明该进程正在清理信号处理相关的资源。
- **2641098**:
    - 没有涉及信号处理的调用。

## 结论（猜测）

打开 tracy 的情况下，接下来就要为收集系统信息开始做准备了，分析源代码知道会开启几个线程（Worker），而这几个线程会不断地调用 sleep 等待 ready。

相关的代码（SpawnWorkerThreads是在 Profiler 静态变量初始化时被调用）：

[content/attachments.nosync/assets/image 1 41.png|image 1 41.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/content/attachments.nosync/assets/image%201%2041.png%7Cimage%201%2041.png)

对应此时的线程状态：

```Bash
(gdb) thread apply all bt

Thread 5 (Thread 0xffffa523b1e0 (LWP 2667747)):
#0  __lll_lock_wait (futex=futex@entry=0xffffb72a09e8 <_rtld_global+2440>, private=0) at lowlevellock.c:52
#1  0x0000ffffb709ccec in __GI___pthread_mutex_lock (mutex=0xffffb72a09e8 <_rtld_global+2440>) at pthread_mutex_lock.c:115
#2  0x0000ffffb71cd03c in __GI__dl_addr (address=0x0, info=0xffffa523a928, mapp=0x0, symbolp=0x0) at dl-addr.c:131
#3  0x0000ffffb6507ffc in tracy::InitCallstack() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#4  0x0000ffffb65198ec in tracy::Profiler::SymbolWorker() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#5  0x0000ffffb651cee8 in tracy::Thread::Launch(void*) () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#6  0x0000ffffb709a624 in start_thread (arg=0xffffb651ced8 <tracy::Thread::Launch(void*)>) at pthread_create.c:477
#7  0x0000ffffb719549c in thread_start () at ../sysdeps/unix/sysv/linux/aarch64/clone.S:78

Thread 4 (Thread 0xffffa5e4c1e0 (LWP 2667746)):
#0  0x0000ffffb71625cc in __GI___clock_nanosleep (clock_id=<optimized out>, clock_id@entry=0, flags=flags@entry=0, req=<optimized out>, rem=0xffffa5e4b990) at ../sysdeps/unix/sysv/linux/clock_nanosleep.c:78
#1  0x0000ffffb7167f54 in __GI___nanosleep (requested_time=<optimized out>, remaining=<optimized out>) at nanosleep.c:27
#2  0x0000ffffb650b8f8 in tracy::Profiler::CompressWorker() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#3  0x0000ffffb651cee8 in tracy::Thread::Launch(void*) () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#4  0x0000ffffb709a624 in start_thread (arg=0xffffb651ced8 <tracy::Thread::Launch(void*)>) at pthread_create.c:477
#5  0x0000ffffb719549c in thread_start () at ../sysdeps/unix/sysv/linux/aarch64/clone.S:78

Thread 3 (Thread 0xffffa664d1e0 (LWP 2667745)):
#0  0x0000ffffb718bf08 in __GI___poll (fds=0xffffa664b200, nfds=1, timeout=<optimized out>) at ../sysdeps/unix/sysv/linux/poll.c:41
#1  0x0000ffffb64f8f58 in tracy::ListenSocket::Accept() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#2  0x0000ffffb6518254 in tracy::Profiler::Worker() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#3  0x0000ffffb651cee8 in tracy::Thread::Launch(void*) () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#4  0x0000ffffb709a624 in start_thread (arg=0xffffb651ced8 <tracy::Thread::Launch(void*)>) at pthread_create.c:477
#5  0x0000ffffb719549c in thread_start () at ../sysdeps/unix/sysv/linux/aarch64/clone.S:78

Thread 2 (Thread 0xffffa725e1e0 (LWP 2667744)):
#0  0x0000ffffb71625cc in __GI___clock_nanosleep (clock_id=<optimized out>, clock_id@entry=0, flags=flags@entry=0, req=<optimized out>, rem=0xffffa725c410) at ../sysdeps/unix/sysv/linux/clock_nanosleep.c:78
#1  0x0000ffffb7167f54 in __GI___nanosleep (requested_time=<optimized out>, remaining=<optimized out>) at nanosleep.c:27
#2  0x0000ffffb6516200 in tracy::SysTraceWorker(void*) () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#3  0x0000ffffb651cee8 in tracy::Thread::Launch(void*) () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#4  0x0000ffffb709a624 in start_thread (arg=0xffffb651ced8 <tracy::Thread::Launch(void*)>) at pthread_create.c:477
#5  0x0000ffffb719549c in thread_start () at ../sysdeps/unix/sysv/linux/aarch64/clone.S:78

Thread 1 (Thread 0xffffb7297010 (LWP 2667742)):
#0  0x0000ffffb650cd04 in tracy::Profiler::CalibrateDelay() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#1  0x0000ffffb650d798 in tracy::Profiler::Profiler() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#2  0x0000ffffb649cbf8 in ?? () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#3  0x0000ffffb727c8b4 in call_init (l=<optimized out>, argc=argc@entry=3, argv=argv@entry=0xffffd4e46928, env=env@entry=0xffffd4e46948) at dl-init.c:72
#4  0x0000ffffb727c9b4 in call_init (env=0xffffd4e46948, argv=0xffffd4e46928, argc=3, l=<optimized out>) at dl-init.c:30
#5  _dl_init (main_map=0x11858f20, argc=3, argv=0xffffd4e46928, env=0xffffd4e46948) at dl-init.c:119
#6  0x0000ffffb71ce07c in __GI__dl_catch_exception (exception=exception@entry=0x0, operate=operate@entry=0xffffb727fcc8 <call_dl_init>, args=0xffffd4e44970, args@entry=0xffffd4e44a00) at dl-error-skeleton.c:182
#7  0x0000ffffb7280a14 in dl_open_worker (a=a@entry=0xffffd4e44bc0) at dl-open.c:758
#8  0x0000ffffb71ce01c in __GI__dl_catch_exception (exception=exception@entry=0xffffd4e44ba8, operate=operate@entry=0xffffb7280540 <dl_open_worker>, args=args@entry=0xffffd4e44bc0) at dl-error-skeleton.c:208
#9  0x0000ffffb72801a4 in _dl_open (file=0xffffb692d280 "/home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so", mode=-2147483646, caller_dlopen=0x63e728 <_PyImport_FindSharedFuncptr+104>, nsid=-2, argc=3, argv=0xffffd4e46928, env=0xffffd4e46948) at dl-open.c:837
#10 0x0000ffffb708009c in dlopen_doit (a=a@entry=0xffffd4e44e88) at dlopen.c:66
#11 0x0000ffffb71ce01c in __GI__dl_catch_exception (exception=exception@entry=0xffffd4e44e00, operate=operate@entry=0xffffb7080038 <dlopen_doit>, args=args@entry=0xffffd4e44e88) at dl-error-skeleton.c:208
#12 0x0000ffffb71ce0e8 in __GI__dl_catch_error (objname=objname@entry=0x118a1890, errstring=errstring@entry=0x118a1898, mallocedp=mallocedp@entry=0x118a1888, operate=operate@entry=0xffffb7080038 <dlopen_doit>, args=args@entry=0xffffd4e44e88) at dl-error-skeleton.c:227
#13 0x0000ffffb7080838 in _dlerror_run (operate=operate@entry=0xffffb7080038 <dlopen_doit>, args=args@entry=0xffffd4e44e88) at dlerror.c:170
#14 0x0000ffffb7080140 in __dlopen (file=<optimized out>, mode=<optimized out>) at dlopen.c:87
#15 0x000000000063e728 in _PyImport_FindSharedFuncptr ()
#16 0x0000000000654610 in _PyImport_LoadDynamicModuleWithSpec ()
#17 0x000000000065681c in ?? ()
#18 0x000000000055ef44 in ?? ()
#19 0x0000000000591ea8 in PyVectorcall_Call ()
#20 0x00000000005040fc in _PyEval_EvalFrameDefault ()
#21 0x00000000004fca5c in _PyEval_EvalCodeWithName ()
#22 0x0000000000596454 in _PyFunction_Vectorcall ()
#23 0x0000000000502e38 in _PyEval_EvalFrameDefault ()
#24 0x0000000000596260 in _PyFunction_Vectorcall ()
#25 0x00000000004fe828 in _PyEval_EvalFrameDefault ()
#26 0x0000000000596260 in _PyFunction_Vectorcall ()
#27 0x00000000004fe700 in _PyEval_EvalFrameDefault ()
#28 0x0000000000596260 in _PyFunction_Vectorcall ()
#29 0x00000000004fe700 in _PyEval_EvalFrameDefault ()
#30 0x0000000000596260 in _PyFunction_Vectorcall ()
#31 0x00000000004fe700 in _PyEval_EvalFrameDefault ()
#32 0x0000000000596260 in _PyFunction_Vectorcall ()
#33 0x0000000000593510 in ?? ()
#34 0x0000000000593a58 in _PyObject_CallMethodIdObjArgs ()
#35 0x00000000004e345c in PyImport_ImportModuleLevelObject ()
#36 0x000000000050082c in _PyEval_EvalFrameDefault ()
#37 0x00000000004fca5c in _PyEval_EvalCodeWithName ()
#38 0x0000000000660eb0 in PyEval_EvalCode ()
#39 0x000000000064cf40 in ?? ()
#40 0x000000000064d00c in ?? ()
#41 0x000000000064d1c0 in PyRun_StringFlags ()
#42 0x000000000064d230 in PyRun_SimpleStringFlags ()
#43 0x000000000069b32c in Py_RunMain ()
#44 0x000000000069ba4c in Py_BytesMain ()
#45 0x0000ffffb70e4e10 in __libc_start_main (main=0x59a6e4 <_start+56>, argc=3, argv=0xffffd4e46928, init=<optimized out>, fini=<optimized out>, rtld_fini=<optimized out>, stack_end=<optimized out>) at ../csu/libc-start.c:308
#46 0x000000000059a6e0 in _start ()
Backtrace stopped: previous frame identical to this frame (corrupt stack?)
(gdb)
```

# 分析打开 tracy 时的 strace，对应的源码是什么

关注 gettid 时对应的源码是什么：

[content/attachments.nosync/assets/image 2 23.png|image 2 23.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/content/attachments.nosync/assets/image%202%2023.png%7Cimage%202%2023.png)

```Bash
gdb --args python3 -c "import dataflow_py"
(gdb) catch syscall gettid
(gdb) run
(gdb) bt
#0  syscall () at ../sysdeps/unix/sysv/linux/aarch64/syscall.S:39
#1  0x0000ffffbe93cf90 in tracy::detail::GetThreadHandleImpl() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#2  0x0000ffffbe96c5b4 in tracy::Profiler::Profiler() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#3  0x0000ffffbe2e7178 in __static_initialization_and_destruction_0 (__initialize_p=1, __priority=105)
    at /workspace/nova_dataflow/third-party/tracy/public/common/TracyStackFrames.cpp:122
#4  __static_initialization_and_destruction_0 (__priority=105, __initialize_p=1) at /workspace/nova_dataflow/third-party/tracy/public/common/TracyStackFrames.cpp:122
#5  _GLOBAL__sub_I.00105_TracyClient.cpp(void) () at /workspace/nova_dataflow/third-party/tracy/public/common/TracyStackFrames.cpp:122
#6  0x0000ffffbf6db8b4 in call_init (l=<optimized out>, argc=argc@entry=3, argv=argv@entry=0xfffffffff128, env=env@entry=0xfffffffff148) at dl-init.c:72
#7  0x0000ffffbf6db9b4 in call_init (env=0xfffffffff148, argv=0xfffffffff128, argc=3, l=<optimized out>) at dl-init.c:30
#8  _dl_init (main_map=0x967fa0, argc=3, argv=0xfffffffff128, env=0xfffffffff148) at dl-init.c:119
#9  0x0000ffffbf62d07c in __GI__dl_catch_exception (exception=0x0, operate=0xffffbf6decc8 <call_dl_init>, args=0xffffffffd170) at dl-error-skeleton.c:182
#10 0x0000ffffbf6dfa14 in dl_open_worker (a=a@entry=0xffffffffd3c0) at dl-open.c:758
#11 0x0000ffffbf62d01c in __GI__dl_catch_exception (exception=0xffffffffd3a8, operate=0xffffbf6df540 <dl_open_worker>, args=0xffffffffd3c0) at dl-error-skeleton.c:208
#12 0x0000ffffbf6df1a4 in _dl_open (file=0xffffbed8c280 "/home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so", mode=-2147483646,
    caller_dlopen=0x63e728 <_PyImport_FindSharedFuncptr+104>, nsid=-2, argc=3, argv=0xfffffffff128, env=0xfffffffff148) at dl-open.c:837
#13 0x0000ffffbf4df09c in dlopen_doit (a=a@entry=0xffffffffd688) at dlopen.c:66
#14 0x0000ffffbf62d01c in __GI__dl_catch_exception (exception=exception@entry=0xffffffffd600, operate=0xffffbf4df038 <dlopen_doit>, args=0xffffffffd688)
    at dl-error-skeleton.c:208
#15 0x0000ffffbf62d0e8 in __GI__dl_catch_error (objname=0x9b0780, errstring=0x9b0788, mallocedp=0x9b0778, operate=<optimized out>, args=<optimized out>)
    at dl-error-skeleton.c:227
#16 0x0000ffffbf4df838 in _dlerror_run (operate=operate@entry=0xffffbf4df038 <dlopen_doit>, args=args@entry=0xffffffffd688) at dlerror.c:170
#17 0x0000ffffbf4df140 in __dlopen (file=<optimized out>, mode=<optimized out>) at dlopen.c:87
#18 0x000000000063e728 in _PyImport_FindSharedFuncptr ()
#19 0x0000000000654610 in _PyImport_LoadDynamicModuleWithSpec ()
#20 0x000000000065681c in ?? ()
#21 0x000000000055ef44 in ?? ()
#22 0x0000000000591ea8 in PyVectorcall_Call ()
#23 0x00000000005040fc in _PyEval_EvalFrameDefault ()
#24 0x00000000004fca5c in _PyEval_EvalCodeWithName ()
#25 0x0000000000596454 in _PyFunction_Vectorcall ()
#26 0x0000000000502e38 in _PyEval_EvalFrameDefault ()
#27 0x0000000000596260 in _PyFunction_Vectorcall ()
#28 0x00000000004fe828 in _PyEval_EvalFrameDefault ()
#29 0x0000000000596260 in _PyFunction_Vectorcall ()
#30 0x00000000004fe700 in _PyEval_EvalFrameDefault ()
#31 0x0000000000596260 in _PyFunction_Vectorcall ()
#32 0x00000000004fe700 in _PyEval_EvalFrameDefault ()
#33 0x0000000000596260 in _PyFunction_Vectorcall ()
#34 0x00000000004fe700 in _PyEval_EvalFrameDefault ()
#35 0x0000000000596260 in _PyFunction_Vectorcall ()
#36 0x0000000000593510 in ?? ()
#37 0x0000000000593a58 in _PyObject_CallMethodIdObjArgs ()
#38 0x00000000004e345c in PyImport_ImportModuleLevelObject ()
#39 0x000000000050082c in _PyEval_EvalFrameDefault ()
#40 0x00000000004fca5c in _PyEval_EvalCodeWithName ()
#41 0x0000000000660eb0 in PyEval_EvalCode ()
#42 0x000000000064cf40 in ?? ()
#43 0x000000000064d00c in ?? ()
#44 0x000000000064d1c0 in PyRun_StringFlags ()
#45 0x000000000064d230 in PyRun_SimpleStringFlags ()
#46 0x000000000069b32c in Py_RunMain ()
#47 0x000000000069ba4c in Py_BytesMain ()
#48 0x0000ffffbf543e10 in __libc_start_main (main=0x59a6e4 <_start+56>, argc=3, argv=0xfffffffff128, init=<optimized out>, fini=<optimized out>, rtld_fini=<optimized out>,
    stack_end=<optimized out>) at ../csu/libc-start.c:308
#49 0x000000000059a6e0 in _start ()
Backtrace stopped: previous frame identical to this frame (corrupt stack?)
```

重点关注

```Bash
#0  syscall () at ../sysdeps/unix/sysv/linux/aarch64/syscall.S:39
#1  0x0000ffffbe93cf90 in tracy::detail::GetThreadHandleImpl() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#2  0x0000ffffbe96c5b4 in tracy::Profiler::Profiler() () from /home/admin/test/install/lib/dataflow_py.cpython-38-aarch64-linux-gnu.so
#3  0x0000ffffbe2e7178 in __static_initialization_and_destruction_0 (__initialize_p=1, __priority=105)
    at /workspace/nova_dataflow/third-party/tracy/public/common/TracyStackFrames.cpp:122
#4  __static_initialization_and_destruction_0 (__priority=105, __initialize_p=1) at /workspace/nova_dataflow/third-party/tracy/public/common/TracyStackFrames.cpp:122
#5  _GLOBAL__sub_I.00105_TracyClient.cpp(void) () at /workspace/nova_dataflow/third-party/tracy/public/common/TracyStackFrames.cpp:122
```

`__static_initialization_and_destruction_0` 看起来就是在初始化静态变量，并且找到了源码里面的 `105`

[content/attachments.nosync/assets/image 3 17.png|image 3 17.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/content/attachments.nosync/assets/image%203%2017.png%7Cimage%203%2017.png)

```Bash
#  ifdef __GNUC__
#    define init_order( val ) __attribute__ ((init_priority(val)))
#  else
#    define init_order(x)
#  endif
```

然后看一下 Profiler 类型实例化的过程：

[content/attachments.nosync/assets/image 4 11.png|image 4 11.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/content/attachments.nosync/assets/image%204%2011.png%7Cimage%204%2011.png)

可以看到 `gettid` 调用是由 `detail::GetThreadHandleImpl()` 发起的。

# 就算启动了几个子线程，主线程不应该被阻塞，应该持续运行啊？

分析 strace 的 txt 后，发现之后几万行的系统调用都是子线程在 nanosleep 之类的，主线程什么都不运行，这比较奇怪。

可能的一个解释是， `import dataflow_py` 在执行完毕之后， thread 就离开了作用域，会阻塞主线程退出。

tracy 定义的 Thread:

```C++
class Thread
{
public:
    Thread( void(*func)( void* ptr ), void* ptr )
        : m_func( func )
        , m_ptr( ptr )
    {
        pthread_create( &m_thread, nullptr, Launch, this );
    }

    ~Thread()
    {
        pthread_join( m_thread, nullptr );
    }

    pthread_t Handle() const { return m_thread; }

private:
    static void* Launch( void* ptr ) { ((Thread*)ptr)->m_func( ((Thread*)ptr)->m_ptr ); return nullptr; }
    void(*m_func)( void* ptr );
    void* m_ptr;
    pthread_t m_thread;
};
```