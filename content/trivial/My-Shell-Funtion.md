---
title: 
draft: 
aliases: []
tags: []
URL: https://github.com/TheR1D/shell_gpt
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 添加到 .bashrc || .zshrc

> [!important] 需要新建 `$HOME/.shell_utils` 目录并将所有想加载的脚本放入其中。

```shellscript
# =======================================================
#  加载自定义 Shell 工具 (Load Custom Shell Utilities)
# =======================================================

# 1. 定义一个函数，用于加载 ~/.shell_utils/ 目录下的所有脚本
#    Define a function to source all scripts in ~/.shell_utils/
source_shell_utils() {
  # 使用 local 关键字确保变量只在函数内部有效，避免污染全局环境
  local utils_dir="$HOME/.shell_utils"
  local util_script

  # 检查工具目录是否存在
  if [ -d "$utils_dir" ]; then
    for util_script in "$utils_dir"/*; do
      # 检查是否为普通、可读的文件，然后 source 它
      if [ -f "$util_script" ] && [ -r "$util_script" ]; then
        source "$util_script"
      fi
    done
  fi
}

# 2. 调用函数以执行加载操作
#    Call the function to perform the loading
source_shell_utils

# 3. (可选但推荐) 卸载函数定义，保持 Shell 环境干净
#    (Optional but recommended) Unset the function definition to keep the shell environment clean
unset -f source_shell_utils
```

[[一些有用的docker-shell-funtion]]

[[Proxy-Shell-Function]]

[[CUDA版本管理cuda_switcher.sh]]

[[use-nmtui-or-nmcli-to-connect-to-wifi]]
