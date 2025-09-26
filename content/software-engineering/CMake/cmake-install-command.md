---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:26 pm
updated: Friday, September 26th 2025, 3:31:30 pm
---

- 目录带 `/` 和 不带 `/` 是有区别的：
    
    - ==带有== ==`/`== ==意味将源目录内的内容拷贝到目标目录，不包括源目录本身==
    - ==不带== ==`/`== ==意味将包含源目录在内的内容拷贝到目标目录==

    ==举个例子：==

    ```Plain
    function(install_models)
        install(DIRECTORY ${CMAKE_SOURCE_DIR}/models/
                DESTINATION ${CMAKE_INSTALL_PREFIX}/models
                PATTERN "scripts" EXCLUDE
                PATTERN "output*" EXCLUDE
                PATTERN "quantizer_output" EXCLUDE
                PATTERN "compiler_output" EXCLUDE
        )
    endfunction()
    ```

    ==注意里面的== ==`${CMAKE_SOURCE_DIR}/models/`== ==最后带有== ==`/`== ==这意味着是将这个目录里面的内容拷贝到== ==`${CMAKE_INSTALL_PREFIX}/models`== ==目录下。==

# install_manifest.txt

## 根据 install_manifest.txt 删除已经安装的文件

```Shell
# 测试会删除什么文件
cat install_manifest.txt | xargs -I {} echo rm -rf -- {}
# 实际删除
cat install_manifest.txt | xargs -I {} rm -rf -- {}
# sudo 权限
sudo cat install_manifest.txt | xargs -I {} sudo rm -rf -- {}
```