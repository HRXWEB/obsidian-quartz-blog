---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

"Here document" 是一种在 shell 脚本中嵌入多行字符串的方法。它允许你将多行文本作为标准输入传递给命令，而无需将文本存储在单独的文件中。基本语法如下：

```bash
command << DELIMITER
line 1
line 2
...
DELIMITER
```

这里的 `DELIMITER` 就是你选择的一个字符串，用来标记 "here document" 的开始和结束。这个定界符可以是任何字符串，但通常选择一个在文本内容中不会出现的字符串，例如 `EOF`、`EOL`、`_END_` 等。使用 `EOF` 或 `EOL` 只是约定俗成的习惯，它们在功能上是等价的。

---

# DELIMITER 和 ‘DELIMITER’ 的区别

当 "here document" 的定界符（DELIMITER）被引用（单引号、双引号或反斜杠）时，shell 会将其视为字面量，禁用变量展开、命令替换和转义字符解析。

```shellscript
cat << 'EOF'
This is a $VARIABLE.
This is a $(command).
EOF
# 输出:
# This is a $VARIABLE.
# This is a $(command).
```

# 既要字面量又要有变量展开的解决方案

> [!important] 方案：转义不希望展开的特殊字符

```shellscript
#!/bin/bash

# 需要展开的变量
MY_VAR="Hello World"
CURRENT_DATE=$(date +%Y-%m-%d)

cat << EOF
# 这是一个配置文件示例
# 变量 MY_VAR 的值是: $MY_VAR
# 当前日期是: $CURRENT_DATE

# 下面是需要字面量表示的特殊字符:
# 美元符号: \$
# 命令替换示例: \$(ls -l)
# 反引号示例: \`pwd\`

# 另一行普通文本
EOF
```

# 解析 `cat << EOF > your_file.txt` 语法

## Shell 的解析顺序

当你输入一个像 `cat << EOF > your_file.txt` 这样的命令时，shell（例如 Bash）会按照特定的顺序来解析和设置命令：

1. **解析重定向：** Shell 会首先扫描命令行，识别所有的重定向操作符（如 `>`, `>>`, `<`, `<<`）。
    - 它会看到 `> your_file.txt`。这告诉 shell，接下来要执行的命令的标准输出应该被重定向到 `your_file.txt` 这个文件。
    - 它还会看到 `<< EOF`。这告诉 shell，接下来要执行的命令的标准输入将来自一个 "here document"，这个 "here document" 的内容将从==**下一行**==开始，直到遇到 `EOF` 这个定界符为止。
2. **设置命令的 I/O：** 在实际执行 `cat` 命令之前，shell 会根据第一步中解析到的重定向信息，设置好 `cat` 命令的**标准输入**和**标准输出**。
    - `cat` 的标准输入被设置为 here document 的内容。
    - `cat` 的标准输出被设置为 `your_file.txt` 文件。
3. **执行命令：** 只有在所有重定向都设置完毕后，shell 才会启动 `cat` 这个程序。
    - 此时，`cat` 程序运行起来时，它并不知道 `> your_file.txt` 或 `<< EOF` 这些语法。
    - `cat` 只是一个简单的工具，它的任务是从它的**标准输入**读取数据，然后将这些数据写入到它的**标准输出**。
    - 因为它知道它的标准输入现在就是 here document 的内容，所以它会读取你提供的多行文本。
    - 因为它知道它的标准输出现在已经被重定向到了 `your_file.txt` 文件，所以它会把读取到的内容直接写入那个文件，而不是打印到屏幕上。