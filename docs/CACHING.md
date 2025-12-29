# 缓存策略文档

本文档介绍项目中的缓存系统和最佳实践。

## 📦 缓存系统

### 1. MemoryCache

基础内存缓存类,支持 TTL 和最大容量限制。

```typescript
import { MemoryCache } from '@/lib/cache'

const cache = new MemoryCache({
  ttl: 5 * 60 * 1000,  // 5 minutes
  maxSize: 100         // 最多 100 条记录
})

// 设置缓存
cache.set('user:123', userData, 10 * 60 * 1000)  // 自定义 TTL

// 获取缓存
const data = cache.get<User>('user:123')

// 检查是否存在
if (cache.has('user:123')) {
  // ...
}

// 删除缓存
cache.delete('user:123')

// 清空所有缓存
cache.clear()

// 清理过期条目
cache.cleanup()

// 获取统计信息
const stats = cache.stats()
console.log(`Cache size: ${stats.size}/${stats.maxSize}`)
```

### 2. QueryCache

专门用于 API 查询的缓存,继承自 MemoryCache,提供额外的失效功能。

```typescript
import { queryCache, CacheKeys, invalidateCache } from '@/lib/cache/query-cache'

// 使用预定义的缓存键
const cacheKey = CacheKeys.conversations('user123')
queryCache.set(cacheKey, conversations)

// 按前缀失效
queryCache.invalidateByPrefix('conversations:')

// 按模式失效
queryCache.invalidateByPattern(/^conversation:/)

// 使用辅助函数失效
invalidateCache.conversations('user123')  // 失效用户所有对话
invalidateCache.conversation('conv123')   // 失效特定对话
invalidateCache.skills()                  // 失效所有技能缓存
```

### 3. 全局缓存实例

```typescript
import { globalCache } from '@/lib/cache'

// 全局缓存可在整个应用中使用
globalCache.set('config', appConfig)
const config = globalCache.get('config')
```

## 🎣 Hooks

### useQuery

数据查询 Hook,支持自动缓存和重新获取。

```typescript
import { useQuery } from '@/hooks/useQuery'
import { CacheKeys } from '@/lib/cache/query-cache'

function ConversationList({ userId }: { userId: string }) {
  const {
    data: conversations,
    error,
    isLoading,
    isFetching,
    refetch,
    invalidate
  } = useQuery(
    async () => {
      const response = await fetch(`/api/conversations?userId=${userId}`)
      return response.json()
    },
    {
      cacheKey: CacheKeys.conversations(userId),
      cacheTTL: 5 * 60 * 1000,  // 5 minutes
      enabled: true,             // 是否启用查询
      refetchOnMount: true,      // 组件挂载时重新获取
      refetchOnWindowFocus: false, // 窗口聚焦时重新获取
      retry: 3,                  // 重试次数
      retryDelay: 1000,          // 重试延迟
      onSuccess: (data) => {
        console.log('Loaded successfully', data)
      },
      onError: (error) => {
        console.error('Load failed', error)
      }
    }
  )

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!conversations) return <EmptyState />

  return (
    <div>
      {isFetching && <span>更新中...</span>}
      <ConversationList data={conversations} />
      <button onClick={() => refetch()}>刷新</button>
      <button onClick={() => invalidate()}>清除缓存</button>
    </div>
  )
}
```

### useMutation

数据变更 Hook,支持自动失效相关缓存。

```typescript
import { useMutation } from '@/hooks/useQuery'
import { CacheKeys, invalidateCache } from '@/lib/cache/query-cache'
import { useToast, toastHelpers } from '@/components/ui/toaster'

function CreateConversationButton({ userId }: { userId: string }) {
  const { toast } = useToast()

  const [createConversation, { isLoading, error }] = useMutation(
    async (data: { skillId: string }) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response.json()
    },
    {
      // 自动失效相关缓存
      invalidateKeys: [CacheKeys.conversations(userId)],

      onSuccess: (data) => {
        toast(toastHelpers.success('创建成功'))
        // 可以手动失效更多缓存
        invalidateCache.conversations(userId)
      },

      onError: (error) => {
        toast(toastHelpers.error('创建失败', error.message))
      },

      onSettled: (data, error) => {
        // 无论成功或失败都会执行
        console.log('Mutation settled', { data, error })
      }
    }
  )

  return (
    <button
      onClick={() => createConversation({ skillId: 'moments-copywriter' })}
      disabled={isLoading}
    >
      {isLoading ? '创建中...' : '新建对话'}
    </button>
  )
}
```

## 🔑 缓存键管理

### 预定义缓存键

```typescript
import { CacheKeys } from '@/lib/cache/query-cache'

// 对话相关
CacheKeys.conversations(userId)           // 用户的所有对话列表
CacheKeys.conversation(conversationId)    // 单个对话
CacheKeys.messages(conversationId)        // 对话的消息列表

// 技能相关
CacheKeys.skills()                        // 所有技能
CacheKeys.skill(skillId)                  // 单个技能

// 用户相关
CacheKeys.user(userId)                    // 用户信息
CacheKeys.stats(userId)                   // 用户统计
CacheKeys.favorites(userId)               // 用户收藏
```

### 自定义缓存键

```typescript
import { createCacheKey } from '@/lib/cache'

// 创建复合键
const cacheKey = createCacheKey('posts', userId, 'published')
// 结果: "posts:user123:published"

// 过滤空值
const key = createCacheKey('posts', null, undefined, 'draft')
// 结果: "posts:draft"
```

## 💡 最佳实践

### 1. 数据列表查询

```typescript
function useConversations(userId: string) {
  return useQuery(
    () => getUserConversations(userId),
    {
      cacheKey: CacheKeys.conversations(userId),
      cacheTTL: 5 * 60 * 1000,  // 5 分钟缓存
      refetchOnWindowFocus: true, // 窗口聚焦时刷新
    }
  )
}
```

### 2. 单条数据查询

```typescript
function useConversation(conversationId: string | null) {
  return useQuery(
    () => getConversation(conversationId!),
    {
      cacheKey: conversationId ? CacheKeys.conversation(conversationId) : undefined,
      enabled: !!conversationId,  // 仅在 ID 存在时查询
      cacheTTL: 10 * 60 * 1000,   // 10 分钟缓存
    }
  )
}
```

### 3. 创建数据

```typescript
function useCreateMessage() {
  return useMutation(
    (data: { conversationId: string; content: string }) =>
      createMessage(data),
    {
      // 创建后失效对话和消息缓存
      invalidateKeys: [
        CacheKeys.conversation(data.conversationId),
        CacheKeys.messages(data.conversationId),
        // 也失效对话列表,因为 updatedAt 改变了
        CacheKeys.conversations('*')  // 通配符表示所有用户
      ],
      onSuccess: () => {
        toast.success('消息已发送')
      }
    }
  )
}
```

### 4. 更新数据

```typescript
function useUpdateConversation() {
  const [update, state] = useMutation(
    (data: { id: string; updates: Partial<Conversation> }) =>
      updateConversation(data.id, data.updates),
    {
      onSuccess: (updatedConversation, variables) => {
        // 乐观更新缓存
        queryCache.set(
          CacheKeys.conversation(variables.id),
          updatedConversation
        )

        // 失效列表缓存
        invalidateCache.conversations('*')
      }
    }
  )

  return [update, state]
}
```

### 5. 删除数据

```typescript
function useDeleteConversation() {
  return useMutation(
    (conversationId: string) => deleteConversation(conversationId),
    {
      onSuccess: (_, conversationId) => {
        // 删除相关的所有缓存
        queryCache.delete(CacheKeys.conversation(conversationId))
        queryCache.delete(CacheKeys.messages(conversationId))
        invalidateCache.conversations('*')

        toast.success('对话已删除')
      }
    }
  )
}
```

### 6. 乐观更新

```typescript
function useToggleFavorite() {
  const [toggle, state] = useMutation(
    async (messageId: string) => {
      // 先更新 UI
      const currentFavorites = queryCache.get<Set<string>>('favorites') || new Set()
      const newFavorites = new Set(currentFavorites)

      if (newFavorites.has(messageId)) {
        newFavorites.delete(messageId)
      } else {
        newFavorites.add(messageId)
      }

      // 乐观更新缓存
      queryCache.set('favorites', newFavorites)

      try {
        // 发送请求
        return await toggleMessageFavorite(messageId)
      } catch (error) {
        // 失败时回滚
        queryCache.set('favorites', currentFavorites)
        throw error
      }
    },
    {
      onError: () => {
        toast.error('操作失败')
      }
    }
  )

  return [toggle, state]
}
```

### 7. 分页查询

```typescript
function useInfiniteMessages(conversationId: string) {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, isFetching, refetch } = useQuery(
    async () => {
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}&page=${page}&limit=${pageSize}`
      )
      return response.json()
    },
    {
      cacheKey: createCacheKey('messages', conversationId, page),
      cacheTTL: 10 * 60 * 1000,
    }
  )

  const loadMore = () => setPage(p => p + 1)

  return { data, isLoading, isFetching, loadMore, refetch }
}
```

## 🔄 缓存失效策略

### 全局失效

```typescript
import { invalidateCache } from '@/lib/cache/query-cache'

// 用户登出时清空所有缓存
function handleLogout() {
  invalidateCache.all()
  // 或只清空用户相关缓存
  invalidateCache.user(userId)
  invalidateCache.conversations(userId)
}
```

### 基于事件的失效

```typescript
// 新消息到达时失效消息缓存
socket.on('new_message', (data) => {
  invalidateCache.messages(data.conversationId)
  invalidateCache.conversation(data.conversationId)
})

// 对话更新时失效缓存
socket.on('conversation_updated', (conversationId) => {
  invalidateCache.conversation(conversationId)
  invalidateCache.conversations('*')
})
```

### 定时失效

```typescript
// 每30秒刷新一次统计数据
useEffect(() => {
  const interval = setInterval(() => {
    invalidateCache.stats(userId)
    refetch()
  }, 30 * 1000)

  return () => clearInterval(interval)
}, [userId, refetch])
```

## ⚙️ 性能优化

### 1. 缓存预热

```typescript
// 应用启动时预加载常用数据
useEffect(() => {
  if (user) {
    // 预加载对话列表
    queryCache.set(
      CacheKeys.conversations(user.id),
      await getUserConversations(user.id)
    )

    // 预加载技能列表
    queryCache.set(
      CacheKeys.skills(),
      await getSkills()
    )
  }
}, [user])
```

### 2. 缓存分层

```typescript
// 不同类型的数据使用不同的 TTL
const shortTermCache = new MemoryCache({ ttl: 1 * 60 * 1000 })   // 1 分钟
const mediumTermCache = new MemoryCache({ ttl: 5 * 60 * 1000 })  // 5 分钟
const longTermCache = new MemoryCache({ ttl: 30 * 60 * 1000 })   // 30 分钟

// 实时数据用短期缓存
shortTermCache.set('online_users', onlineUsers)

// 列表数据用中期缓存
mediumTermCache.set('conversations', conversations)

// 配置数据用长期缓存
longTermCache.set('skills', skills)
```

### 3. 批量操作

```typescript
// 批量删除缓存
function invalidateMultiple(keys: string[]) {
  keys.forEach(key => queryCache.delete(key))
}

// 批量预加载
async function prefetchMultiple(queries: Array<{ key: string; fn: () => Promise<unknown> }>) {
  await Promise.all(
    queries.map(async ({ key, fn }) => {
      const data = await fn()
      queryCache.set(key, data)
    })
  )
}
```

## 📊 监控和调试

### 查看缓存状态

```typescript
// 开发环境下查看缓存统计
if (process.env.NODE_ENV === 'development') {
  console.log('Query cache stats:', queryCache.stats())
  console.log('Global cache stats:', globalCache.stats())
}
```

### 缓存命中率追踪

```typescript
let hits = 0
let misses = 0

// 在 MemoryCache.get 中添加追踪
// if (entry) hits++ else misses++

console.log(`Cache hit rate: ${(hits / (hits + misses) * 100).toFixed(2)}%`)
```

## 📚 相关文档

- [React Query](https://tanstack.com/query/latest) - 参考灵感
- [SWR](https://swr.vercel.app/) - 另一个查询库
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) - 浏览器缓存 API
