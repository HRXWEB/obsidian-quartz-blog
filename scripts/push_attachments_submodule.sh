#!/bin/bash

# 保存当前目录
ORIGINAL_DIR="$(pwd)"

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 计算项目根目录（脚本在 scripts/ 目录下）
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 确保我们在项目根目录
cd "$PROJECT_ROOT" || {
    echo "ERROR: Failed to change to project root: $PROJECT_ROOT"
    exit 1
}

# 使用相对路径
SUBMODULE_DIR="content/attachments.nosync"

# 检查子模块目录是否存在
if [[ ! -d "$SUBMODULE_DIR" ]]; then
    echo "ERROR: Submodule directory does not exist: $SUBMODULE_DIR"
    exit 1
fi

# 检查是否为 Git 仓库（子模块的 .git 可能是文件而不是目录）
if [[ ! -e "$SUBMODULE_DIR/.git" ]]; then
    echo "ERROR: Not a Git repository: $SUBMODULE_DIR"
    exit 1
fi

# 切换到子模块目录
cd "$SUBMODULE_DIR" || {
    echo "ERROR: Failed to change to directory: $SUBMODULE_DIR"
    exit 1
}

# 备份原始环境变量
ORIGINAL_GIT_DIR="${GIT_DIR:-}"
ORIGINAL_GIT_WORK_TREE="${GIT_WORK_TREE:-}"
ORIGINAL_GIT_INDEX_FILE="${GIT_INDEX_FILE:-}"

# 定义恢复函数
restore_git_env() {
    if [[ -n "$ORIGINAL_GIT_DIR" ]]; then
        export GIT_DIR="$ORIGINAL_GIT_DIR"
    else
        unset GIT_DIR
    fi

    if [[ -n "$ORIGINAL_GIT_WORK_TREE" ]]; then
        export GIT_WORK_TREE="$ORIGINAL_GIT_WORK_TREE"
    else
        unset GIT_WORK_TREE
    fi

    if [[ -n "$ORIGINAL_GIT_INDEX_FILE" ]]; then
        export GIT_INDEX_FILE="$ORIGINAL_GIT_INDEX_FILE"
    else
        unset GIT_INDEX_FILE
    fi
}

# 设置 trap 确保异常退出时也能恢复环境变量
trap restore_git_env EXIT

# 清理可能影响 Git 的环境变量
unset GIT_DIR
unset GIT_WORK_TREE
unset GIT_INDEX_FILE

# 尝试修复可能损坏的 Git 环境
export GIT_DIR="$(pwd)/.git"
export GIT_WORK_TREE="$(pwd)"

# 检查是否有变化（使用明确的路径参数）
STATUS_OUTPUT=$(git --git-dir=.git --work-tree=. status --porcelain 2>&1)
STATUS_EXIT_CODE=$?

if [[ $STATUS_EXIT_CODE -ne 0 ]]; then
    echo "ERROR: Git status failed: $STATUS_OUTPUT"
    exit 1
fi

if [[ -n "$STATUS_OUTPUT" ]]; then
    echo "Assets submodule has changes, committing and pushing..."
    
    # 添加所有文件
    if ! git --git-dir=.git --work-tree=. add .; then
        echo "ERROR: Failed to add files"
        exit 1
    fi
    
    # 提交
    if ! git --git-dir=.git --work-tree=. commit -m "chore: update assets"; then
        echo "ERROR: Failed to commit"
        exit 1
    fi
    
    # 推送
    if ! git --git-dir=.git --work-tree=. push origin main; then
        echo "ERROR: Failed to push to remote"
        exit 1
    fi
else
    echo "No changes in assets submodule."
fi

# 无论如何都在主仓库 add assets submodule
restore_git_env
(cd "$PROJECT_ROOT" && git add "$SUBMODULE_DIR") || echo "ERROR: Failed to add submodule to main repository"

echo "Assets submodule hook completed successfully."