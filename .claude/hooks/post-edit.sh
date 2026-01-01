#!/bin/bash
# AI Skills Workbench - 编辑后检查钩子
# 在文件编辑后自动执行验证

# 获取被编辑的文件
EDITED_FILE="$1"

if [ -z "$EDITED_FILE" ]; then
  echo "用法: post-edit.sh <文件路径>"
  exit 1
fi

echo "📋 检查编辑后的文件: $EDITED_FILE"

# 根据文件类型执行不同检查
case "$EDITED_FILE" in
  *.ts|*.tsx)
    echo "🔍 TypeScript 语法检查..."
    npx tsc --noEmit "$EDITED_FILE" 2>&1 || true
    ;;
  *.json)
    echo "🔍 JSON 格式验证..."
    node -e "JSON.parse(require('fs').readFileSync('$EDITED_FILE'))" 2>&1 || echo "⚠️ JSON 格式错误"
    ;;
  *.md)
    echo "📝 Markdown 文件已更新"
    ;;
esac

# 检查文件中的 TODO 注释
if grep -n "TODO\|FIXME\|HACK" "$EDITED_FILE" 2>/dev/null; then
  echo "📌 发现待办注释，请记得处理"
fi

echo "✅ 编辑后检查完成"
