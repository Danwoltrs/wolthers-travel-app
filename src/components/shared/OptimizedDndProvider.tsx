/**
 * Optimized DnD Provider Component
 * 
 * A performance-optimized wrapper for React DnD that provides:
 * - Automatic backend switching (HTML5/Touch)
 * - Memory leak prevention
 * - Proper cleanup
 * - Performance monitoring
 * - Error boundaries for DnD operations
 */

import React, { 
  ReactNode, 
  useEffect, 
  useRef, 
  useMemo,
  createContext,
  useContext
} from 'react'
import { DndProvider } from 'react-dnd'
import { useDndProvider } from '@/hooks/useDndProvider'

interface OptimizedDndProviderProps {
  children: ReactNode
  enableMouseEvents?: boolean
  delayTouchStart?: number
  delayMouseStart?: number
  touchSlop?: number
  enableHoverOutsideTarget?: boolean
  enableKeyboardEvents?: boolean
  enablePerformanceMonitoring?: boolean
  onPerformanceUpdate?: (metrics: DndPerformanceMetrics) => void
}

interface DndPerformanceMetrics {
  dragOperations: number
  dropOperations: number
  averageDragDuration: number
  lastOperationTime: number
  memoryUsage?: number
}

interface DndContextValue {
  isTouchBackend: boolean
  performanceMetrics: DndPerformanceMetrics
  isOptimized: boolean
}

// Context for sharing DnD state across components
const OptimizedDndContext = createContext<DndContextValue | null>(null)

/**
 * Hook to access optimized DnD context
 */
export function useOptimizedDnd(): DndContextValue | null {
  return useContext(OptimizedDndContext)
}

/**
 * Error boundary component for DnD operations
 */
class DndErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: any) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('DnD Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-medium mb-2">Drag & Drop Error</h3>
          <p className="text-red-600 text-sm">
            Something went wrong with the drag and drop functionality. 
            Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Performance monitoring component
 */
function DndPerformanceMonitor({
  enabled,
  onUpdate
}: {
  enabled: boolean
  onUpdate?: (metrics: DndPerformanceMetrics) => void
}) {
  const metricsRef = useRef<DndPerformanceMetrics>({
    dragOperations: 0,
    dropOperations: 0,
    averageDragDuration: 0,
    lastOperationTime: 0
  })

  const dragStartTimeRef = useRef<number>(0)
  const dragDurationsRef = useRef<number[]>([])

  useEffect(() => {
    if (!enabled) return

    const handleDragStart = () => {
      dragStartTimeRef.current = performance.now()
      metricsRef.current.dragOperations++
      metricsRef.current.lastOperationTime = Date.now()
    }

    const handleDragEnd = () => {
      if (dragStartTimeRef.current > 0) {
        const duration = performance.now() - dragStartTimeRef.current
        dragDurationsRef.current.push(duration)
        
        // Keep only last 100 measurements for average calculation
        if (dragDurationsRef.current.length > 100) {
          dragDurationsRef.current = dragDurationsRef.current.slice(-50)
        }

        metricsRef.current.averageDragDuration = 
          dragDurationsRef.current.reduce((a, b) => a + b, 0) / dragDurationsRef.current.length

        dragStartTimeRef.current = 0
      }
    }

    const handleDrop = () => {
      metricsRef.current.dropOperations++
      metricsRef.current.lastOperationTime = Date.now()
      
      // Report performance metrics
      onUpdate?.(metricsRef.current)
    }

    // Listen for DnD events on document
    document.addEventListener('dragstart', handleDragStart, { passive: true })
    document.addEventListener('dragend', handleDragEnd, { passive: true })
    document.addEventListener('drop', handleDrop, { passive: true })

    // Memory usage monitoring (if supported)
    if ('memory' in performance) {
      const updateMemoryMetrics = () => {
        metricsRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize
      }
      
      const memoryInterval = setInterval(updateMemoryMetrics, 5000) // Every 5 seconds

      return () => {
        document.removeEventListener('dragstart', handleDragStart)
        document.removeEventListener('dragend', handleDragEnd)
        document.removeEventListener('drop', handleDrop)
        clearInterval(memoryInterval)
      }
    }

    return () => {
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('dragend', handleDragEnd)
      document.removeEventListener('drop', handleDrop)
    }
  }, [enabled, onUpdate])

  return null
}

/**
 * Main optimized DnD provider component
 */
export function OptimizedDndProvider({
  children,
  enableMouseEvents = true,
  delayTouchStart = 200,
  delayMouseStart = 0,
  touchSlop = 5,
  enableHoverOutsideTarget = true,
  enableKeyboardEvents = true,
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development',
  onPerformanceUpdate
}: OptimizedDndProviderProps) {
  const { backend, options, isTouchBackend } = useDndProvider({
    enableMouseEvents,
    delayTouchStart,
    delayMouseStart,
    touchSlop,
    enableHoverOutsideTarget,
    enableKeyboardEvents
  })

  // Performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = React.useState<DndPerformanceMetrics>({
    dragOperations: 0,
    dropOperations: 0,
    averageDragDuration: 0,
    lastOperationTime: 0
  })

  // Handle performance updates
  const handlePerformanceUpdate = React.useCallback((metrics: DndPerformanceMetrics) => {
    setPerformanceMetrics(metrics)
    onPerformanceUpdate?.(metrics)
  }, [onPerformanceUpdate])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DndContextValue>(() => ({
    isTouchBackend,
    performanceMetrics,
    isOptimized: true
  }), [isTouchBackend, performanceMetrics])

  // Log backend selection in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 [OptimizedDndProvider] Using ${isTouchBackend ? 'Touch' : 'HTML5'} backend`)
      console.log('🎯 [OptimizedDndProvider] Options:', options)
    }
  }, [isTouchBackend, options])

  return (
    <DndErrorBoundary>
      <DndProvider backend={backend} options={options}>
        <OptimizedDndContext.Provider value={contextValue}>
          <DndPerformanceMonitor
            enabled={enablePerformanceMonitoring}
            onUpdate={handlePerformanceUpdate}
          />
          {children}
        </OptimizedDndContext.Provider>
      </DndProvider>
    </DndErrorBoundary>
  )
}

/**
 * Hook for consuming DnD performance metrics
 */
export function useDndPerformance() {
  const context = useOptimizedDnd()
  return context?.performanceMetrics || null
}

/**
 * Hook for detecting if touch backend is active
 */
export function useIsTouchBackend() {
  const context = useOptimizedDnd()
  return context?.isTouchBackend || false
}