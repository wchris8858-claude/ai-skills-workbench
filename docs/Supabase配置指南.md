# Supabase 配置指南

## 概述

本项目使用 Supabase 作为数据库,存储用户信息、技能配置、历史记录等数据。您可以通过管理员设置页面轻松配置 Supabase 连接。

## 配置步骤

### 方式一:通过管理员设置页面(推荐)

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **访问设置页面**
   - 以管理员身份登录
   - 点击右上角用户头像
   - 选择"系统设置"
   - 进入"Supabase 配置"标签

3. **填写 Supabase 信息**
   - **Supabase URL**: 您的 Supabase 项目 URL
   - **Supabase Anon Key**: 公开的匿名密钥

4. **获取 Supabase 凭据**
   - 登录 [Supabase 控制台](https://app.supabase.com)
   - 选择您的项目
   - 进入 `Settings` → `API`
   - 复制以下信息:
     - `Project URL` → Supabase URL
     - `anon/public` key → Supabase Anon Key

5. **保存配置**
   - 点击"保存 Supabase 配置"按钮
   - 系统会自动更新 `.env.local` 文件
   - **重启开发服务器**以使配置生效

### 方式二:手动配置环境变量

1. **编辑 .env.local 文件**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 创建 Supabase 项目

如果您还没有 Supabase 项目,请按照以下步骤创建:

1. **注册 Supabase 账户**
   - 访问 https://supabase.com
   - 点击 "Start your project"
   - 使用 GitHub 或 Email 注册

2. **创建新项目**
   - 点击 "New Project"
   - 填写项目信息:
     - Name: 项目名称(如: ai-skills-workbench)
     - Database Password: 数据库密码(请妥善保管)
     - Region: 选择离您最近的区域
   - 点击 "Create new project"
   - 等待项目初始化(约2分钟)

3. **运行数据库迁移**
   - 进入项目的 SQL Editor
   - 复制 `/supabase/migrations/20250101_system_settings.sql` 的内容
   - 粘贴到 SQL Editor 并执行
   - 这将创建 `system_settings` 表

4. **获取 API 凭据**
   - 进入 `Settings` → `API`
   - 复制 URL 和 anon key
   - 在设置页面填入这些信息

## 数据库结构

### system_settings 表

存储系统级配置,包括模型配置等。

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**字段说明**:
- `key`: 配置键名(如: "model_configs")
- `value`: 配置值(JSON 格式)
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 模型配置管理

配置 Supabase 后,您可以在系统设置页面管理每个技能使用的 AI 模型:

1. **进入"模型配置"标签**
   - 查看所有技能列表
   - 每个技能可以配置文本模型和图像模型

2. **选择模型**
   - **文本模型**:
     - Claude Haiku 4.5: 快速响应,性价比高
     - Claude Opus 4.5: 最强推理和创作能力
     - Gemini Pro Vision: 支持视觉理解
   - **图像模型**:
     - GPT Image 1.5: AI 图像生成
     - Nano Banana Pro: 创意图像生成

3. **保存配置**
   - 点击"保存模型配置"
   - 配置会保存到数据库
   - 同时保存到浏览器 localStorage

## 配置优先级

系统会按以下优先级加载配置:

1. **数据库配置**(最高优先级)
   - 通过设置页面保存的配置
   - 存储在 `system_settings` 表中

2. **LocalStorage 配置**
   - 保存在浏览器本地
   - 在数据库不可用时使用

3. **默认配置**(最低优先级)
   - 代码中定义的默认配置
   - 在 `lib/models/config.ts` 中

## 常见问题

### Q: 配置保存后没有生效?

A: 请确保重启了开发服务器:
```bash
# 停止服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### Q: Supabase URL 验证失败?

A: Supabase URL 必须以 `https://` 开头,格式为:
```
https://xxxxx.supabase.co
```

### Q: 如何验证配置是否正确?

A: 检查以下内容:
1. `.env.local` 文件中的配置是否更新
2. 浏览器控制台是否有错误信息
3. 尝试创建一个技能或查看历史记录

### Q: 数据库连接失败?

A: 可能的原因:
1. Supabase 项目未完成初始化(等待2分钟)
2. API 密钥错误(重新复制)
3. 项目已暂停(Supabase 免费版会自动暂停不活跃项目)

### Q: 如何迁移现有数据?

A:
1. 在旧的 Supabase 项目中导出数据
2. 创建新项目并运行迁移脚本
3. 导入数据到新项目
4. 更新 `.env.local` 配置

## 安全建议

1. **不要提交 .env.local 文件**
   - `.env.local` 已在 `.gitignore` 中
   - 包含敏感的 API 密钥

2. **定期更换 API 密钥**
   - 在 Supabase 控制台中可以重新生成密钥

3. **启用 Row Level Security (RLS)**
   - 迁移脚本已自动启用 RLS
   - 只有管理员可以修改系统配置

4. **备份数据**
   - 定期导出重要数据
   - Supabase 提供自动备份功能(付费版)

## 进阶配置

### 自定义数据库模式

如果需要添加新表或修改现有表:

1. 在 `supabase/migrations/` 创建新的迁移文件
2. 使用时间戳命名(如: `20250102_add_custom_table.sql`)
3. 在 Supabase SQL Editor 中执行

### 使用 Supabase CLI

安装 Supabase CLI 以便更方便地管理:

```bash
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 应用迁移
supabase db push

# 生成类型定义
supabase gen types typescript --local > lib/database.types.ts
```

## 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Dashboard](https://app.supabase.com)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
