#!/bin/bash
# AI Skills Workbench - 提交前检查钩子
# 在代码提交前自动执行检查

set -e

echo "🔍 运行提交前检查..."

# 1. TypeScript 类型检查
echo "📝 检查 TypeScript 类型..."
npx tsc --noEmit

# 2. 检查是否有 console.log/error 遗留
echo "🔎 检查 console 语句..."
if grep -r "console\.\(log\|error\|warn\)" --include="*.ts" --include="*.tsx" lib/ app/ components/ 2>/dev/null | grep -v "logger.ts" | grep -v ".test."; then
  echo "⚠️  警告: 发现 console 语句，请使用 logger 替代"
  # 这里只警告不阻止，可以根据需要改为 exit 1
fi

# 3. 检查敏感信息
echo "🔐 检查敏感信息..."
SENSITIVE_PATTERNS="SUPABASE_SERVICE_ROLE_KEY|sk-|api_key.*=.*['\"]"
if grep -rE "$SENSITIVE_PATTERNS" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v ".env" | grep -v "node_modules"; then
  echo "❌ 错误: 发现可能的敏感信息硬编码"
  exit 1
fi

# 4. 构建检查
echo "🏗️  验证构建..."
npm run build --quiet

echo "✅ 所有检查通过！"
