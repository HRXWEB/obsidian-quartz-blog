---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

> NetworkManager 是一个**为系统提供检测和配置功能以便自动连接到网络的程序**，最初由 Red Hat 开发，现在由 GNOME 管理。

# 安装

```bash
sudo apt update
sudo apt install network-manager -y
```

此软件包包含一个守护程序、一个命令行界面（nmcli）和一个基于 curses 的界面（nmtui）。

# 使用方法

## ✅nmtui

> [!info] 首先推荐使用 nmtui 可以使用 “UI” 界面来控制连接

如果找不到相应的 Wi-Fi 信号，需要先通过 `nmcli` 命令来重新扫描一次 Wi-Fi 信号。

```bash
nmcli device wifi rescan
```

## ⚠️nmcli

- 显示附近的 Wi-Fi 网络（rescan 强制重新刷新一次）
    
    ```bash
    nmcli device wifi list [--rescan yes]
    ```
    
- 连接到 Wi-Fi 网络
    
    ```bash
    nmcli device wifi connect <SSID_or_BSSID> password <password>
    ```
    
- 显示连接列表及其名称、UUID、类型和支持设备
    
    ```bash
    nmcli connection show
    ```

# 使用 nmcli 连接 Wi-Fi 的脚本

```bash
#!/usr/bin/env bash

# --- 脚本开始时，先进行 sudo 授权 ---
printf "此脚本需要管理员权限来管理网络连接。\n"
# sudo -v 会提示输入密码（如果需要），并更新 sudo 的授权时间戳。
# 后续的 sudo 命令在几分钟内将不再需要密码。
sudo -v

# 检查上一个命令（sudo -v）是否成功，如果不成功（用户取消或输错密码），则退出。
if [ $? -ne 0 ]; then
    echo "获取 sudo 权限失败，脚本已退出。"
    exit 1
fi

# 主命令：通过管道将nmcli、fzf、sed、awk串联起来，获取用户选择的Wi-Fi网络的BSSID
ssid=$(nmcli -f 'bssid,in-use,signal,bars,freq,rate,security,ssid' \
    --color yes device wifi list --rescan yes \
    | fzf --ansi \
          --reverse \
          --cycle \
          --header-lines=1 \
          --margin='1,2,1,2' \
          --color='16,gutter:-1' \
    | sed 's/^ *\*//' \
    | awk '{print $1}')

# （您可以删除或保留下面的 debug 行）
# printf "Debug Raw: [%s]\n" "$ssid"
# printf "Debug Quoted: %q\n" "$ssid"

# 如果用户在fzf中按下了ESC键，则ssid为空，直接退出脚本
if [[ -z "$ssid" ]]; then
    echo "操作已取消。"
    exit 0
fi

# 1. 执行连接命令，并将标准输出(stdout)和标准错误(stderr)都捕获到 'output' 变量中。
#    '2>&1' 的意思是将 stderr 重定向到 stdout，这样我们就能捕获所有信息。
output=$(sudo nmcli device wifi connect "$ssid" 2>&1)

# 2. 使用 'case' 语句或 'grep' 检查 'output' 变量的内容。
#    我们检查输出中是否包含 "Secrets were required" 这个关键信息。
#    'case' 语句在这里比 'if grep' 更高效、更简洁。
case "$output" in
  *"Secrets were required"*)
    echo "连接需要验证，请根据提示操作..."
    # 如果确实需要密码，我们才执行带有 '-a' 的交互式连接命令。
    sudo nmcli -a device wifi connect "$ssid"
    ;;
  *"successfully activated"*)
    # 如果输出包含成功信息，就打印出来。
    echo "连接成功！"
    ;;
  *)
    # 处理其他未预料到的错误。
    echo "发生未知错误："
    echo "$output"
    ;;
esac
# -------------------------

# 暂停脚本，等待用户按键后退出
printf "按任意键关闭。\n" && read -n1
```

## **脚本功能简介**

这是一个高效的命令行工具，它将 Linux 的网络管理工具 `nmcli` 和强大的模糊搜索工具 `fzf` 完美结合，提供了一个彩色的、可交互的菜单来扫描、选择并连接到 Wi-Fi 网络。

它解决了 `nmcli` 原生操作相对繁琐的问题，让用户无需手动输入长串的 Wi-Fi 名称或 BSSID，通过流畅的模糊搜索和按键选择即可完成网络连接。

## **工作流程分解**

脚本的执行过程如同一条精密的流水线，上一个命令的输出成为下一个命令的输入：

1. **扫描与着色 (**`**nmcli**`**)**:
    - `nmcli --color yes ... list` 命令首先会重新扫描并列出所有可用的 Wi-Fi 网络。
    - 通过 `-color yes`，输出的列表是彩色的，信息（如信号强度条）更直观。
    - 使用 `f` 选项精确指定要显示的列：BSSID、SSID、信号强度、频率等。
2. **交互式模糊搜索 (**`**fzf**`**)**:
    - `fzf` 接收来自 `nmcli` 的彩色列表，并通过 `-ansi` 选项正确地将其渲染成一个交互式菜单。
    - 用户可以在这个菜单中：
        - 使用上下箭头进行选择。
        - 直接输入任何字符（如 Wi-Fi 名称的一部分）来进行实时模糊过滤。
    - 用户按回车键确认选择。
3. **提取标识符 (**`**sed**` **&** `**awk**`**)**:
    - 用户选中的那一行信息会进入下一个处理环节。
    - `sed 's/^ *\*//'`：一个清理步骤，如果选中的是当前已连接的网络，此命令会移除行首的  标记。
    - `awk '{print $1}'`：核心提取步骤。`awk` 会抓取选中行的**第一个字段**，根据 `nmcli` 的输出格式，这正是该 Wi-Fi 独一无二的物理地址 **BSSID**。使用 BSSID 进行连接比使用 SSID 名称更精确，可以避免重名问题。
4. **智能连接 (**`**nmcli connect**`**)**:
    - 这是脚本最智能的部分，它实现了两步式连接策略：
        - **首次尝试 (静默连接)**: 脚本首先会尝试无提示连接。如果网络是开放的，或者系统已经保存了密码，连接会瞬间完成，不会有任何干扰。
        - **二次尝试 (密码提示)**: 如果首次连接失败（最常见的原因是需要输入密码），脚本会判断错误类型，如果是需要密码引发的错误，会执行第二次连接。这次它会加上 `a` (`-ask`) 参数，`nmcli` 就会明确地弹出提示，让用户输入密码。
5. **暂停确认 (**`**read**`**)**:
    - 连接过程结束后，脚本会暂停并等待用户按任意键退出，确保用户能清楚地看到连接成功或失败的结果，而不是让终端窗口一闪而过。

# 参考

1. [https://www.reddit.com/r/commandline/comments/x79nn3/looking_for_a_nmtui_that_would_be_able_to/](https://www.reddit.com/r/commandline/comments/x79nn3/looking_for_a_nmtui_that_would_be_able_to/)
2. [https://blog.csdn.net/Mculover666/article/details/126267263](https://blog.csdn.net/Mculover666/article/details/126267263)