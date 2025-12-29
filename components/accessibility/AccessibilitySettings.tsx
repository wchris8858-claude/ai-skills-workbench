'use client'

/**
 * Accessibility Settings Panel
 *
 * Allow users to customize accessibility preferences
 */

import { useAccessibility } from './AccessibilityProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Eye, Type, Contrast } from 'lucide-react'

export function AccessibilitySettings() {
  const { fontSize, setFontSize, reducedMotion, highContrast } =
    useAccessibility()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          无障碍设置
        </CardTitle>
        <CardDescription>
          自定义界面以提高可访问性和可读性
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Size */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            字体大小
          </Label>
          <RadioGroup value={fontSize} onValueChange={setFontSize}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal" className="font-normal cursor-pointer">
                正常
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="large" />
              <Label htmlFor="large" className="font-normal cursor-pointer">
                大 (推荐)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="x-large" id="x-large" />
              <Label htmlFor="x-large" className="font-normal cursor-pointer">
                超大
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* System Preferences Info */}
        <div className="space-y-2 rounded-lg border p-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Contrast className="h-4 w-4" />
            系统偏好设置
          </h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              减少动画:{' '}
              <span className="font-medium">
                {reducedMotion ? '已启用' : '未启用'}
              </span>
            </p>
            <p>
              高对比度:{' '}
              <span className="font-medium">
                {highContrast ? '已启用' : '未启用'}
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            这些设置由您的操作系统控制
          </p>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
          <h4 className="text-sm font-medium">键盘快捷键</h4>
          <div className="space-y-1 text-sm">
            <p>
              <kbd className="px-2 py-1 bg-background rounded border text-xs">
                Tab
              </kbd>{' '}
              - 导航到下一个元素
            </p>
            <p>
              <kbd className="px-2 py-1 bg-background rounded border text-xs">
                Shift + Tab
              </kbd>{' '}
              - 导航到上一个元素
            </p>
            <p>
              <kbd className="px-2 py-1 bg-background rounded border text-xs">
                Enter
              </kbd>{' '}
              - 激活选中的元素
            </p>
            <p>
              <kbd className="px-2 py-1 bg-background rounded border text-xs">
                Esc
              </kbd>{' '}
              - 关闭对话框或菜单
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
