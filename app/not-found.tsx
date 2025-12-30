import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="text-6xl font-heading font-bold text-foreground mb-2">
          404
        </h1>

        <h2 className="text-xl font-medium text-foreground mb-2">
          页面未找到
        </h2>

        <p className="text-muted-foreground mb-8">
          抱歉，您访问的页面不存在或已被移除。
        </p>

        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg h-10 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
