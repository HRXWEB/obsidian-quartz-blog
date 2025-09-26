具体碰到的情况是，graph如图

[graphviz_(1).png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-assets@main/assets/graphviz_%281%29.png)

但是跑起来之后最关键的两行输出

```Bash
I1021 18:33:55.932330 290986 stereo_flow.cpp:178] Start to run the main flow
I1021 18:33:55.953248 290986 main.cpp:70] Stereo Flow processing completed successfully.
```

开始跑之后立马就说**成功退出**了，中间没有任何的log信息，这不是正常现象。

  

> [!important] 排查发现是在task之间流动的或者taskflow最终的task的输出的cv::Mat 是empty的，没有报segmentfault是比较奇怪的。


[[解决tracy和python-binding-无法共存的问题]]