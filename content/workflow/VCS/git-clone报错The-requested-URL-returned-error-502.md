---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:28 pm
updated: Friday, September 26th 2025, 11:17:29 am
---

取消代理即可，碰到的问题是拉取内网的 gitlab 仓库出现此错误

---

# 问题复现描述

在 dockerfile 中有这一条命令

```Docker
RUN --mount=type=secret,id=NPU_CS_ACCESS_TOKEN,env=NPU_CS_ACCESS_TOKEN \
    pip install -U pip \
    && pip install "npu_cs[client] @ git+http://ci-token:${NPU_CS_ACCESS_TOKEN}@192.168.3.224:8081/algo-model-zoo/npu_cs.git"
```

之后 ci 触发了 docker build 之后，报错：

```Plain
#25 [stage-2 8/9] RUN --mount=type=secret,id=NPU_CS_ACCESS_TOKEN,env=NPU_CS_ACCESS_TOKEN     pip install "npu_cs[client] @ git+http://ci-token:****@192.168.3.224:8081/algo-model-zoo/npu_cs.git"
#25 1.183 Collecting npu_cs[client]@ git+http://ci-token:[MASKED]@192.168.3.224:8081/algo-model-zoo/npu_cs.git
#25 1.183   Cloning http://ci-token:****@192.168.3.224:8081/algo-model-zoo/npu_cs.git to /tmp/pip-install-j7_p0t2g/npu-cs_d201e0a97fe245f59d5190f0e37f3dce
#25 1.186   Running command git clone --filter=blob:none --quiet 'http://ci-token:****@192.168.3.224:8081/algo-model-zoo/npu_cs.git' /tmp/pip-install-j7_p0t2g/npu-cs_d201e0a97fe245f59d5190f0e37f3dce
#25 91.21   fatal: unable to access 'http://192.168.3.224:8081/algo-model-zoo/npu_cs.git/': The requested URL returned error: 502
#25 91.23   error: subprocess-exited-with-error
#25 91.23   
#25 91.23   × git clone --filter=blob:none --quiet 'http://ci-token:****@192.168.3.224:8081/algo-model-zoo/npu_cs.git' /tmp/pip-install-j7_p0t2g/npu-cs_d201e0a97fe245f59d5190f0e37f3dce did not run successfully.
#25 91.23   │ exit code: 128
#25 91.23   ╰─> See above for output.
#25 91.23   
#25 91.23   note: This error originates from a subprocess, and is likely not a problem with pip.
#25 91.23 error: subprocess-exited-with-error
#25 91.23 
#25 91.23 × git clone --filter=blob:none --quiet 'http://ci-token:****@192.168.3.224:8081/algo-model-zoo/npu_cs.git' /tmp/pip-install-j7_p0t2g/npu-cs_d201e0a97fe245f59d5190f0e37f3dce did not run successfully.
#25 91.23 │ exit code: 128
#25 91.23 ╰─> See above for output.
#25 91.23 
#25 91.23 note: This error originates from a subprocess, and is likely not a problem with pip.
#25 91.24 
#25 91.24 [notice] A new release of pip is available: 23.0.1 -> 25.1.1
#25 91.24 [notice] To update, run: pip install --upgrade pip
#25 ERROR: process "/bin/sh -c pip install \"npu_cs[client] @ git+http://ci-token:${NPU_CS_ACCESS_TOKEN}@192.168.3.224:8081/algo-model-zoo/npu_cs.git\"" did not complete successfully: exit code: 1
```

后来发现是代理的问题，然后取消了之后变成了如下命令

```Docker
RUN --mount=type=secret,id=NPU_CS_ACCESS_TOKEN,env=NPU_CS_ACCESS_TOKEN \
    pip install -U pip \
    && no_proxy="" http_proxy="" https_proxy="" pip install "npu_cs[client] @ git+http://ci-token:${NPU_CS_ACCESS_TOKEN}@192.168.3.224:8081/algo-model-zoo/npu_cs.git"
```

因为其他的过程需要代理，所以在这条命令暂时取消代理的作用。

# 参考

1. [https://blog.csdn.net/flyingnosky/article/details/107386784](https://blog.csdn.net/flyingnosky/article/details/107386784)