# 新功能开发命令

按照 SDD 流程开发新功能。

## 使用方式
```
/project:new-feature <功能名称>
```

## 执行步骤

### 1. 需求澄清
- 确认功能目标和范围
- 识别相关用户故事
- 确定验收标准

### 2. 创建规范文档
在 `docs/features/<功能名>/` 目录下创建：

```
docs/features/<功能名>/
├── spec.md     # 功能规范
├── plan.md     # 技术方案
└── tasks.md    # 任务清单
```

### 3. 实现流程
1. 按 tasks.md 逐个完成任务
2. 每个任务完成后运行测试
3. 更新进度状态

### 4. 收尾检查
- [ ] 所有测试通过
- [ ] 代码符合 constitution.md 规范
- [ ] 更新 README.md（如需要）
- [ ] 提交代码

## 模板引用
- spec 模板: `docs/templates/spec.template.md`
- plan 模板: `docs/templates/plan.template.md`
- tasks 模板: `docs/templates/tasks.template.md`
