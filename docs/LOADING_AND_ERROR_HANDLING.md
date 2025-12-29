# 加载状态和错误处理指南

本文档介绍项目中的加载状态和错误处理最佳实践。

## 📦 组件库

### 1. 加载组件

#### LoadingSpinner
基础加载指示器

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// 基础用法
<LoadingSpinner />

// 带文本
<LoadingSpinner size="lg" text="加载中..." />

// 不同尺寸
<LoadingSpinner size="sm" />  // 小
<LoadingSpinner size="md" />  // 中(默认)
<LoadingSpinner size="lg" />  // 大
```

#### LoadingOverlay
覆盖层加载

```tsx
import { LoadingOverlay } from '@/components/ui/loading-spinner'

<LoadingOverlay isLoading={isLoading} text="正在保存...">
  <YourContent />
</LoadingOverlay>
```

#### Skeleton
骨架屏

```tsx
import {
  Skeleton,
  MessageSkeleton,
  SkillCardSkeleton
} from '@/components/ui/loading-spinner'

// 自定义骨架屏
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-20 w-full" />

// 预设骨架屏
<MessageSkeleton />
<SkillCardSkeleton />
```

### 2. 错误处理组件

#### ErrorDisplay
错误信息展示

```tsx
import { ErrorDisplay } from '@/components/ui/error-display'

<ErrorDisplay
  error={error}
  onRetry={() => refetch()}
  variant="destructive"  // 'default' | 'destructive' | 'warning'
/>
```

#### EmptyState
空状态展示

```tsx
import { EmptyState } from '@/components/ui/error-display'
import { MessageSquare } from 'lucide-react'

<EmptyState
  icon={<MessageSquare className="h-12 w-12" />}
  title="暂无对话"
  description="开始一个新对话吧!"
  action={{
    label: "新建对话",
    onClick: () => createConversation()
  }}
/>
```

### 3. Toast 通知

```tsx
import { useToast, toastHelpers } from '@/components/ui/toaster'

function MyComponent() {
  const { toast } = useToast()

  // 成功通知
  toast(toastHelpers.success('保存成功', '您的更改已保存'))

  // 错误通知
  toast(toastHelpers.error('保存失败', error.message))

  // 警告通知
  toast(toastHelpers.warning('注意', '操作无法撤销'))

  // 自定义通知
  toast({
    title: '自定义标题',
    description: '自定义描述',
    variant: 'default',
    duration: 3000
  })
}
```

## 🎣 Hooks

### useAsync
自动执行的异步操作

```tsx
import { useAsync } from '@/hooks/useAsync'

function MyComponent() {
  const { data, error, isLoading, refetch } = useAsync(
    async () => {
      const response = await fetch('/api/data')
      return response.json()
    },
    [],  // 依赖数组
    {
      onSuccess: (data) => {
        console.log('加载成功', data)
      },
      onError: (error) => {
        console.error('加载失败', error)
      },
      retry: 3,  // 重试次数
      retryDelay: 1000  // 重试延迟(ms)
    }
  )

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!data) return <EmptyState title="暂无数据" />

  return <div>{/* 渲染数据 */}</div>
}
```

### useAsyncCallback
手动触发的异步操作

```tsx
import { useAsyncCallback } from '@/hooks/useAsync'
import { useToast, toastHelpers } from '@/components/ui/toaster'

function MyComponent() {
  const { toast } = useToast()

  const [saveData, { isLoading, error }] = useAsyncCallback(
    async (data) => {
      const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response.json()
    },
    {
      onSuccess: () => {
        toast(toastHelpers.success('保存成功'))
      },
      onError: (error) => {
        toast(toastHelpers.error('保存失败', error.message))
      }
    }
  )

  return (
    <button
      onClick={() => saveData({ name: 'test' })}
      disabled={isLoading}
    >
      {isLoading ? '保存中...' : '保存'}
    </button>
  )
}
```

## 💡 最佳实践

### 1. 加载状态优先级

```tsx
// ✅ 推荐: 明确的加载状态
if (isLoading && !data) {
  return <LoadingSpinner text="加载中..." />
}

if (isLoading) {
  return <LoadingOverlay isLoading={true}>{content}</LoadingOverlay>
}

// ✅ 推荐: 骨架屏(更好的用户体验)
if (isLoadingInitial) {
  return (
    <div className="space-y-4">
      <MessageSkeleton />
      <MessageSkeleton />
      <MessageSkeleton />
    </div>
  )
}
```

### 2. 错误处理模式

```tsx
function DataComponent() {
  const { data, error, isLoading, refetch } = useAsync(fetchData)

  // 加载状态
  if (isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  // 错误状态
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={refetch}
        variant="destructive"
      />
    )
  }

  // 空状态
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="暂无数据"
        description="还没有任何内容"
      />
    )
  }

  // 成功状态
  return <DataList data={data} />
}
```

### 3. 表单提交

```tsx
function FormComponent() {
  const { toast } = useToast()
  const [submit, { isLoading, error }] = useAsyncCallback(
    async (formData) => {
      // 验证
      if (!formData.email) {
        throw new Error('请输入邮箱')
      }

      // 提交
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('提交失败')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        toast(toastHelpers.success('提交成功'))
      },
      onError: (error) => {
        toast(toastHelpers.error('提交失败', error.message))
      }
    }
  )

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      submit(Object.fromEntries(formData))
    }}>
      {/* 表单字段 */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? '提交中...' : '提交'}
      </button>
      {error && (
        <ErrorDisplay error={error} variant="destructive" />
      )}
    </form>
  )
}
```

### 4. 乐观更新

```tsx
function OptimisticComponent() {
  const [data, setData] = useState(initialData)
  const { toast } = useToast()

  const [toggleFavorite, { isLoading }] = useAsyncCallback(
    async (itemId) => {
      // 乐观更新 UI
      setData(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, isFavorite: !item.isFavorite }
          : item
      ))

      try {
        // 发送请求
        await fetch(`/api/favorite/${itemId}`, { method: 'POST' })
      } catch (error) {
        // 回滚
        setData(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ))
        throw error
      }
    },
    {
      onError: (error) => {
        toast(toastHelpers.error('操作失败', error.message))
      }
    }
  )

  return <ItemList data={data} onToggleFavorite={toggleFavorite} />
}
```

## 🎨 无障碍支持

所有组件都包含适当的 ARIA 属性:

- `aria-live="polite"` / `aria-live="assertive"` - 屏幕阅读器公告
- `aria-busy="true"` - 加载状态
- `role="alert"` - 错误和通知
- `aria-label` - 按钮标签

```tsx
// ✅ 自动包含无障碍属性
<LoadingSpinner />  // aria-busy="true"
<ErrorDisplay error={error} />  // role="alert", aria-live="assertive"
<Toast />  // role="alert", aria-live="assertive"
```

## 📚 相关文档

- [React Error Handling](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [Loading States Pattern](https://www.patterns.dev/posts/loading-states)
