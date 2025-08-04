'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedOutlinedBlockProps {
  children: React.ReactNode
  className?: string
  borderWidth?: number
  animationDuration?: number
  glowEffect?: boolean
}

export function AnimatedOutlinedBlock({ 
  children, 
  className,
  borderWidth = 2,
  animationDuration = 4,
  glowEffect = true
}: AnimatedOutlinedBlockProps) {
  return (
    <div 
      className={cn(
        "relative group overflow-hidden rounded-2xl",
        className
      )}
    >
      {/* Animated gradient border */}
      <div 
        className="absolute inset-0 rounded-2xl animate-spin"
        style={{
          background: `conic-gradient(from 0deg, #10b981, #f59e0b, #059669, #d97706, #047857, #b45309, #10b981)`,
          padding: `${borderWidth}px`,
          animationDuration: `${animationDuration}s`,
        }}
      >
        <div className="w-full h-full rounded-2xl bg-white/80 dark:bg-[#0E3D2F]/80"></div>
      </div>

      {/* Glow effect */}
      {glowEffect && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500 animate-spin"
          style={{
            background: `conic-gradient(from 0deg, #10b981, #f59e0b, #059669, #d97706, #047857, #b45309, #10b981)`,
            animationDuration: `${animationDuration}s`,
          }}
        />
      )}

      {/* Content container */}
      <div className="relative rounded-2xl bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-800/40">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/30 to-amber-50/30 dark:from-[#0E3D2F]/60 dark:via-[#041611]/40 dark:to-[#1a1a1a]/60 rounded-2xl" />
        
        {/* Animated background patterns */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-amber-400/10 to-emerald-400/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative">
          {children}
        </div>

        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
      </div>
    </div>
  )
}