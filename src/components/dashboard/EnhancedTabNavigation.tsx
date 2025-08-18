/**
 * Enhanced Tab Navigation Component
 * 
 * Provides navigation between enhanced modal tabs with validation status indicators
 * and save status feedback. Follows the Nordic minimalist design system.
 */

import React from 'react'
import { 
  Key, 
  Calendar, 
  Users, 
  Car, 
  FileText, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import type { 
  EnhancedModalTab, 
  TabValidationState,
  SaveStatus 
} from '@/types/enhanced-modal'

interface EnhancedTabNavigationProps {
  activeTab: EnhancedModalTab
  onTabChange: (tab: EnhancedModalTab) => void
  validationState: Record<EnhancedModalTab, TabValidationState>
  saveStatus: SaveStatus
  className?: string
}

const TAB_DEFINITIONS = [
  { 
    id: 'overview' as const, 
    label: 'Overview', 
    icon: Key,
    description: 'Basic trip information'
  },
  { 
    id: 'schedule' as const, 
    label: 'Schedule', 
    icon: Calendar,
    description: 'Activities and timeline'
  },
  { 
    id: 'participants' as const, 
    label: 'Participants', 
    icon: Users,
    description: 'Staff and guests'
  },
  { 
    id: 'logistics' as const, 
    label: 'Logistics', 
    icon: Car,
    description: 'Transport and equipment'
  },
  { 
    id: 'documents' as const, 
    label: 'Documents', 
    icon: FileText,
    description: 'Files and attachments'
  },
  { 
    id: 'expenses' as const, 
    label: 'Expenses', 
    icon: DollarSign,
    description: 'Costs and budgets'
  }
]

export function EnhancedTabNavigation({
  activeTab,
  onTabChange,
  validationState,
  saveStatus,
  className = ''
}: EnhancedTabNavigationProps) {
  
  const getTabValidationStatus = (tabId: EnhancedModalTab) => {
    const state = validationState[tabId]
    if (!state) return 'unknown'
    
    if (!state.isValid) return 'error'
    if (Object.keys(state.warnings).length > 0) return 'warning'
    return 'valid'
  }

  const getValidationIcon = (status: string) => {
    switch (status) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-amber-500" />
      case 'valid':
        return <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      default:
        return null
    }
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {TAB_DEFINITIONS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const validationStatus = getTabValidationStatus(tab.id)
        const hasValidationIssues = validationStatus === 'error' || validationStatus === 'warning'
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              relative group
              ${
                isActive
                  ? 'bg-white dark:bg-emerald-800/80 text-[#333333] dark:text-golden-400 shadow-sm'
                  : `text-[#333333] dark:text-golden-400/70 hover:text-[#006D5B] hover:bg-white/10 
                     dark:hover:text-golden-400 dark:hover:bg-emerald-800/40
                     ${hasValidationIssues ? 'bg-red-500/10 dark:bg-red-900/20' : ''}`
              }
            `}
            title={tab.description}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            
            {/* Validation Status Indicator */}
            {hasValidationIssues && (
              <div className="absolute -top-1 -right-1">
                {getValidationIcon(validationStatus)}
              </div>
            )}
            
            {/* Save Status Indicator */}
            {saveStatus.isSaving && isActive && (
              <div className="absolute -top-1 -right-1">
                <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tab.description}
              {hasValidationIssues && (
                <div className="text-red-300">
                  {validationStatus === 'error' ? 'Has errors' : 'Has warnings'}
                </div>
              )}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </button>
        )
      })}
      
      {/* Global Save Status Indicator */}
      {saveStatus.error && (
        <div className="flex items-center space-x-2 px-3 py-2 text-xs text-red-400 bg-red-900/20 rounded-md">
          <AlertCircle className="w-3 h-3" />
          <span>Save failed</span>
        </div>
      )}
      
      {saveStatus.status === 'success' && (
        <div className="flex items-center space-x-2 px-3 py-2 text-xs text-emerald-400 bg-emerald-900/20 rounded-md">
          <CheckCircle2 className="w-3 h-3" />
          <span>Saved</span>
        </div>
      )}
    </div>
  )
}