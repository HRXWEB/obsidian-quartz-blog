#!/bin/bash
#
# Pre-commit hook: auto-commit and push ALL submodules before main repo commit.
# Ensures Cloudflare Pages (or any CI) can resolve submodule references.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT" || exit 1

# Backup git env vars set by pre-commit framework
ORIGINAL_GIT_DIR="${GIT_DIR:-}"
ORIGINAL_GIT_WORK_TREE="${GIT_WORK_TREE:-}"
ORIGINAL_GIT_INDEX_FILE="${GIT_INDEX_FILE:-}"

restore_git_env() {
    if [[ -n "$ORIGINAL_GIT_DIR" ]]; then
        export GIT_DIR="$ORIGINAL_GIT_DIR"
    else
        unset GIT_DIR 2>/dev/null || true
    fi
    if [[ -n "$ORIGINAL_GIT_WORK_TREE" ]]; then
        export GIT_WORK_TREE="$ORIGINAL_GIT_WORK_TREE"
    else
        unset GIT_WORK_TREE 2>/dev/null || true
    fi
    if [[ -n "$ORIGINAL_GIT_INDEX_FILE" ]]; then
        export GIT_INDEX_FILE="$ORIGINAL_GIT_INDEX_FILE"
    else
        unset GIT_INDEX_FILE 2>/dev/null || true
    fi
}

trap restore_git_env EXIT

# Iterate over all registered submodules
git submodule foreach --quiet 'echo "$sm_path"' | while read -r sm_path; do
    if [[ ! -e "$PROJECT_ROOT/$sm_path/.git" ]]; then
        echo "  SKIP: $sm_path (not initialized)"
        continue
    fi

    # Clear parent repo git env so commands run inside the submodule
    unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE 2>/dev/null || true

    cd "$PROJECT_ROOT/$sm_path"

    STATUS_OUTPUT=$(git status --porcelain 2>&1)
    if [[ -n "$STATUS_OUTPUT" ]]; then
        echo "  Submodule '$sm_path' has changes, committing and pushing..."
        git add .
        git commit -m "chore: update $(basename "$sm_path")"
        git push origin HEAD
    else
        # Even without local changes, ensure current HEAD is on remote
        LOCAL_HEAD=$(git rev-parse HEAD)
        REMOTE_HEAD=$(git ls-remote origin HEAD 2>/dev/null | awk '{print $1}')
        if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
            echo "  Submodule '$sm_path' has unpushed commits, pushing..."
            git push origin HEAD
        fi
    fi

    # Restore env and return to project root
    restore_git_env
    cd "$PROJECT_ROOT"
done

echo "All submodules synced."
