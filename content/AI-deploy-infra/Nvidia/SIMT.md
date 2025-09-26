SIMT = SIMD + multi-thread

- SIMD 是==单个线程==同时对多个数据执行相同的操作，并行度取决于 ALU 宽度
- SIMT 是==多个线程==同时对多个数据执行相同的操作，并行度取决于线程数量
    - 每个 “core” 有自己独立的 ALU、data cache
    - 共享 instruction cache、instruction decoder、Program Counter register

# 参考

1. [https://forums.developer.nvidia.com/t/simd-versus-simt-what-is-the-difference-between-simt-vs-simd/10459](https://forums.developer.nvidia.com/t/simd-versus-simt-what-is-the-difference-between-simt-vs-simd/10459)
2. **[SIMD与SIMT区别](https://zhuanlan.zhihu.com/p/389913100)**