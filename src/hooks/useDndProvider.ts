/**
 * Optimized DnD Provider Hook
 * 
 * Provides a performance-optimized React DnD provider with automatic backend 
 * switching between HTML5 and Touch backends based on device capabilities.
 * Includes proper memory management and prevents unnecessary re-renders.
 */

import { useMemo } from 'react'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { isTouchDevice } from '@/lib/utils'

interface DndProviderConfig {
  enableMouseEvents?: boolean
  delayTouchStart?: number
  delayMouseStart?: number
  touchSlop?: number
  enableHoverOutsideTarget?: boolean
  enableKeyboardEvents?: boolean
}

interface UseDndProviderResult {
  backend: any
  options: any
  isTouchBackend: boolean
}

/**
 * Custom hook for optimized DnD provider configuration
 */
export function useDndProvider(config: DndProviderConfig = {}): UseDndProviderResult {
  const {
    enableMouseEvents = true,
    delayTouchStart = 200,
    delayMouseStart = 0,
    touchSlop = 5,
    enableHoverOutsideTarget = true,
    enableKeyboardEvents = true
  } = config

  // Memoize backend selection to prevent unnecessary re-renders
  const backend = useMemo(() => {
    return isTouchDevice() ? TouchBackend : HTML5Backend
  }, [])

  // Memoize options configuration based on backend type
  const options = useMemo(() => {
    if (backend === TouchBackend) {
      return {
        enableMouseEvents,
        delayTouchStart,
        delayMouseStart,
        touchSlop,
        enableHoverOutsideTarget,
        enableKeyboardEvents,
        // Touch-specific optimizations
        ignoreContextMenu: true,
        enableTouchEvents: true,
        // Prevent scrolling during drag on mobile
        preventDefault: true,
        // Improve performance on mobile
        throttleMotionEvents: true
      }
    } else {
      return {
        enableKeyboardEvents,
        enableHoverOutsideTarget,
        // HTML5-specific optimizations
        captureDraggingState: true
      }
    }
  }, [
    backend, 
    enableMouseEvents, 
    delayTouchStart, 
    delayMouseStart, 
    touchSlop, 
    enableHoverOutsideTarget,
    enableKeyboardEvents
  ])

  const isTouchBackend = useMemo(() => backend === TouchBackend, [backend])

  return {
    backend,
    options,
    isTouchBackend
  }
}

/**
 * Hook for creating optimized drag spec with proper dependencies
 */
export function useOptimizedDragSpec<T>(
  item: T,
  dependencies: readonly any[] = [],
  canDrag: () => boolean = () => true,
  onDragStart?: () => void,
  onDragEnd?: () => void
) {
  return useMemo(() => ({
    type: 'ACTIVITY',
    item: () => {
      onDragStart?.()
      return item
    },
    canDrag,
    end: () => {
      onDragEnd?.()
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  }), dependencies)
}

/**
 * Hook for creating optimized drop spec with proper dependencies  
 */
export function useOptimizedDropSpec<T>(
  accept: string | symbol | (string | symbol)[],
  onDrop: (item: T) => void | Promise<void>,
  dependencies: readonly any[] = [],
  canDrop?: (item: T) => boolean,
  onHover?: (item: T) => void
) {
  return useMemo(() => ({
    accept,
    drop: async (item: T) => {
      await onDrop(item)
    },
    canDrop,
    hover: onHover,
    collect: (monitor: any) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  }), dependencies)
}

/**
 * Performance optimization utilities for DnD
 */
export const DndPerformanceUtils = {
  /**
   * Throttles drag operations to prevent excessive updates
   */
  throttleDragOperation: <T extends (...args: any[]) => any>(
    func: T,
    limit: number = 16 // ~60fps
  ): T => {
    let inThrottle = false
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  },

  /**
   * Debounces drop operations to prevent rapid fire drops
   */
  debounceDropOperation: <T extends (...args: any[]) => any>(
    func: T,
    delay: number = 100
  ): T => {
    let timeoutId: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }) as T
  },

  /**
   * Creates a memoized drag preview component
   */
  createMemoizedDragPreview: <T>(
    PreviewComponent: React.ComponentType<T>,
    dependencies: readonly any[] = []
  ) => {
    return useMemo(() => PreviewComponent, dependencies)
  }
}