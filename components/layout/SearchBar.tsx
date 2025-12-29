"use client"

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = "搜索...", className }: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-12 pl-12 pr-12 rounded-full",
            "bg-muted/50 backdrop-blur-sm",
            "border border-border/50 focus:border-primary",
            "outline-none transition-all duration-200",
            "placeholder:text-muted-foreground",
            "text-foreground"
          )}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 h-8 w-8 rounded-full"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">清除搜索</span>
          </Button>
        )}
      </div>
    </div>
  )
}