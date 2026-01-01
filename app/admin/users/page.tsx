'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { User, UserRole } from '@/types'
import { useAuth, useIsAdmin } from '@/contexts/AuthContext'
import {
  Users,
  UserPlus,
  Loader2,
  Trash2,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface UserWithActions extends User {
  isEditing?: boolean
}

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: '管理员', icon: ShieldCheck, color: 'text-red-500' },
  member: { label: '成员', icon: Shield, color: 'text-blue-500' },
  viewer: { label: '访客', icon: Eye, color: 'text-gray-500' },
}

interface NewUserForm {
  email: string
  username: string
  password: string
  name: string
  role: UserRole
}

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const isAdmin = useIsAdmin()
  const { confirm, ConfirmDialog } = useConfirm()

  const [users, setUsers] = useState<UserWithActions[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState<NewUserForm>({
    email: '',
    username: '',
    password: '',
    name: '',
    role: 'member',
  })
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')

  // 权限检查
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login')
    } else if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [authLoading, currentUser, isAdmin, router])

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (response.ok && data.users) {
        setUsers(data.users)
        setApiError('')
      } else if (response.status === 401) {
        router.push('/login')
      } else if (response.status === 403) {
        router.push('/')
      } else {
        setApiError(data.error || '获取用户列表失败')
      }
    } catch (err) {
      logger.error('获取用户列表失败', err)
      setApiError('无法连接到服务器')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  // 创建用户
  const handleCreateUser = async () => {
    if (!newUser.username) {
      setError('请输入用户名')
      return
    }
    if (!newUser.email) {
      setError('请输入邮箱')
      return
    }
    if (!newUser.password) {
      setError('请输入密码')
      return
    }
    if (newUser.password.length < 6) {
      setError('密码至少6个字符')
      return
    }

    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '创建失败')
        return
      }

      // 添加到列表
      setUsers(prev => [data.user, ...prev])
      setCreateDialogOpen(false)
      setNewUser({ email: '', username: '', password: '', name: '', role: 'member' })
    } catch (err) {
      setError('创建用户失败')
    } finally {
      setCreating(false)
    }
  }

  // 更新用户角色
  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, role } : u))
        )
      }
    } catch (err) {
      logger.error('更新用户角色失败', err)
    }
  }

  // 更新用户状态
  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, isActive } : u))
        )
      }
    } catch (err) {
      logger.error('更新用户状态失败', err)
    }
  }

  // 重置密码
  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return
    if (newPassword.length < 6) {
      setError('密码至少6个字符')
      return
    }

    try {
      const response = await fetch(`/api/users/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        setPasswordDialogOpen(false)
        setNewPassword('')
        setSelectedUserId(null)
      }
    } catch (err) {
      logger.error('重置密码失败', err)
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    const confirmed = await confirm({
      title: '删除用户',
      description: '确定要删除此用户吗？此操作不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'destructive',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
      } else {
        alert(data.error || '删除失败')
      }
    } catch (err) {
      logger.error('删除用户失败', err)
    }
  }

  // 加载中或未授权
  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">用户管理</h1>
              <p className="text-sm text-muted-foreground">
                管理系统用户和权限
              </p>
            </div>
          </div>

          {/* 创建用户按钮 */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="valley-button valley-button-primary">
                <UserPlus className="mr-2 h-4 w-4" />
                创建用户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>创建新用户</DialogTitle>
                <DialogDescription>
                  输入用户信息创建新账户
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    placeholder="只能包含字母、数字和下划线"
                    value={newUser.username}
                    onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">密码 *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少6个字符"
                      value={newUser.password}
                      onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    placeholder="用户姓名（可选）"
                    value={newUser.name}
                    onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">角色</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="member">成员</SelectItem>
                      <SelectItem value="viewer">访客</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建用户'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 重置密码对话框 */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[350px]">
            <DialogHeader>
              <DialogTitle>重置密码</DialogTitle>
              <DialogDescription>
                为用户设置新密码
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="至少6个字符"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleResetPassword}>
                确认重置
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* API 错误提示 */}
        {apiError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">错误：{apiError}</p>
            {apiError.includes('SUPABASE') && (
              <p className="mt-2 text-xs text-muted-foreground">
                请在 .env.local 中配置 SUPABASE_SERVICE_ROLE_KEY 环境变量。
                可在 Supabase 控制台 → Settings → API 中找到 service_role 密钥。
              </p>
            )}
          </div>
        )}

        {/* 用户列表 */}
        <div className="valley-card-glow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : apiError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">无法加载用户列表</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setLoading(true)
                  fetchUsers()
                }}
              >
                重试
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">暂无用户</p>
              <p className="text-sm text-muted-foreground/70">点击上方按钮创建第一个用户</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const RoleIcon = roleConfig[user.role].icon
                  const isSelf = currentUser?.id === user.id
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                        {isSelf && (
                          <Badge variant="secondary" className="ml-2">
                            当前用户
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRole) => handleUpdateRole(user.id, value)}
                          disabled={isSelf}
                        >
                          <SelectTrigger className="w-[120px]">
                            <div className="flex items-center gap-2">
                              <RoleIcon className={cn('h-4 w-4', roleConfig[user.role].color)} />
                              <span>{roleConfig[user.role].label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-red-500" />
                                管理员
                              </div>
                            </SelectItem>
                            <SelectItem value="member">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                成员
                              </div>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-gray-500" />
                                访客
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => !isSelf && handleToggleActive(user.id, !user.isActive)}
                          disabled={isSelf}
                          className={cn(
                            'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors',
                            user.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200',
                            isSelf && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              正常
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              禁用
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedUserId(user.id)
                              setPasswordDialogOpen(true)
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isSelf}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
