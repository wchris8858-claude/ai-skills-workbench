# [功能名称] - 技术方案

> plan.md - 描述"怎么做"

## 技术选型

| 层面 | 技术 | 理由 |
|------|------|------|
| 前端 | | |
| 后端 | | |
| 数据库 | | |
| 第三方服务 | | |

## 架构设计

```
[架构图或流程图]
```

## 数据模型

### 新增表
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 修改表
```sql
ALTER TABLE table_name ADD COLUMN column_name TYPE;
```

## API 设计

### `POST /api/endpoint`

**请求**
```json
{
  "field": "value"
}
```

**响应**
```json
{
  "success": true,
  "data": {}
}
```

## 组件设计

### 新增组件
- `ComponentName.tsx` - 描述

### 修改组件
- `ExistingComponent.tsx` - 修改内容

## 依赖

### 新增依赖
```bash
npm install package-name
```

## 风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 风险 1 | 高/中/低 | 措施 |

## 测试策略

- 单元测试：覆盖核心逻辑
- 集成测试：API 端点测试
- E2E 测试：关键用户流程

---
创建日期: YYYY-MM-DD
