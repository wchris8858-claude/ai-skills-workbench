# 无障碍支持指南

本文档介绍项目中的无障碍功能和最佳实践,确保应用符合 WCAG 2.1 AA 标准。

## 📋 目录

- [核心功能](#核心功能)
- [组件库](#组件库)
- [ARIA 支持](#aria-支持)
- [键盘导航](#键盘导航)
- [颜色对比度](#颜色对比度)
- [屏幕阅读器](#屏幕阅读器)
- [最佳实践](#最佳实践)

## 🎯 核心功能

### 1. 无障碍上下文

```tsx
import { AccessibilityProvider, useAccessibility } from '@/components/accessibility/AccessibilityProvider'

// 在根组件中包装
function App() {
  return (
    <AccessibilityProvider>
      <YourApp />
    </AccessibilityProvider>
  )
}

// 在组件中使用
function MyComponent() {
  const {
    reducedMotion,    // 是否启用减少动画
    highContrast,     // 是否启用高对比度
    fontSize,         // 字体大小设置
    setFontSize,      // 设置字体大小
    announceMessage   // 屏幕阅读器通知
  } = useAccessibility()

  return (
    <button onClick={() => announceMessage('操作成功', 'polite')}>
      点击我
    </button>
  )
}
```

### 2. 无障碍设置面板

```tsx
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings'

// 在设置页面中使用
function SettingsPage() {
  return (
    <div>
      <h1>设置</h1>
      <AccessibilitySettings />
    </div>
  )
}
```

## 🧩 组件库

### 1. 视觉隐藏组件

用于隐藏内容但保持屏幕阅读器可访问:

```tsx
import { VisuallyHidden, ScreenReaderOnly } from '@/components/ui/visually-hidden'

// 基础用法
<VisuallyHidden>此内容只对屏幕阅读器可见</VisuallyHidden>

// 焦点时可见(用于跳转链接)
<VisuallyHidden focusable>
  <a href="#main-content">跳转到主内容</a>
</VisuallyHidden>

// 别名用法
<ScreenReaderOnly>屏幕阅读器专用文本</ScreenReaderOnly>
```

### 2. ARIA 实时区域

```tsx
import { useAriaLive } from '@/lib/accessibility/aria-live'

function NotificationComponent() {
  const { announce, announceError, announceSuccess } = useAriaLive()

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

## ⌨️ 键盘导航

### 1. 焦点陷阱(模态框)

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
      <h2 id="modal-title">对话框标题</h2>
      {children}
      <button onClick={onClose}>关闭</button>
    </div>
  )
}
```

### 2. 自动聚焦

```tsx
import { useAutoFocus } from '@/lib/accessibility/focus-management'

function SearchInput() {
  const inputRef = useAutoFocus<HTMLInputElement>()

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="搜索..."
      aria-label="搜索输入框"
    />
  )
}
```

### 3. 焦点返回

```tsx
import { useFocusReturn } from '@/lib/accessibility/focus-management'

function Dropdown() {
  const { storeFocus, restoreFocus } = useFocusReturn()

  const handleOpen = () => {
    storeFocus()
    // 打开下拉菜单
  }

  const handleClose = () => {
    // 关闭下拉菜单
    restoreFocus()
  }

  return (
    <button onClick={handleOpen}>打开菜单</button>
  )
}
```

### 4. 列表键盘导航

```tsx
import { useKeyboardNavigation } from '@/lib/accessibility/focus-management'

function ListComponent({ items }) {
  const { containerRef, handleKeyDown } = useKeyboardNavigation(
    items.length,
    {
      orientation: 'vertical',
      loop: true,
      onSelect: (index) => {
        console.log('选中项:', index)
      }
    }
  )

  return (
    <ul
      ref={containerRef}
      role="listbox"
      onKeyDown={handleKeyDown}
      aria-label="项目列表"
    >
      {items.map((item, index) => (
        <li
          key={index}
          role="option"
          tabIndex={index === 0 ? 0 : -1}
          aria-selected={false}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}
```

## 🎨 颜色对比度

### 1. 检查对比度

```tsx
import {
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  getContrastLevel
} from '@/lib/accessibility/color-contrast'

// 获取对比度比率
const ratio = getContrastRatio('#000000', '#FFFFFF')
console.log(ratio) // 21

// 检查是否符合 WCAG AA
const meetsAA = meetsWCAG_AA('#000000', '#FFFFFF')
console.log(meetsAA) // true

// 检查是否符合 WCAG AAA
const meetsAAA = meetsWCAG_AAA('#767676', '#FFFFFF')
console.log(meetsAAA) // false

// 获取等级
const level = getContrastLevel('#000000', '#FFFFFF')
console.log(level) // 'AAA'
```

### 2. 建议可访问颜色

```tsx
import { getAccessibleTextColor } from '@/lib/accessibility/color-contrast'

const backgroundColor = '#3B82F6' // 蓝色
const textColor = getAccessibleTextColor(backgroundColor)
console.log(textColor) // '#FFFFFF'
```

### 3. 验证调色板

```tsx
import { validateColorPalette } from '@/lib/accessibility/color-contrast'

const results = validateColorPalette([
  {
    foreground: '#000000',
    background: '#FFFFFF',
    usage: '正文文本',
    isLargeText: false
  },
  {
    foreground: '#FFFFFF',
    background: '#3B82F6',
    usage: '主按钮',
    isLargeText: false
  },
  {
    foreground: '#767676',
    background: '#FFFFFF',
    usage: '辅助文本',
    isLargeText: false
  }
], 'AA')

results.forEach(result => {
  console.log(`${result.pair.usage}: ${result.level} (${result.ratio.toFixed(2)}:1)`)
  console.log(`符合 AA 标准: ${result.passes}`)
})
```

## 📢 屏幕阅读器

### 1. ARIA 属性

```tsx
// 加载状态
<div aria-busy="true" aria-live="polite">
  加载中...
</div>

// 错误提示
<div role="alert" aria-live="assertive">
  发生错误,请重试
</div>

// 表单字段
<div>
  <label htmlFor="email">电子邮件</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'email-error' : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert">
      请输入有效的电子邮件地址
    </span>
  )}
</div>

// 按钮状态
<button
  aria-pressed={isActive}
  aria-label="切换深色模式"
>
  <MoonIcon />
</button>

// 进度条
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="上传进度"
>
  {progress}%
</div>
```

### 2. 语义化 HTML

```tsx
// ✅ 好的做法
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
    <li><a href="/about">关于</a></li>
  </ul>
</nav>

<main id="main-content">
  <article>
    <h1>文章标题</h1>
    <p>文章内容...</p>
  </article>
</main>

<aside aria-label="相关文章">
  <h2>相关阅读</h2>
  <ul>...</ul>
</aside>

// ❌ 不好的做法
<div className="nav">
  <div className="link">首页</div>
  <div className="link">关于</div>
</div>

<div className="main">
  <div className="article">
    <div className="title">文章标题</div>
    <div>文章内容...</div>
  </div>
</div>
```

## 💡 最佳实践

### 1. 表单无障碍

```tsx
function AccessibleForm() {
  const [errors, setErrors] = useState({})

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 表单标题 */}
      <h2 id="form-title">用户注册</h2>

      {/* 表单说明 */}
      <p id="form-description">
        请填写以下信息以创建账户
      </p>

      <fieldset aria-describedby="form-description">
        <legend className="sr-only">注册信息</legend>

        {/* 文本输入 */}
        <div>
          <label htmlFor="username">
            用户名 <span aria-label="必填">*</span>
          </label>
          <input
            id="username"
            type="text"
            required
            aria-required="true"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <span id="username-error" role="alert" className="text-destructive">
              {errors.username}
            </span>
          )}
        </div>

        {/* 单选按钮组 */}
        <fieldset>
          <legend>性别</legend>
          <div>
            <input type="radio" id="male" name="gender" value="male" />
            <label htmlFor="male">男</label>
          </div>
          <div>
            <input type="radio" id="female" name="gender" value="female" />
            <label htmlFor="female">女</label>
          </div>
        </fieldset>

        {/* 复选框 */}
        <div>
          <input
            id="terms"
            type="checkbox"
            required
            aria-required="true"
            aria-describedby="terms-description"
          />
          <label htmlFor="terms">
            我同意服务条款
          </label>
          <p id="terms-description" className="text-sm text-muted-foreground">
            请阅读并同意我们的服务条款和隐私政策
          </p>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          aria-label="提交注册表单"
        >
          注册
        </button>
      </fieldset>
    </form>
  )
}
```

### 2. 模态框无障碍

```tsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const trapRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (isOpen) {
      // 阻止背景滚动
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 对话框 */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 flex items-center justify-center"
      >
        <div className="bg-background rounded-lg p-6 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="关闭对话框"
              className="p-2 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>{children}</div>

          <div className="flex gap-2 mt-4">
            <button onClick={onClose}>取消</button>
            <button>确认</button>
          </div>
        </div>
      </div>
    </>
  )
}
```

### 3. 图片无障碍

```tsx
// ✅ 装饰性图片
<img src="decoration.png" alt="" role="presentation" />

// ✅ 有意义的图片
<img
  src="product.jpg"
  alt="红色连帽衫,正面视图,售价 $49.99"
/>

// ✅ 链接中的图片
<a href="/profile">
  <img src="avatar.jpg" alt="用户资料页面" />
</a>

// ✅ 复杂图片
<figure>
  <img
    src="chart.png"
    alt="2024 年销售趋势图"
    aria-describedby="chart-description"
  />
  <figcaption id="chart-description">
    该图表显示了 2024 年 1 月至 12 月的销售数据,
    第二季度销售额最高,达到 150 万美元。
  </figcaption>
</figure>

// ✅ 背景图片(使用 ARIA)
<div
  style={{ backgroundImage: 'url(hero.jpg)' }}
  role="img"
  aria-label="团队在办公室协作工作"
/>
```

### 4. 表格无障碍

```tsx
function AccessibleTable({ data }) {
  return (
    <table>
      <caption>2024 年销售数据</caption>
      <thead>
        <tr>
          <th scope="col">月份</th>
          <th scope="col">销售额</th>
          <th scope="col">增长率</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.month}>
            <th scope="row">{row.month}</th>
            <td>{row.sales}</td>
            <td>{row.growth}%</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">总计</th>
          <td>{totalSales}</td>
          <td>-</td>
        </tr>
      </tfoot>
    </table>
  )
}
```

## 🧪 测试清单

- [ ] 所有交互元素可通过键盘访问
- [ ] 焦点指示器清晰可见
- [ ] 表单字段有正确的标签
- [ ] 错误消息与相应字段关联
- [ ] 图片有适当的替代文本
- [ ] 颜色对比度符合 WCAG AA 标准
- [ ] 动态内容有 ARIA 实时区域
- [ ] 模态框正确管理焦点
- [ ] 标题层级正确 (h1 → h2 → h3)
- [ ] 使用语义化 HTML 元素
- [ ] 屏幕阅读器测试通过
- [ ] 支持缩放到 200%

## 📚 相关资源

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
