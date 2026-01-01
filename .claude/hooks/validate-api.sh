#!/bin/bash
# AI Skills Workbench - API 响应格式验证钩子
# 确保 API 响应符合统一格式

set -e

echo "🔍 验证 API 响应格式..."

# 检查 API 文件是否使用统一响应格式
API_DIR="app/api"

# 检查是否有不符合规范的响应
NON_STANDARD=0

for file in $(find "$API_DIR" -name "*.ts" -type f); do
  # 检查是否有不带 success 字段的 NextResponse.json
  if grep -l "NextResponse.json" "$file" >/dev/null 2>&1; then
    # 检查是否使用了 withErrorHandler
    if ! grep -q "withErrorHandler" "$file"; then
      echo "⚠️  $file 未使用 withErrorHandler"
      NON_STANDARD=1
    fi
  fi
done

if [ $NON_STANDARD -eq 1 ]; then
  echo ""
  echo "💡 提示: API 路由应使用 withErrorHandler 包装"
  echo "   示例: export const POST = withErrorHandler(async (req) => { ... })"
fi

echo "✅ API 格式检查完成"
