# AI Skills Workbench - 项目宪法

> 本文件定义项目不可违背的核心原则，优先级高于所有其他配置

## 架构铁律

### 1. 简单性优先
- **能用现有方案就不引入新依赖**
- 代码可读性优先于性能优化
- 避免过度抽象，保持代码直观

### 2. 测试先行
- 新功能必须有对应测试
- Bug 修复先写失败测试，再修复
- API 变更需更新相关测试

### 3. 类型安全
- 禁止使用 `any` 类型（除非有充分理由并注释说明）
- 所有 API 响应必须有明确类型定义
- 数据库操作返回值必须类型检查

## 代码规范

### 错误处理
```typescript
// 正确：使用统一的 logger 系统
logger.db.error('操作失败', error)
logger.api.error('请求失败', { status, message })

// 禁止：直接使用 console
console.log()   // ❌
console.error() // ❌
```

### 数据库查询
```typescript
// 正确：明确指定需要的字段
.select('id, name, created_at')

// 禁止：使用 SELECT *
.select('*')  // ❌ 除非确实需要所有字段
```

### API 响应
```typescript
// 正确：使用统一的响应格式
return NextResponse.json({ success: true, data })
return NextResponse.json({ success: false, error: message }, { status: 400 })

// 禁止：不一致的响应结构
return NextResponse.json(data)  // ❌ 缺少 success 字段
```

## 安全红线

### 绝对禁止
- 在代码中硬编码任何密钥或敏感信息
- 禁用 TypeScript 类型检查
- 跳过必要的权限验证
- 在生产环境暴露调试信息

### 环境变量
```bash
# 必须使用环境变量的配置
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UNIFIED_API_KEY
SILICONFLOW_API_KEY
ADMIN_TOKEN
```

## 文件组织

### 目录结构约定
```
app/
├── api/           # API 路由，使用 withErrorHandler 包装
├── (main)/        # 主布局页面
└── components/    # 页面级组件

lib/
├── ai/            # AI 客户端和配置
├── db/            # 数据库操作层
└── utils/         # 工具函数

components/
├── ui/            # 基础 UI 组件
└── features/      # 业务功能组件
```

### 命名规范
- 组件文件：PascalCase（如 `ChatPanel.tsx`）
- 工具函数：camelCase（如 `formatDate.ts`）
- 类型文件：kebab-case（如 `api-types.ts`）
- 常量：SCREAMING_SNAKE_CASE

## 依赖管理

### 核心依赖（锁定版本）
- Next.js 14.x
- React 18.x
- Supabase JS 2.x
- Tailwind CSS 3.x

### 禁止引入
- jQuery 或类似 DOM 操作库
- 全局状态管理库（使用 React Context 或 URL 状态）
- CSS-in-JS 库（使用 Tailwind）

## 变更流程

### 重大变更需要
1. 更新 spec.md 说明变更内容
2. 更新相关测试
3. 更新 README.md 文档
4. 必要时更新本宪法

### 本宪法修改
- 需要明确说明修改原因
- 记录修改日期和内容
- 不可删除安全相关条款

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-01-01 | 初始版本 |

