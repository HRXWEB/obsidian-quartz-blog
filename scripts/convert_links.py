import sys
import re
import urllib.parse

# --- 配置区 ---
# 修改为你的 GitHub 用户名和附件仓库名
GITHUB_USER = "hrxweb"
ASSETS_REPO = "obsidian-assets"
# 附件仓库的默认分支，通常是 main 或 master
ASSETS_BRANCH = "main" 
# --- 配置区结束 ---

# 构建 CDN 链接的前缀
CDN_BASE_URL = f"https://cdn.jsdelivr.net/gh/{GITHUB_USER}/{ASSETS_REPO}@{ASSETS_BRANCH}/assets/"

# 正则表达式，匹配 Obsidian 附件链接： `![[filename.ext]]`
FILELINK_RE = re.compile(r"!\[\[([^\]]+?)\]\]")

def convert_link(match):
    """根据正则匹配结果，生成新的 Markdown 链接"""
    filename = match.group(1).strip()
    # Skip .excalidraw files - handled by Quartz Excalidraw transformer at build time
    if filename.endswith('.excalidraw'):
        return match.group(0)  # return original unchanged
    # 对文件名进行 URL 编码，防止文件名中有空格等特殊字符
    encoded_filename = urllib.parse.quote(filename)
    url = f"{CDN_BASE_URL}{encoded_filename}"
    # 统一转换为标准的 Markdown 链接 [filename](url)
    return f"[{filename}]({url})"

def process_file(filepath):
    """读取文件，替换链接（跳过代码块），然后写回文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split by fenced code blocks (``` or ~~~), only replace in non-code parts
        parts = re.split(r'(^```.*?^```|^~~~.*?^~~~)', content, flags=re.MULTILINE | re.DOTALL)
        count = 0
        for i in range(len(parts)):
            # Even-indexed parts are outside code blocks
            if i % 2 == 0:
                parts[i], n = FILELINK_RE.subn(convert_link, parts[i])
                count += n
        new_content = ''.join(parts)

        if count > 0:
            print(f"Processed '{filepath}': Found and converted {count} links.")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
    except Exception as e:
        print(f"Error processing file {filepath}: {e}")

if __name__ == "__main__":
    # 从命令行参数获取所有待处理的文件
    staged_files = sys.argv[1:]
    for file in staged_files:
        # 只处理 markdown 文件
        if file.endswith('.md'):
            process_file(file)