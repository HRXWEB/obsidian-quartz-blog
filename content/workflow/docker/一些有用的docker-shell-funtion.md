---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# docker_utils.sh

```Shell
# 为 run_docker 命令提供补全的函数
_run_docker_completion() {
    # 这一行是关键！它会标准化 COMP_WORDS, COMP_CWORD, cur, prev 等变量
    _init_completion || return
    
    # --- 调试信息 START ---
    # printf "DEBUG: COMP_WORDBREAKS: %q\n" "${COMP_WORDBREAKS}"
    # --- 调试信息 END ---

    # --- 核心修改在这里 ---
    # 临时修改 COMP_WORDBREAKS，移除冒号和其他你可能不希望作为分隔符的字符
    # 备份原始的 COMP_WORDBREAKS
    local OLD_COMP_WORDBREAKS="$COMP_WORDBREAKS"
    # 移除冒号。你也可以考虑移除斜杠 '/'，如果你的镜像名中经常包含路径
    # 默认值通常是 ' 	`@$>-=<|:' (空格、Tab、换行、`@`、`$`、`>`、`-`、`=`、`<`、`|`、`:`）
    # 这里我们只移除冒号，保持其他默认行为
    COMP_WORDBREAKS=${COMP_WORDBREAKS//:} # 移除冒号
    COMP_WORDBREAKS=${COMP_WORDBREAKS//\//} # 如果需要也移除斜杠
    # --- 核心修改结束 ---

    # 再次调用 _init_completion 来重新解析命令行，确保新设置的 COMP_WORDBREAKS 生效
    # 注意：这里需要再次调用，因为它会根据 COMP_WORDBREAKS 重新解析 COMP_WORDS
    _init_completion || return


    # --- 调试信息 START ---
    # echo "DEBUG: COMP_WORDS AFTER MODIFICATION: ${COMP_WORDS[@]}" >&2
    # echo "DEBUG: COMP_CWORD AFTER MODIFICATION: ${COMP_CWORD}" >&2
    # echo "DEBUG: cur AFTER MODIFICATION: ${cur}" >&2
    # --- 调试信息 END ---


    local docker_images

    docker_images=$(docker images --format "{{.Repository}}:{{.Tag}}" --filter "dangling=false" 2>/dev/null | grep -v "<none>:<none>" | grep -v "<none>")

    # 补全逻辑只在第一个参数位置（镜像名称）生效
    # 经过 COMP_WORDBREAKS 修改和第二次 _init_completion，
    # 此时 COMP_CWORD 应该正确地变为 1，cur 应该为 "ubuntu:2"
    if [[ ${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( $(compgen -W "${docker_images}" -- "${cur}") )
        
        # --- 调试信息 START ---
        # echo "DEBUG: COMPREPLY after compgen: ${COMPREPLY[@]}" >&2
        # --- 调试信息 END ---
        
        return 0
    fi

    # 无论如何，在函数结束前恢复 COMP_WORDBREAKS
    # 否则会影响其他命令的补全
    COMP_WORDBREAKS="$OLD_COMP_WORDBREAKS"
}

# 注册补全函数到 run_docker 命令
# -F 指定补全函数
# run_docker 是要补全的命令
complete -F _run_docker_completion run_docker
function run_docker() {
    # 1. 检查是否提供了 Docker 镜像名称
    if [ -z "$1" ]; then
        echo -e "\e[31m错误: 请提供 Docker 镜像名称。\e[0m" # 红色错误提示
        echo -e "示例: run_docker nvcr.io/nvidia/pytorch:23.07-py3"
        echo -e "      run_docker your_image:tag -v \$PWD:/workspace -e HTTP_PROXY=\$HTTP_PROXY"
        return 1 # 返回非零状态码表示失败
    fi

    local IMAGE_NAME="$1"
    shift # 移除第一个参数（镜像名称），剩下的就是额外的 docker run 参数

    local DOCKER_NAME="$(whoami)_$(shuf -i 10000-99999 -n 1)"
    echo -e "\e[32m正在创建 Docker 容器，名称为: \e[1m$DOCKER_NAME\e[0m" # 绿色提示

    # 构建完整的 docker run 命令
    # 使用数组来构建命令，以更好地处理包含空格的参数
    local DOCKER_RUN_CMD=(
        docker run
        -itd
        -u "$(id -u)" # 以当前宿主机的用户ID运行
        --name "$DOCKER_NAME"
        --ipc=host
        --privileged
        --net=host
        -v /dev/bus/usb:/dev/bus/usb
        --ulimit memlock=-1
        --ulimit stack=67108864
        # 使用更简洁的 -v 绑定挂载，目标路径可以根据需要调整
        -v "/perception/users/username:/perception/users/username"
    )
    
    # 检查 nvidia-smi 命令是否存在且能正常运行
    if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
        echo -e "\e[34m检测到 GPU 支持，自动启用 --gpus all。\e[0m" # 蓝色提示
        DOCKER_RUN_CMD+=(--gpus all)
    else
        echo -e "\e[33m未检测到 GPU 支持，跳过 --gpus 参数。\e[0m" # 黄色提示
    fi

    # 添加额外传入的 docker run 参数
    # $@ 会将所有剩余的参数（即用户提供的额外参数）展开
    DOCKER_RUN_CMD+=("$@")

    # 添加镜像名称和启动命令
    DOCKER_RUN_CMD+=("$IMAGE_NAME")
    DOCKER_RUN_CMD+=(bash) # 默认启动 bash shell

    # 打印最终执行的 docker run 命令
    echo -e "\e[33m即将执行的 Docker 命令: \e[0m"
    printf "%q " "${DOCKER_RUN_CMD[@]}" # 使用 %q 确保参数中的特殊字符被正确引用
    echo ""

    # 执行 docker run 命令
    # 使用 eval 或直接执行数组 (Bash 4+): "${DOCKER_RUN_CMD[@]}"
    # 考虑到参数可能包含引号和空格，直接执行数组是最安全的。
    # 如果系统是旧版 Bash 或 sh，可能需要 eval "$(printf "%q " "${DOCKER_RUN_CMD[@]}")"
    "${DOCKER_RUN_CMD[@]}"

    local RUN_STATUS=$? # 获取 docker run 的退出状态码

    if [ $RUN_STATUS -ne 0 ]; then
        echo -e "\e[31m错误: Docker 容器启动失败。请检查上述命令和错误信息。\e[0m"
        return 1
    fi

    # 延时等待容器完全启动，避免 docker exec 因容器未就绪而失败
    sleep 3

    echo -e "\e[32m尝试进入容器 \e[1m$DOCKER_NAME\e[0m ..."
    docker exec -it -u root "$DOCKER_NAME" /bin/bash # 以 root 用户进入容器，可以根据需求改为非 root
}

function _dexec_interactive() {
    # 检查 fzf 命令是否存在
    if ! command -v fzf &> /dev/null; then
        echo -e "\e[31mError: Command 'fzf' not found. Please install it.\e[0m" >&2
        return 1
    fi

    # 定义 docker ps 命令
    local docker_list_cmd='docker ps --all --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.RunningFor}}\t{{.Ports}}" 2>/dev/null | tail -n +2'
    local FZF_HEADER=$'Select a container to enter, then press Enter.\n'

    # 使用 FZF 进行选择。
    # *** 关键修正：移除了末尾的 < /dev/tty ***
    local selected_container
    selected_container=$(eval "$docker_list_cmd" | fzf --height 40% --layout=reverse --header="$FZF_HEADER" | awk '{print $1}')

    # 检查用户是否作出了选择
    if [[ -n "$selected_container" ]]; then
        echo -e "\e[32mAttempting to enter container '\e[1m$selected_container\e[0m'...\e[0m"
        docker exec -it -u root "$selected_container" bash
    else
        echo "No container selected."
    fi
}

# 设置别名，让输入 dexec 命令直接触发我们的交互函数
alias dexec='_dexec_interactive'

# ==============================================================================
#           INTERACTIVE DOCKER MANAGEMENT FUNCTIONS WITH FZF
# ==============================================================================

#
# --- dstoprm: Interactively stop and remove multiple Docker containers ---
#
function dstoprm() {
    # 检查 fzf
    if ! command -v fzf &> /dev/null; then
        echo -e "\e[31mError: 'fzf' not found. Please install it.\e[0m" >&2
        return 1
    fi

    # 获取所有容器的ID，--all 显示包括已停止的容器
    # 使用 awk 提取第一列的容器ID
    local selected_ids
    selected_ids=$(docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}" | tail -n +2 | \
        fzf --height 50% --layout=reverse \
            --header "Select containers to STOP and REMOVE. Use Tab to multi-select." \
            --multi | awk '{print $1}') # --multi 开启多选功能

    # 如果用户没有选择任何东西就退出了 (比如按 ESC)
    if [[ -z "$selected_ids" ]]; then
        echo "No containers selected."
        return 0
    fi

    # 显示将要被删除的容器ID，并请求用户最终确认
    echo -e "\n\e[1;33mYou are about to STOP and REMOVE the following containers:\e[0m"
    # 使用 xargs -n 1 来确保每个ID占一行，更清晰
    echo "$selected_ids" | xargs -n 1 echo "  -"
    
    # 使用 read 命令进行交互式确认
    read -p "Are you sure? [y/N] " -n 1 -r
    echo # 换行

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Proceeding with deletion..."
        # 使用 xargs 将换行分隔的ID列表传递给 docker rm -f
        # docker stop $(...) || true: 先尝试停止，即使失败也继续执行删除
        # docker rm -f $(...): 强制删除
        echo "$selected_ids" | xargs --no-run-if-empty docker stop || true
        echo "$selected_ids" | xargs --no-run-if-empty docker rm -f
        echo -e "\e[32mSelected containers have been removed.\e[0m"
    else
        echo "Operation cancelled."
    fi
}


#
# --- drmi: Interactively remove multiple Docker images ---
#
function drmi() {
    # 检查 fzf
    if ! command -v fzf &> /dev/null; then
        echo -e "\e[31mError: 'fzf' not found. Please install it.\e[0m" >&2
        return 1
    fi

    # 获取所有镜像的ID
    local selected_ids
    selected_ids=$(docker images --format "table {{.ID}}\t{{.Repository}}\t{{.Tag}}\t{{.Size}}" | tail -n +2 | \
        fzf --height 50% --layout=reverse \
            --header "Select images to REMOVE. Use Tab to multi-select." \
            --multi | awk '{print $1}')

    if [[ -z "$selected_ids" ]]; then
        echo "No images selected."
        return 0
    fi

    echo -e "\n\e[1;33mYou are about to FORCE REMOVE the following images:\e[0m"
    # 为了更清晰，我们显示完整的镜像信息而不仅仅是ID
    docker images --filter "id=${selected_ids}" --format "  - {{.Repository}}:{{.Tag}} ({{.ID}})"

    read -p "Are you sure? [y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Proceeding with deletion..."
        # 使用 xargs 将ID列表传递给 docker rmi -f
        echo "$selected_ids" | xargs --no-run-if-empty docker rmi -f
        echo -e "\e[32mSelected images have been removed.\e[0m"
    else
        echo "Operation cancelled."
    fi
}
```