---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```bash
#!/bin/bash

# 默认值
MAX_RETRIES=3
RETRY_INTERVAL=60

# 函数：打印用法
print_usage() {
    echo "Usage: $0 --cmd \"<command>\" [--retry <number>] [--interval <seconds>]"
    echo "Options:"
    echo "  --cmd      必选，要执行的命令"
    echo "  --retry    可选，最大重试次数，默认为$MAX_RETRIES"
    echo "  --interval 可选，重试间隔时间（秒），默认为$RETRY_INTERVAL"
}

# 解析命令行参数
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --cmd) CMD="$2"; shift ;;
        --retry) MAX_RETRIES="$2"; shift ;;
        --interval) RETRY_INTERVAL="$2"; shift ;;
        -h) print_usage; exit 0 ;;
        *) echo "未知参数: $1"; print_usage; exit 1 ;;
    esac
    shift
done

# 检查CMD是否为空
if [ -z "$CMD" ]; then
    echo "错误：必须指定--cmd参数。"
    print_usage
    exit 1
fi

retry_command() {
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        echo "正在执行命令: $CMD (尝试次数: $((retries + 1)))"

        # 执行命令并在后台运行，保存其 PID
        ($CMD) &
        CMD_PID=$!

        # 命令已经结束，获取退出状态码
        wait $CMD_PID
        local status=$?

        if [ $status -eq 0 ]; then
            echo "命令成功执行。"
            break
        else
            echo "命令执行失败，退出状态码: $status"
            retries=$((retries + 1))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo -e "将在$RETRY_INTERVAL秒后再次尝试..."
                sleep $RETRY_INTERVAL  # 等待一段时间再重试，避免过于频繁的重试
            else
                echo "达到最大重试次数，停止重试。"
            fi
        fi
    done

    if [ $retries -eq $MAX_RETRIES ]; then
        echo "所有重试均失败，请检查命令或环境设置。"
        exit 1  # 如果所有重试都失败了，以非零状态退出
    fi
}

retry_command
```