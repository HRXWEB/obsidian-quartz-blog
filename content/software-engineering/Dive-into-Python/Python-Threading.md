---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 继承线程

通用的做法是：

1. 继承 threading.Thread 父类
2. 重写 run 方法
3. 通过 start 运行线程

## 实例

```Python
import datetime
import os
import threading
import time


class MyThread(threading.Thread):
    def __init__(self, x, y):
        super().__init__()
        self.x = x
        self.y = y

    @staticmethod
    def log(msg):
        pid = os.getpid()
        t = threading.current_thread()
        print(f"进程:[{pid}]线程:[{t.ident}]{msg}")

    def add(self):
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.log(f"开始时间是:{now}, 参数是:{(self.x, self.y)}, 开始加法运算")
        self.log(f"执行加法:{self.x} + {self.y} = {self.x + self.y}")
        time.sleep(2)
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.log(f"结束时间是:{now},结束加法运算")
        return self.x + self.y

    def run(self):
        self.add()


if __name__ == '__main__':
    t1 = MyThread(1, 2)
    t1.start()
    t2 = MyThread(3, 4)
    t2.start()
    t1.join()
    t2.join()
```

# 参考

1. [https://www.cnblogs.com/rainbow-tan/p/16306471.html](https://www.cnblogs.com/rainbow-tan/p/16306471.html)