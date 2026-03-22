#!/bin/bash
#
# Pre-commit hook: Upload Excalidraw SVG files to obsidian-images GitHub repo
# SVGs are uploaded to the excalidraw/ directory in the repo
#

set -e

# --- Config ---
GITHUB_USER="hrxweb"
IMAGES_REPO="obsidian-images"
UPLOAD_DIR="excalidraw"
# --- End Config ---

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# GitHub token from environment or gh CLI
GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || echo "")}"
if [[ -z "$GITHUB_TOKEN" ]]; then
    echo "WARNING: No GitHub token found. Skipping SVG upload."
    echo "  Set GITHUB_TOKEN env var or authenticate with 'gh auth login'"
    exit 0
fi

API_BASE="https://api.github.com/repos/${GITHUB_USER}/${IMAGES_REPO}/contents/${UPLOAD_DIR}"

# Find all SVG files that have a matching .excalidraw source file (i.e., auto-exported SVGs)
# Supports both .excalidraw (legacy) and .excalidraw.md (default) formats
uploaded=0
skipped=0

# Collect excalidraw source files (both formats)
{
    find "$PROJECT_ROOT/content" -name "*.excalidraw" -type f 2>/dev/null
    find "$PROJECT_ROOT/content" -name "*.excalidraw.md" -type f 2>/dev/null
} | while read -r excalidraw_file; do
    # Derive SVG path: Obsidian autoexport strips only .md and appends .svg
    # e.g. xxx.excalidraw.md → xxx.excalidraw.svg, xxx.excalidraw → xxx.svg
    if [[ "$excalidraw_file" == *.excalidraw.md ]]; then
        svg_file="${excalidraw_file%.md}.svg"
    else
        svg_file="${excalidraw_file%.excalidraw}.svg"
    fi

    if [[ ! -f "$svg_file" ]]; then
        continue
    fi

    svg_basename="$(basename "$svg_file")"
    remote_path="${UPLOAD_DIR}/${svg_basename}"

    # Base64 encode the SVG content
    svg_content_b64=$(base64 < "$svg_file")

    # Check if file already exists on remote (to get its SHA for update)
    existing_sha=""
    response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${GITHUB_USER}/${IMAGES_REPO}/contents/${remote_path}" 2>/dev/null)

    if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null | grep -q '^[a-f0-9]'; then
        existing_sha=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))")
    fi

    # Build the request body
    if [[ -n "$existing_sha" ]]; then
        request_body=$(python3 -c "
import json, sys
print(json.dumps({
    'message': 'chore: update excalidraw SVG ${svg_basename}',
    'content': '''${svg_content_b64}''',
    'sha': '${existing_sha}'
}))
")
    else
        request_body=$(python3 -c "
import json
print(json.dumps({
    'message': 'chore: add excalidraw SVG ${svg_basename}',
    'content': '''${svg_content_b64}'''
}))
")
    fi

    # Upload/update via GitHub API
    upload_response=$(curl -s -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "${API_BASE}/${svg_basename}" \
        -d "$request_body" 2>/dev/null)

    if echo "$upload_response" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'content' in d" 2>/dev/null; then
        echo "  Uploaded: ${svg_basename}"
        uploaded=$((uploaded + 1))
    else
        echo "  ERROR uploading ${svg_basename}"
        echo "$upload_response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','unknown error'))" 2>/dev/null || true
    fi
done

echo "Excalidraw SVG upload complete."
