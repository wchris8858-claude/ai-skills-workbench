'use client'

import { useState } from 'react'
import { cn } from '@/utils'

interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            'px-4 py-2 rounded-full whitespace-nowrap font-medium',
            'transition-all duration-200',
            activeCategory === category
              ? 'bg-foreground text-background'
              : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

<style jsx>{`
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`}</style>