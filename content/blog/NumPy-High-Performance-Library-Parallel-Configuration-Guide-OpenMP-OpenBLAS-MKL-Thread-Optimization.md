---
title: NumPy高性能库并行数配置指南：OpenMP、OpenBLAS、MKL线程优化
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-12T16:25:08.088+08:00
---

# 查看 numpy 依赖的高性能库信息

```python
import numpy
numpy.show_config()
>>> example info:
atlas_threads_info:
    libraries = ['lapack', 'ptf77blas', 'ptcblas', 'atlas']
    library_dirs = ['/usr/lib64/atlas']
    define_macros = [('ATLAS_INFO', '"\\"3.8.4\\""')]
    language = f77
    include_dirs = ['/usr/include']
blas_opt_info:
    libraries = ['ptf77blas', 'ptcblas', 'atlas']
    library_dirs = ['/usr/lib64/atlas']
    define_macros = [('ATLAS_INFO', '"\\"3.8.4\\""')]
    language = c
    include_dirs = ['/usr/include']
atlas_blas_threads_info:
    libraries = ['ptf77blas', 'ptcblas', 'atlas']
    library_dirs = ['/usr/lib64/atlas']
    define_macros = [('ATLAS_INFO', '"\\"3.8.4\\""')]
    language = c
    include_dirs = ['/usr/include']
openblas_info:
  NOT AVAILABLE
lapack_opt_info:
    libraries = ['lapack', 'ptf77blas', 'ptcblas', 'atlas']
    library_dirs = ['/usr/lib64/atlas']
    define_macros = [('ATLAS_INFO', '"\\"3.8.4\\""')]
    language = f77
    include_dirs = ['/usr/include']
>>>
```

# 调整并行数

```python
# OMP_NUM_THREADS: openmp,
# OPENBLAS_NUM_THREADS: openblas,
# MKL_NUM_THREADS: mkl,
# VECLIB_MAXIMUM_THREADS: accelerate,
# NUMEXPR_NUM_THREADS: numexpr

import os
os.environ["OMP_NUM_THREADS"] = "4" # export OMP_NUM_THREADS=4
os.environ["OPENBLAS_NUM_THREADS"] = "4" # export OPENBLAS_NUM_THREADS=4 
os.environ["MKL_NUM_THREADS"] = "6" # export MKL_NUM_THREADS=6
os.environ["VECLIB_MAXIMUM_THREADS"] = "4" # export VECLIB_MAXIMUM_THREADS=4
os.environ["NUMEXPR_NUM_THREADS"] = "6" # export NUMEXPR_NUM_THREADS=6
```

# 参考

1. [https://stackoverflow.com/questions/30791550/limit-number-of-threads-in-numpy](https://stackoverflow.com/questions/30791550/limit-number-of-threads-in-numpy)