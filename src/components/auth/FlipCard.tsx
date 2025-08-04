'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface FlipCardProps {
  frontContent: React.ReactNode
  backContent: React.ReactNode
  isFlipped: boolean
  flipDuration?: number
  className?: string
  onFlipComplete?: (isFlipped: boolean) => void
}

export function FlipCard({ 
  frontContent, 
  backContent, 
  isFlipped, 
  flipDuration = 600,
  className,
  onFlipComplete
}: FlipCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleFlipComplete = useCallback(() => {
    setIsAnimating(false)
    onFlipComplete?.(isFlipped)
  }, [isFlipped, onFlipComplete])

  useEffect(() => {
    setIsAnimating(true)
    
    // Complete animation callback
    const completeTimer = setTimeout(handleFlipComplete, flipDuration)

    return () => {
      clearTimeout(completeTimer)
    }
  }, [isFlipped, flipDuration, handleFlipComplete])

  return (
    <div 
      className={cn(
        "relative w-full h-full",
        className
      )}
      style={{
        '--flip-duration': `${flipDuration}ms`,
        perspective: '1000px',
        WebkitPerspective: '1000px',
      } as React.CSSProperties}
    >
      {/* Flip container with proper 3D transforms */}
      <div
        className={cn(
          "relative w-full h-full transition-transform ease-in-out",
          isFlipped ? "" : ""
        )}
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transitionDuration: `${flipDuration}ms`,
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face - always visible when not flipped */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {frontContent}
        </div>

        {/* Back face - rotated 180deg and visible when flipped */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            WebkitTransform: 'rotateY(180deg)',
          }}
        >
          {backContent}
        </div>
      </div>

      {/* Reduced animation overlay for better performance */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-lg z-10 pointer-events-none opacity-30">
        </div>
      )}
    </div>
  )
}

interface FlipCardSideProps {
  children: React.ReactNode
  className?: string
}

export function FlipCardFront({ children, className }: FlipCardSideProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      {children}
    </div>
  )
}

export function FlipCardBack({ children, className }: FlipCardSideProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      {children}
    </div>
  )
}