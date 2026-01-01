# AI 开发框架配置

本目录包含 AI 协作开发的配置和工具。

## 目录结构

```
.claude/
├── settings.json     # 项目级配置（团队共享）
├── commands/         # 共享命令
│   ├── new-feature.md   # 新功能开发流程
│   ├── fix-bug.md       # Bug 修复流程
│   ├── add-skill.md     # 添加新技能
│   └── api-test.md      # API 测试流程
├── hooks/            # 自动化钩子
│   ├── pre-commit.sh    # 提交前检查
│   ├── post-edit.sh     # 编辑后验证
│   └── validate-api.sh  # API 格式验证
├── skills/           # 项目级 AI 技能（待添加）
└── agents/           # 自定义代理（待添加）
```

## 使用方式

### 命令调用
在 Claude 对话中使用 `/project:<命令名>` 调用命令：

```
/project:new-feature 用户收藏功能
/project:fix-bug 登录失败问题
/project:add-skill 数据分析助手
```

### 钩子执行
钩子脚本会在特定事件触发时自动执行：

```bash
# 手动执行提交前检查
.claude/hooks/pre-commit.sh

# 手动执行 API 验证
.claude/hooks/validate-api.sh
```

## 配置说明

### settings.json
- `permissions.allow`: 允许执行的命令
- `permissions.deny`: 禁止执行的命令
- `context.include`: 自动包含的上下文文件
- `hooks`: 钩子脚本映射

### 个人配置
创建 `settings.local.json`（已 gitignore）覆盖个人偏好：

```json
{
  "model": "opus",
  "theme": "dark"
}
```

## 相关文件

- `/CLAUDE.md` - 项目操作手册
- `/constitution.md` - 项目宪法（不可违背原则）
- `/docs/templates/` - SDD 文档模板
