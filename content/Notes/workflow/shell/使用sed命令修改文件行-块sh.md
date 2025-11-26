---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> [!important] [[sed命令中需要转义的字符]]

# 用例

使用 ==注释行== 和 ==注释块== 作为两个例子，来对齐有一个大致的了解

以下两个例子：

1. 都提前使用 `echo "$pattern" | sed 's/\//\\\//g'` 对 `pattern` 中的字符 `/` 进行转义
2. 使用的 sed 命令的形式是

## 注释行

```shellscript
comment_lines() {
    local file=$1
    shift
    local patterns=("$@")

    for pattern in "${patterns[@]}"; do
        # 转义斜杠
        local escaped_pattern=$(echo "$pattern" | sed 's/\//\\\//g')
        local cmd="sed -i '/^ *$escaped_pattern/s/^/# /' \"$file\""
        echo "Executing: $cmd"
        eval $cmd || { echo "Failed to execute command: $cmd"; return 1; }
    done
}

# 用法举例
comment_lines "$ROOT_DIR/CMakeLists.txt" \
    "add_subdirectory(third-party/ws-protocol)" \
    "add_subdirectory(\${CMAKE_SOURCE_DIR}/samples)" \
    "add_subdirectory(\${CMAKE_SOURCE_DIR}/scripts)"
```

## 注释块

```shellscript
comment_block() {
    local file=$1
    local start_pattern=$2
    local end_pattern=$3
    
    # 转义斜杠
    local escaped_start_pattern=$(echo "$start_pattern" | sed 's/\//\\\//g')
    local escaped_end_pattern=$(echo "$end_pattern" | sed 's/\//\\\//g')
    
    # 匹配从 escaped_start_pattern 开始到 escaped_end_pattern 结束的代码块
    local cmd="sed -i '/$escaped_start_pattern/,/$escaped_end_pattern/{s/^/# /}' \"$file\""
    echo "Executing: $cmd"
    eval $cmd || { echo "Failed to execute command: $cmd"; return 1; }
}

# 用法举例
if ! comment_block "$ROOT_DIR/dataflow/CMakeLists.txt" \
    "targetlink_directories(" \
    ")"; then
    echo -e "\033[0;31mAn error occurred while trying to comment out the code block.\033[0m"
    exit 1
fi
```

# sed pattern/{procedure}

`echo google | sed -n '/oo/{s/oo/kk/;p;q}'`

sed 操作指令分成两个部分：

1. pattern 表示要匹配的内容
2. procedure 表示要执行令的命令**序列**，即可以是多个命令，使用 `;` 作为分隔符。如 `{s/oo/kk/;p;q}`

## pattern

### 单行匹配

按照正常正则表达式操作即可

### 跨行匹配: `/<start>/,/<end>/`

完整的命令为： `sed [options] '/<start>/,/<end>/{procedure}'`

```shellscript
echo "vwef000
verbweg
111
222
verbweg
fgewrbva
gfqf111" | sed -n -e '/000/,/111/p'

>>>
vwef000
verbweg
111
```

# 参考

1. [https://www.runoob.com/linux/linux-comm-sed.html](https://www.runoob.com/linux/linux-comm-sed.html)
2. [https://www.cnblogs.com/harrymore/p/8676366.html](https://www.cnblogs.com/harrymore/p/8676366.html)
3. [https://blog.csdn.net/cy413026/article/details/121257887](https://blog.csdn.net/cy413026/article/details/121257887)