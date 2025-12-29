# 图片上传调试说明

## 问题描述
用户报告图片上传后没有显示在界面中。

## 已验证的工作部分

### ✅ 服务器端上传
- API 端点 `/api/upload/image` 正常工作
- 图片成功保存到 `/public/uploads/` 目录
- 服务器日志显示: `POST /api/upload/image 200 in 204ms`
- 已上传的图片可以通过 HTTP 访问(测试通过):
  - `http://localhost:3000/uploads/2a89b003-efaa-404f-b9d7-284a518bb431.png` (85KB)
  - `http://localhost:3000/uploads/d07c18e1-837b-4fec-9723-721e66b812fb.png` (757KB)

### ✅ 组件结构
- `ConversationView.tsx` 包含完整的图片上传逻辑
- 图片上传按钮在 `inputTypes` 包含 'image' 的技能中显示
- "朋友圈文案" 技能已配置 `inputTypes: ['text', 'voice', 'image']`
- 图片预览区域位于输入框上方(正确位置)

## 添加的调试功能

### 1. 上传过程日志
在 `handleImageUpload` 函数中添加:
- 开始上传时记录文件名
- 上传响应数据
- 添加到状态时的图片信息
- 更新后的完整图片列表

### 2. 状态变化监听
添加 `useEffect` 监听 `uploadedImages` 状态变化:
```typescript
useEffect(() => {
  console.log('✅ uploadedImages 状态变化 - 数量:', uploadedImages.length, '内容:', uploadedImages)
}, [uploadedImages])
```

### 3. 渲染检查
在图片预览区域添加:
- 渲染时检查 `uploadedImages.length`
- 每个图片的加载成功/失败事件
- 更明显的背景色(bg-secondary/30)

## 测试步骤

1. 打开浏览器开发者工具(F12 或 Cmd+Opt+I)
2. 切换到 Console 标签页
3. 访问 http://localhost:3000/skill/moments-copywriter
4. 点击图片上传按钮,选择一张图片
5. 观察控制台输出,应该看到:
   ```
   开始上传图片: [filename]
   上传响应: {success: true, url: "/uploads/...", ...}
   添加图片到状态: {url: "/uploads/...", name: "..."}
   更新后的图片列表: [{url: "...", name: "..."}]
   ✅ uploadedImages 状态变化 - 数量: 1 内容: [...]
   图片预览检查 - uploadedImages.length: 1 [...]
   图片加载成功: /uploads/...
   ```

## 预期问题场景

### 场景 A: 状态更新但不渲染
**症状**: 控制台显示状态变化,但没有 "图片预览检查" 日志
**原因**: 组件没有重新渲染
**解决**: 检查 React 组件树,可能需要添加 key 或使用 forceUpdate

### 场景 B: 状态未更新
**症状**: 只有 "开始上传" 和 "上传响应",没有后续日志
**原因**: `setUploadedImages` 没有执行
**解决**: 检查 `data.success` 条件或异步时序问题

### 场景 C: 图片路径错误
**症状**: 有 "图片预览检查" 但有 "图片加载失败" 错误
**原因**: 图片 URL 格式不正确或无法访问
**解决**: 检查 URL 格式和 Next.js 静态文件服务配置

## 下一步

请按照测试步骤操作,并将控制台输出截图或复制给我,我将根据具体日志定位问题。
