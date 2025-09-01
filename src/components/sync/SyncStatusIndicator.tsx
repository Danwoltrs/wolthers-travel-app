/**
 * Sync Status Indicator Component
 * 
 * Displays the current synchronization status and provides user controls
 * for managing background sync operations.
 */

'use client'

import React, { useState } from 'react'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react'
import { useBackgroundSync, useSyncStatus, formatSyncTime, getSyncStatusDescription } from '@/hooks/useBackgroundSync'

interface SyncStatusIndicatorProps {
  className?: string
  showDetails?: boolean
  showControls?: boolean
}

export function SyncStatusIndicator({ 
  className = '', 
  showDetails = false,
  showControls = false
}: SyncStatusIndicatorProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { state, actions } = useBackgroundSync({
    onSyncComplete: (successful, failed) => {
      if (failed > 0) {
        console.warn(`Sync completed with ${failed} failures`)
      }
    },
    onConflictDetected: (conflict) => {
      console.warn('Sync conflict detected:', conflict)
    },
    onSyncError: (error) => {
      console.error('Sync error:', error)
    }
  })

  const statusIcon = () => {
    if (!state.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />
    }
    
    if (state.syncInProgress) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    }
    
    if (state.hasErrors) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />
    }
    
    if (state.queueSize > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    
    return <CheckCircle2 className="w-4 h-4 text-green-500" />
  }

  const statusColor = () => {
    if (!state.isOnline) return 'text-red-500 bg-red-50'
    if (state.syncInProgress) return 'text-blue-500 bg-blue-50'
    if (state.hasErrors) return 'text-orange-500 bg-orange-50'
    if (state.queueSize > 0) return 'text-yellow-500 bg-yellow-50'
    return 'text-green-500 bg-green-50'
  }

  const handleForceSync = async () => {
    try {
      await actions.forceSync()
      setShowMenu(false)
    } catch (error) {
      console.error('Force sync failed:', error)
    }
  }

  const handleClearQueue = async () => {
    try {
      await actions.clearQueue()
      setShowMenu(false)
    } catch (error) {
      console.error('Clear queue failed:', error)
    }
  }

  const handleRetryFailed = async () => {
    try {
      await actions.retryFailedOperations()
      setShowMenu(false)
    } catch (error) {
      console.error('Retry failed operations failed:', error)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Status Indicator */}
      <div 
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${statusColor()}`}
        onClick={() => showControls && setShowMenu(!showMenu)}
      >
        {statusIcon()}
        
        {showDetails && (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {getSyncStatusDescription(state)}
            </span>
            {state.lastSync && (
              <span className="text-xs opacity-75">
                Last sync: {formatSyncTime(state.lastSync)}
              </span>
            )}
          </div>
        )}

        {!showDetails && (
          <span className="text-sm font-medium">
            {getSyncStatusDescription(state).split(' - ')[0]}
          </span>
        )}

        {showControls && (
          <Settings className="w-4 h-4 opacity-50" />
        )}
      </div>

      {/* Controls Menu */}
      {showControls && showMenu && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Status Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Network Status:</span>
                <span className={state.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {state.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Queue Size:</span>
                <span>{state.queueSize}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Failed Operations:</span>
                <span className={state.failedOperations > 0 ? 'text-red-600' : 'text-gray-600'}>
                  {state.failedOperations}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Successful Operations:</span>
                <span className="text-green-600">{state.successfulOperations}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Conflicts Resolved:</span>
                <span className="text-yellow-600">{state.conflictsResolved}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleForceSync}
                disabled={!state.isOnline || state.syncInProgress}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${state.syncInProgress ? 'animate-spin' : ''}`} />
                <span>Force Sync</span>
              </button>
              
              {state.hasErrors && (
                <button
                  onClick={handleRetryFailed}
                  disabled={!state.isOnline || state.syncInProgress}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Retry Failed</span>
                </button>
              )}
              
              {state.queueSize > 0 && (
                <button
                  onClick={handleClearQueue}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Clear Queue</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple sync status indicator for minimal UI
 */
export function MiniSyncIndicator({ className = '' }: { className?: string }) {
  const status = useSyncStatus()

  const icon = () => {
    if (!status.isOnline) return <WifiOff className="w-3 h-3 text-red-500" />
    if (status.isSyncing) return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
    if (status.hasErrors) return <AlertTriangle className="w-3 h-3 text-orange-500" />
    if (status.hasQueuedOperations) return <Clock className="w-3 h-3 text-yellow-500" />
    return <CheckCircle2 className="w-3 h-3 text-green-500" />
  }

  return (
    <div className={`flex items-center ${className}`}>
      {icon()}
      {status.queueSize > 0 && (
        <span className="ml-1 text-xs text-gray-500">
          {status.queueSize}
        </span>
      )}
    </div>
  )
}

/**
 * Sync status banner for important notifications
 */
export function SyncStatusBanner({ className = '' }: { className?: string }) {
  const { state } = useBackgroundSync()

  // Only show banner for important states
  if (state.isOnline && !state.hasErrors && state.queueSize === 0) {
    return null
  }

  const bannerStyle = () => {
    if (!state.isOnline) return 'bg-red-100 border-red-200 text-red-800'
    if (state.hasErrors) return 'bg-orange-100 border-orange-200 text-orange-800'
    return 'bg-yellow-100 border-yellow-200 text-yellow-800'
  }

  return (
    <div className={`border rounded-lg p-3 ${bannerStyle()} ${className}`}>
      <div className="flex items-center space-x-2">
        {!state.isOnline && <WifiOff className="w-4 h-4" />}
        {state.hasErrors && <AlertTriangle className="w-4 h-4" />}
        {state.queueSize > 0 && !state.hasErrors && <Clock className="w-4 h-4" />}
        
        <span className="text-sm font-medium">
          {getSyncStatusDescription(state)}
        </span>
      </div>
    </div>
  )
}