# 历史记录保存问题修复

## 问题原因

对话历史没有保存的根本原因是 **Race Condition（竞态条件）**：

### 问题流程

1. 用户进入技能页面时，`loadConversation` useEffect 开始执行
2. 调用 `getOrCreateConversation()` 获取对话ID（异步操作）
3. 通过 `setConversationId(convId)` 设置状态
4. `setLoadingHistory(false)` 解除加载状态，发送按钮变为可用
5. **问题**: React 状态更新是异步的，`conversationId` 可能还没有真正更新完成
6. 用户快速发送消息时，`handleSend` 函数中的 `conversationId` 可能仍然是 `null`
7. 代码进入 `else` 分支，输出警告但不保存消息

### 日志表现

如果问题发生，浏览器控制台会显示：
```
⚠️ conversationId 为空，无法保存用户消息
⚠️ conversationId 为空，无法保存AI回复
```

## 解决方案

在 `handleSend` 函数中添加了保护逻辑：

```typescript
// 确保有 conversationId，如果没有就创建
let activeConvId = conversationId
if (!activeConvId) {
  console.log('⚠️ conversationId 为空，正在创建新对话...')
  activeConvId = await getOrCreateConversation(user.id, skillId)
  if (activeConvId) {
    setConversationId(activeConvId)
    console.log('✅ 新对话已创建:', activeConvId)
  } else {
    console.error('❌ 无法创建对话ID')
  }
}
```

### 核心改进

1. **使用局部变量 `activeConvId`**: 而不是依赖可能未更新的状态变量
2. **主动创建对话**: 如果 `conversationId` 为空，立即调用 `getOrCreateConversation`
3. **保证保存成功**: 后续的消息保存都使用 `activeConvId` 而非 `conversationId`

## 修改的文件

- [components/ConversationView.tsx](components/ConversationView.tsx)
  - `handleSend` 函数（约 line 224-324）

## 测试方法

1. 打开浏览器开发者工具（F12）
2. 访问任意技能页面（如朋友圈文案）
3. **快速**发送一条消息（页面刚加载完就发送）
4. 检查控制台日志：
   - 如果看到 "⚠️ conversationId 为空，正在创建新对话..."
   - 然后看到 "✅ 新对话已创建: [id]"
   - 最后看到 "✅ 用户消息已保存" 和 "✅ AI回复已保存"
   - 说明修复成功

5. 进入"历史记录"页面，应该能看到刚才的对话

## 预期行为

- ✅ 所有对话都会被正确保存到数据库
- ✅ 历史记录页面能够显示所有对话
- ✅ 即使用户在页面加载后立即发送消息，也能保存成功
- ✅ 不再出现 "⚠️ conversationId 为空" 的警告
