# 无障碍功能快速开始

## 🚀 快速集成

### 1. 添加无障碍提供者

在您的根布局中包装 `AccessibilityProvider`:

```tsx
// app/layout.tsx
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  )
}
```

### 2. 导入无障碍样式

```tsx
// app/globals.css
@import './globals-accessibility.css';
```

### 3. 添加无障碍设置页面

```tsx
// app/settings/page.tsx
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings'

export default function SettingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      <AccessibilitySettings />
    </div>
  )
}
```

## 💡 常用功能

### 屏幕阅读器通知

```tsx
import { useAriaLive } from '@/lib/accessibility/aria-live'

function MyComponent() {
  const { announceSuccess, announceError } = useAriaLive()

  const handleSave = async () => {
    try {
      await saveData()
      announceSuccess('数据保存成功')
    } catch (error) {
      announceError('保存失败,请重试')
    }
  }

  return <button onClick={handleSave}>保存</button>
}
```

### 模态框焦点管理

```tsx
import { useFocusTrap } from '@/lib/accessibility/focus-management'

function Modal({ isOpen, onClose, children }) {
  const trapRef = useFocusTrap(isOpen)

  if (!isOpen) return null

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">标题</h2>
      {children}
      <button onClick={onClose}>关闭</button>
    </div>
  )
}
```

### 键盘导航列表

```tsx
import { useKeyboardNavigation } from '@/lib/accessibility/focus-management'

function NavigableList({ items }) {
  const { containerRef, handleKeyDown } = useKeyboardNavigation(
    items.length,
    {
      orientation: 'vertical',
      loop: true,
      onSelect: (index) => handleSelect(items[index])
    }
  )

  return (
    <ul ref={containerRef} onKeyDown={handleKeyDown} role="listbox">
      {items.map((item, i) => (
        <li key={i} role="option" tabIndex={i === 0 ? 0 : -1}>
          {item}
        </li>
      ))}
    </ul>
  )
}
```

### 视觉隐藏内容

```tsx
import { VisuallyHidden } from '@/components/ui/visually-hidden'

// 为屏幕阅读器添加上下文
<button>
  <TrashIcon />
  <VisuallyHidden>删除项目</VisuallyHidden>
</button>

// 跳转链接
<VisuallyHidden focusable>
  <a href="#main-content">跳转到主内容</a>
</VisuallyHidden>
```

## ✅ 检查清单

使用此清单确保您的组件符合无障碍标准:

- [ ] 所有交互元素可通过 Tab 键访问
- [ ] 焦点指示器清晰可见
- [ ] 表单字段有关联的 label
- [ ] 图片有适当的 alt 文本
- [ ] 颜色对比度至少 4.5:1
- [ ] 动态内容有 ARIA 通知
- [ ] 模态框正确管理焦点
- [ ] 支持键盘快捷键 (Tab, Enter, Esc)
- [ ] 使用语义化 HTML
- [ ] 屏幕阅读器测试通过

## 🧪 测试工具

### 浏览器扩展
- [axe DevTools](https://www.deque.com/axe/devtools/) - 自动化无障碍测试
- [WAVE](https://wave.webaim.org/extension/) - 可视化无障碍评估
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome 内置审计工具

### 屏幕阅读器
- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (免费) 或 JAWS
- **移动端**: iOS VoiceOver / Android TalkBack

### 键盘测试
1. 拔掉鼠标
2. 使用 Tab 浏览整个页面
3. 确保所有功能可访问
4. 检查焦点顺序是否合理

## 📚 更多资源

- [完整文档](./ACCESSIBILITY.md)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA 实践指南](https://www.w3.org/WAI/ARIA/apg/)
