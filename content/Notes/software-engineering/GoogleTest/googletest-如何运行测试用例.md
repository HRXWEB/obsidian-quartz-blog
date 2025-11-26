---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

- 列出所有的测试用例
    
    ```bash
    test_main --gtest_list_tests
    ```
    
- 执行特定的测试用例
    
    ```bash
    test_main --gtest_filter="HelloTest*"
    test_main --gtest_filter="HelloTest.Demo"
    ```