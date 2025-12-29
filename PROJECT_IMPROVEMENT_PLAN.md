# AI Skills Workbench 项目改进计划

## 📊 项目健康评分: 5.4/10 (D+)

基于完整代码遍历,项目有良好的架构基础,但在安全性、可靠性和可维护性方面需要改进。

---

## 🔥 严重问题清单 (需要立即修复)

### 1. 生产密钥泄露 ⚠️ CRITICAL

**问题**: `.env.local` 文件中存在真实的生产 API 密钥
```
UNIFIED_API_KEY=sk-Eq2fXaxlQSAI2l181nBykXXhC7ues2uz0uJZtyPjHzRXOG6G
SILICONFLOW_API_KEY=sk-cuwvvrzvhmcfhevvexwgewdlltlqplsenvrdlkspfxqrjvza
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**风险**:
- API 账户被盗用,产生费用
- 数据库被非法访问
- 若已提交到 Git,历史中永久存在

**修复**:
1. 立即轮换所有密钥
2. 检查 Git 历史是否有密钥泄露
3. 使用密钥管理服务
4. 添加 pre-commit hooks 扫描密钥

**耗时**: 1-2 小时

---

### 2. Console.log 泛滥 (204 条)

**问题**: 整个项目有 204 条 console.log/error 语句

**影响**:
- 生产环境性能下降
- 可能泄露敏感信息
- 难以区分重要日志

**修复**:
```typescript
// 创建 lib/logger.ts
export class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  debug(msg: string, data?: unknown) {
    if (this.isDev) console.log(`[DEBUG] ${msg}`, data)
  }

  error(msg: string, error?: unknown) {
    console.error(`[ERROR] ${msg}`, error)
    if (!this.isDev) {
      // 发送到错误追踪服务
      sendToErrorTracking({ message: msg, error })
    }
  }
}

export const logger = new Logger()
```

**耗时**: 2-3 小时

---

### 3. 错误处理不当

**问题**: 错误被静默吞掉,调试困难

```typescript
// ❌ 当前代码
if (error) {
  console.error('Error saving messages:', error)
  return []  // 静默失败
}

// ✅ 改进后
export class DatabaseError extends Error {
  constructor(operation: string, originalError: any) {
    super(`Database operation failed: ${operation}`)
    this.originalError = originalError
  }
}

async function saveMessage(...) {
  const { data, error } = await supabase...
  if (error) {
    throw new DatabaseError('saveMessage', error)
  }
  return data
}
```

**耗时**: 4-6 小时

---

### 4. 零测试覆盖率

**问题**: 整个项目 0 个测试文件

**风险**:
- 重构时易引入 bug
- 无法保证代码质量
- 难以回归测试

**修复**:
```bash
# 安装测试框架
npm install -D vitest @testing-library/react @testing-library/jest-dom

# 创建测试配置
# vitest.config.ts
```

```typescript
// lib/db/__tests__/conversations.test.ts
import { describe, it, expect } from 'vitest'
import { createConversation, getConversationById } from '../conversations'

describe('Conversations DB', () => {
  it('should create a conversation', async () => {
    const convId = await createConversation('user123', 'skill123')
    expect(convId).toBeTruthy()
  })
})
```

**目标**: 达到 50%+ 覆盖率
**耗时**: 持续 (预计 40+ 小时)

---

## 📋 改进路线图

### Phase 1: 安全和稳定性 (第 1-2 周)

| 任务 | 优先级 | 耗时 | 负责人 |
|------|--------|------|--------|
| 轮换所有 API 密钥 | 🔴 CRITICAL | 1-2h | - |
| 实施密钥管理方案 | 🔴 HIGH | 2-3h | - |
| 移除 console.log | 🔴 HIGH | 2-3h | - |
| 创建 Logger 工具类 | 🔴 HIGH | 1h | - |
| 改进错误处理 | 🔴 HIGH | 4-6h | - |
| 添加认证中间件 | 🔴 HIGH | 3-4h | - |

**预计总时间**: 13-19 小时

---

### Phase 2: 代码质量 (第 2-3 周)

| 任务 | 优先级 | 耗时 | 负责人 |
|------|--------|------|--------|
| 修复 TypeScript 类型 | 🟠 HIGH | 2-3h | - |
| 优化数据库查询 | 🟠 MEDIUM | 2h | - |
| 添加测试框架 | 🟠 HIGH | 2h | - |
| 编写核心功能测试 | 🟠 MEDIUM | 8-10h | - |
| 添加 ESLint + Prettier | 🟠 MEDIUM | 1-2h | - |

**预计总时间**: 15-19 小时

---

### Phase 3: 用户体验和性能 (第 3-4 周)

| 任务 | 优先级 | 耗时 | 负责人 |
|------|--------|------|--------|
| 改进加载状态 | 🟡 MEDIUM | 3-4h | - |
| 添加骨架屏 | 🟡 MEDIUM | 2-3h | - |
| 实现缓存策略 | 🟡 MEDIUM | 6-8h | - |
| 集成 React Query | 🟡 MEDIUM | 4-6h | - |
| 优化图片加载 | 🟡 LOW | 2-3h | - |

**预计总时间**: 17-24 小时

---

### Phase 4: 文档和工程化 (第 4-5 周)

| 任务 | 优先级 | 耗时 | 负责人 |
|------|--------|------|--------|
| 编写 README.md | 🟡 MEDIUM | 2-3h | - |
| 创建 API 文档 | 🟡 MEDIUM | 4-6h | - |
| 编写架构设计文档 | 🟡 MEDIUM | 3-4h | - |
| 设置 CI/CD 流程 | 🟡 MEDIUM | 4-6h | - |
| 添加 Git hooks | 🟡 MEDIUM | 1-2h | - |

**预计总时间**: 14-21 小时

---

## 🎯 快速胜利清单 (Quick Wins)

这些改进可以在短时间内完成,且效果显著:

### 1. 添加 .gitignore (5 分钟)
```bash
# 确保 .env.local 在 .gitignore 中
echo ".env.local" >> .gitignore
git rm --cached .env.local  # 移除已跟踪的文件
```

### 2. 创建 .env.example (10 分钟)
```bash
# .env.example
UNIFIED_API_KEY=your_unified_api_key_here
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. 添加 README.md (30 分钟)
```markdown
# AI Skills Workbench

## 快速开始

1. 克隆仓库
2. 复制 .env.example 为 .env.local
3. 填写 API 密钥
4. npm install && npm run dev
```

### 4. 修复明显的类型错误 (1 小时)
```typescript
// 将 any 替换为具体类型
- let attachments: any[] = []
+ let attachments: Attachment[] = []

interface Attachment {
  type: 'image'
  url: string
  base64?: string
}
```

### 5. 移除未使用的 console.log (30 分钟)
```bash
# 搜索并移除 debug console.log
# 保留关键的 error 日志
```

---

## 📐 架构改进建议

### 当前架构
```
ConversationView.tsx → API Route → Dispatcher → AI Model
                                  ↓
                              Database (Supabase)
```

### 建议的架构
```
ConversationView.tsx → API Route → [Middleware] → Service Layer → Repository Layer
                                       ↓              ↓                ↓
                                   Auth Check    Business Logic    DB Operations
                                   Validation    Error Handling
                                   Logging
```

### 新增建议的目录结构
```
lib/
├── services/          # ← 新增：业务逻辑层
│   ├── conversation.service.ts
│   ├── message.service.ts
│   └── skill.service.ts
├── repositories/      # ← 新增：数据访问层
│   ├── conversation.repo.ts
│   ├── message.repo.ts
│   └── skill.repo.ts
├── middleware/        # ← 完善：中间件层
│   ├── auth.ts
│   ├── validation.ts
│   └── errorHandler.ts
├── errors/           # ← 新增：错误定义
│   └── AppError.ts
└── logger/           # ← 新增：日志工具
    └── logger.ts
```

---

## 🔒 安全加固清单

### 立即执行
- [ ] 轮换所有泄露的 API 密钥
- [ ] 审查 Git 历史中的密钥泄露
- [ ] 添加 .env.local 到 .gitignore
- [ ] 设置 pre-commit hooks 扫描密钥

### 短期改进 (1-2 周)
- [ ] 实施 JWT 密钥轮换
- [ ] 添加 Cookie secure 标志(开发环境也启用)
- [ ] 实施 CSRF 保护
- [ ] 添加 API 速率限制

### 中期改进 (1-2 月)
- [ ] 实施 RBAC (基于角色的访问控制)
- [ ] 添加内容安全策略 (CSP)
- [ ] 实施 2FA (两因素认证)
- [ ] 定期安全审计

---

## 📊 性能优化清单

### 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_conversations_user_skill
ON conversations(user_id, skill_id, updated_at DESC);

CREATE INDEX idx_messages_conversation
ON messages(conversation_id, created_at);

-- 优化查询
-- ❌ 避免
SELECT * FROM conversations WHERE user_id = ?

-- ✅ 改进
SELECT id, skill_id, created_at, updated_at
FROM conversations
WHERE user_id = ?
ORDER BY updated_at DESC
LIMIT 20
```

### 前端优化
```typescript
// 使用 React Query 缓存
import { useQuery } from '@tanstack/react-query'

export function usePublicSkills() {
  return useQuery({
    queryKey: ['skills', 'public'],
    queryFn: getPublicSkills,
    staleTime: 1000 * 60 * 60, // 1 小时
    cacheTime: 1000 * 60 * 60 * 24, // 24 小时
  })
}

// 使用 Next/Image 优化图片
import Image from 'next/image'

<Image
  src={url}
  alt="..."
  loading="lazy"
  width={800}
  height={600}
/>
```

---

## 🧪 测试策略

### 测试金字塔
```
           /\
          /  \  E2E Tests (10%)
         /____\
        /      \  Integration Tests (30%)
       /________\
      /          \  Unit Tests (60%)
     /____________\
```

### 优先测试的功能
1. 认证和授权逻辑
2. 数据库操作 (CRUD)
3. API 路由
4. 关键业务逻辑 (AI 调度)
5. 表单验证

### 测试示例
```typescript
// lib/db/__tests__/conversations.test.ts
describe('Conversation Repository', () => {
  it('should create a conversation', async () => {
    const convId = await createConversation('user1', 'skill1')
    expect(convId).toBeTruthy()
  })

  it('should get or create conversation', async () => {
    const convId1 = await getOrCreateConversation('user1', 'skill1')
    const convId2 = await getOrCreateConversation('user1', 'skill1')
    expect(convId1).toBe(convId2)  // 应该返回同一个
  })
})
```

---

## 📈 成功指标

### 技术指标
- [ ] 测试覆盖率 > 70%
- [ ] TypeScript strict 模式启用
- [ ] 零 console.log 在生产环境
- [ ] API 平均响应时间 < 200ms
- [ ] 数据库查询平均时间 < 100ms

### 安全指标
- [ ] 所有密钥已轮换
- [ ] 通过安全审计
- [ ] 实施密钥管理方案
- [ ] 添加 WAF 规则

### 用户体验指标
- [ ] 错误提示清晰易懂
- [ ] 加载状态完善
- [ ] 支持键盘导航
- [ ] 通过 WCAG 2.1 AA 级别

---

## 🚀 立即开始

### 今天就做 (最重要的3件事)

1. **轮换所有 API 密钥** (30 分钟)
   ```bash
   # 访问 unified.so 重新生成密钥
   # 访问 siliconflow.cn 重新生成密钥
   # 访问 Supabase 控制台重新生成密钥
   # 更新 .env.local
   ```

2. **移除最明显的 console.log** (30 分钟)
   ```bash
   # 搜索并移除 debug 日志
   grep -r "console.log" lib/ components/ app/
   ```

3. **创建基本的 Logger 工具** (30 分钟)
   ```typescript
   // lib/logger.ts
   export class Logger {
     // ... (见上文示例)
   }
   ```

### 本周完成

4. 创建错误处理中间件
5. 添加 .env.example
6. 编写基本的 README.md
7. 修复明显的类型错误

---

## 📞 需要帮助?

如果在实施改进时遇到问题:

1. 查看详细的分析报告 (由 Explore agent 生成)
2. 参考已有的修复文档:
   - [COMPLETE_FIX_GUIDE.md](COMPLETE_FIX_GUIDE.md)
   - [ALL_FIXES_SUMMARY.md](ALL_FIXES_SUMMARY.md)
   - [HISTORY_SAVE_FIX.md](HISTORY_SAVE_FIX.md)
3. 提出具体的技术问题

---

## 总结

这个项目有良好的基础,但需要在以下关键领域改进:

1. 🔴 **安全性**: 密钥泄露必须立即解决
2. 🔴 **可靠性**: 错误处理和日志记录需大幅改进
3. 🟠 **可维护性**: 缺少测试和文档
4. 🟡 **性能**: Console.log 泛滥和缺乏缓存

按照本计划执行,项目可以在 **2-3 个月内达到生产级别质量**。

预计总工作量: **60-85 小时** (约 8-11 个工作日)
