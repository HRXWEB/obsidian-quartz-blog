# convert_links.py

用于将 Obsidian 的链接转换为 CDN 链接，通过 pre-commit 自动执行，请勿手动执行。


# push_all_submodules.sh

用于将所有子模块推送到 github 仓库，通过 pre-commit 自动执行，请勿手动执行。

# validate-mermaid.js

用于验证 Mermaid 图表的语法，手动执行，举例：

```bash
node scripts/validate-mermaid.js content/learn/Infra/ggml-source-code-brief.md
```

运行之后通过 `rm -rf mermaid*.mmd` 删除临时文件。