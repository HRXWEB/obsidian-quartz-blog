---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 3:40:20 pm
---

- 列出所有的测试用例
    
    ```Bash
    test_main --gtest_list_tests
    ```
    
- 执行特定的测试用例
    
    ```Bash
    test_main --gtest_filter="HelloTest*"
    test_main --gtest_filter="HelloTest.Demo"
    ```