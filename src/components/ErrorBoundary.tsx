'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { RefreshCw, AlertTriangle, Bug, Database, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: 'cache' | 'sync' | 'api' | 'ui' | 'general'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

/**
 * Enhanced Error Boundary with cache and sync system awareness
 * Provides context-specific error handling and recovery strategies
 */
export default class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // In production, could send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Reset error state if children change (new props)
    if (prevState.hasError && this.props.children !== prevProps.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0
      })
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Could integrate with error reporting service like Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('Production Error Report:', errorReport)
  }

  private handleRetry = () => {
    const { retryCount } = this.state
    const maxRetries = 3

    if (retryCount >= maxRetries) {
      // Redirect to a safe page or show persistent error
      window.location.href = '/dashboard'
      return
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  private handleAutoRetry = () => {
    // Auto-retry after delay for recoverable errors
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, 2000)
  }

  private handleRefreshPage = () => {
    window.location.reload()
  }

  private isRecoverableError = (error: Error): boolean => {
    const recoverablePatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /cache/i,
      /sync/i,
      /subscription/i,
      /supabase/i
    ]

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  private getErrorIcon = () => {
    const { error } = this.state
    const { context } = this.props

    if (!error) return <AlertTriangle className="w-8 h-8 text-red-500" />

    // Context-specific icons
    switch (context) {
      case 'cache':
        return <Database className="w-8 h-8 text-blue-500" />
      case 'sync':
        return navigator.onLine ? 
          <Wifi className="w-8 h-8 text-green-500" /> : 
          <WifiOff className="w-8 h-8 text-red-500" />
      case 'api':
        return <RefreshCw className="w-8 h-8 text-orange-500" />
      default:
        return <Bug className="w-8 h-8 text-red-500" />
    }
  }

  private getErrorMessage = (): { title: string; description: string } => {
    const { error } = this.state
    const { context } = this.props

    if (!error) {
      return {
        title: 'Something went wrong',
        description: 'An unexpected error occurred.'
      }
    }

    // Context-specific error messages
    switch (context) {
      case 'cache':
        return {
          title: 'Cache System Error',
          description: 'There was a problem with the caching system. Your data may not be up to date.'
        }
      case 'sync':
        return {
          title: 'Synchronization Error', 
          description: 'Failed to sync data with the server. Your changes may not be saved.'
        }
      case 'api':
        return {
          title: 'API Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection.'
        }
      default:
        // Generic error message
        if (error.message.includes('ChunkLoadError')) {
          return {
            title: 'Application Update Available',
            description: 'The application has been updated. Please refresh the page.'
          }
        }
        
        return {
          title: 'Application Error',
          description: error.message || 'An unexpected error occurred.'
        }
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error } = this.state
      const { title, description } = this.getErrorMessage()
      const isRecoverable = error && this.isRecoverableError(error)
      const canRetry = this.state.retryCount < 3

      return (
        <div className="min-h-screen bg-beige-100 dark:bg-[#212121] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex flex-col items-center text-center">
              {/* Error Icon */}
              <div className="mb-4">
                {this.getErrorIcon()}
              </div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {title}
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {description}
              </p>

              {/* Network Status */}
              {!navigator.onLine && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 w-full">
                  <div className="flex items-center space-x-2">
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      You're currently offline
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Retry Button */}
                {isRecoverable && canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Try Again ({3 - this.state.retryCount} left)
                  </button>
                )}

                {/* Refresh Page Button */}
                <button
                  onClick={this.handleRefreshPage}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Refresh Page
                </button>
              </div>

              {/* Auto-retry notification */}
              {isRecoverable && canRetry && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Auto-retry in 2 seconds...
                </p>
              )}

              {/* Technical Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-6 w-full">
                  <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-[#2a2a2a] rounded text-xs font-mono text-left overflow-auto max-h-32">
                    <div className="text-red-600 dark:text-red-400 font-bold">
                      {error.name}: {error.message}
                    </div>
                    {error.stack && (
                      <pre className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithErrorBoundaryComponent
}

/**
 * Specialized error boundaries for different contexts
 */

export const CacheErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="cache"
    onError={(error, errorInfo) => {
      console.error('Cache system error:', error, errorInfo)
      // Could clear cache here if needed
    }}
  >
    {children}
  </ErrorBoundary>
)

export const SyncErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="sync"
    onError={(error, errorInfo) => {
      console.error('Sync system error:', error, errorInfo)
      // Could pause sync or clear queue here if needed
    }}
  >
    {children}
  </ErrorBoundary>
)

export const ApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="api"
    onError={(error, errorInfo) => {
      console.error('API error:', error, errorInfo)
      // Could implement API retry logic here
    }}
  >
    {children}
  </ErrorBoundary>
)