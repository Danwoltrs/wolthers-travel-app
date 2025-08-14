/**
 * Enhanced Modal Hook
 * 
 * Provides comprehensive state management for the enhanced Quick View modal.
 * Handles form data, validation, auto-save, conflict resolution, and tab navigation.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { 
  EnhancedModalState, 
  EnhancedModalTab,
  ModalEditingMode,
  SaveStatus,
  TabValidationState,
  EnhancedModalFormData
} from '@/types/enhanced-modal'
import type { TripCard } from '@/types'
import { 
  createTabValidationState, 
  createFieldValidationState,
  hasFormDataChanged,
  debounceValidation
} from '@/lib/enhanced-modal-utils'

interface UseEnhancedModalOptions {
  onSave?: (tripData: any) => Promise<void>
  autoSaveEnabled?: boolean
  autoSaveDelay?: number
  validationEnabled?: boolean
}

export function useEnhancedModal(
  trip: TripCard, 
  options: UseEnhancedModalOptions = {}
) {
  const {
    onSave,
    autoSaveEnabled = true,
    autoSaveDelay = 2000,
    validationEnabled = true
  } = options

  // Enhanced modal state
  const [modalState, setModalState] = useState<EnhancedModalState>(() => ({
    activeTab: 'overview',
    editingMode: 'view',
    hasUnsavedChanges: false,
    autoSaveEnabled,
    lastSaved: null,
    saveStatus: {
      isSaving: false,
      status: 'idle',
      error: null
    },
    validationState: {
      overview: createTabValidationState(),
      schedule: createTabValidationState(),
      participants: createTabValidationState(),
      logistics: createTabValidationState(),
      documents: createTabValidationState(),
      expenses: createTabValidationState()
    },
    loadingState: {
      overview: false,
      schedule: false,
      participants: false,
      logistics: false,
      documents: false,
      expenses: false
    },
    errorState: {
      overview: null,
      schedule: null,
      participants: null,
      logistics: null,
      documents: null,
      expenses: null
    }
  }))

  // Form data state
  const [formData, setFormData] = useState<EnhancedModalFormData>(() => ({
    trip: {
      title: trip.title,
      description: trip.subject,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status
    },
    schedule: {
      originalStartDate: trip.startDate,
      originalEndDate: trip.endDate,
      startDate: trip.startDate,
      endDate: trip.endDate,
      itineraryDays: [],
      dragDropState: {
        draggedActivity: null,
        dropTarget: null,
        isDragging: false,
        dragPreview: null
      },
      calendarView: {
        viewType: 'day',
        timeSlotDuration: 30,
        startHour: 8,
        endHour: 18,
        showWeekends: false
      }
    },
    participants: {
      wolthersStaff: [],
      companyParticipants: [],
      externalGuests: [],
      availabilityCheck: {
        isChecking: false,
        lastChecked: null,
        results: {},
        errors: {}
      },
      roleAssignments: {
        availableRoles: [],
        assignments: {},
        requirements: []
      }
    },
    logistics: {
      vehicleAssignments: [],
      driverAssignments: [],
      equipment: [],
      accommodations: [],
      transportation: {
        legs: [],
        totalDistance: 0,
        totalDuration: 0,
        preferences: {
          preferredMode: 'driving',
          maxDrivingTimePerDay: 480,
          restStopRequirements: true,
          fuelEfficiencyPriority: false
        }
      }
    },
    metadata: {}
  }))

  const [originalFormData] = useState(formData)
  
  // Refs for debounced operations
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const validationTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Computed values
  const hasUnsavedChanges = hasFormDataChanged(originalFormData, formData)
  const validationErrors = Object.values(modalState.validationState)
    .some(state => !state.isValid)
  const isAutoSaving = modalState.saveStatus.isSaving && 
    modalState.saveStatus.status === 'saving'

  // Update modal state helper
  const updateModalState = useCallback((updates: Partial<EnhancedModalState>) => {
    setModalState(prev => ({ ...prev, ...updates }))
  }, [])

  // Tab navigation
  const setActiveTab = useCallback((tab: EnhancedModalTab) => {
    updateModalState({ activeTab: tab })
  }, [updateModalState])

  // Editing mode
  const setEditingMode = useCallback((mode: ModalEditingMode) => {
    updateModalState({ editingMode: mode })
  }, [updateModalState])

  // Form data updates
  const updateFormData = useCallback((
    tab: EnhancedModalTab, 
    updates: Partial<EnhancedModalFormData>
  ) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))

    // Update unsaved changes state
    updateModalState({ hasUnsavedChanges: true })

    // Trigger validation if enabled
    if (validationEnabled) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
      validationTimeoutRef.current = setTimeout(() => {
        validateTab(tab, updates)
      }, 300)
    }

    // Trigger auto-save if enabled
    if (autoSaveEnabled && modalState.editingMode === 'edit') {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave(tab, updates)
      }, autoSaveDelay)
    }
  }, [modalState.editingMode, validationEnabled, autoSaveEnabled, autoSaveDelay, updateModalState])

  // Validation
  const validateTab = useCallback(async (
    tab: EnhancedModalTab, 
    data: Partial<EnhancedModalFormData>
  ) => {
    // Set loading state
    updateModalState({
      loadingState: {
        ...modalState.loadingState,
        [tab]: true
      }
    })

    try {
      // Perform validation (this would integrate with validation utils)
      // For now, we'll simulate validation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const validationResult = createTabValidationState()
      
      // Update validation state
      updateModalState({
        validationState: {
          ...modalState.validationState,
          [tab]: validationResult
        },
        loadingState: {
          ...modalState.loadingState,
          [tab]: false
        }
      })
    } catch (error) {
      updateModalState({
        errorState: {
          ...modalState.errorState,
          [tab]: error instanceof Error ? error.message : 'Validation failed'
        },
        loadingState: {
          ...modalState.loadingState,
          [tab]: false
        }
      })
    }
  }, [modalState, updateModalState])

  // Auto-save functionality
  const performAutoSave = useCallback(async (
    tab: EnhancedModalTab,
    updates: Partial<EnhancedModalFormData>
  ) => {
    if (!onSave || modalState.saveStatus.isSaving) return

    updateModalState({
      saveStatus: {
        isSaving: true,
        status: 'saving',
        error: null
      }
    })

    try {
      await onSave(formData)
      
      updateModalState({
        saveStatus: {
          isSaving: false,
          status: 'success',
          error: null
        },
        lastSaved: new Date(),
        hasUnsavedChanges: false
      })
    } catch (error) {
      updateModalState({
        saveStatus: {
          isSaving: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Save failed'
        }
      })
    }
  }, [onSave, formData, modalState.saveStatus.isSaving, updateModalState])

  // Manual save
  const saveFormData = useCallback(async () => {
    if (!onSave || modalState.saveStatus.isSaving) return

    updateModalState({
      saveStatus: {
        isSaving: true,
        status: 'saving',
        error: null
      }
    })

    try {
      await onSave(formData)
      
      updateModalState({
        saveStatus: {
          isSaving: false,
          status: 'success',
          error: null
        },
        lastSaved: new Date(),
        hasUnsavedChanges: false
      })
    } catch (error) {
      updateModalState({
        saveStatus: {
          isSaving: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Save failed'
        }
      })
    }
  }, [onSave, formData, modalState.saveStatus.isSaving, updateModalState])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  return {
    modalState,
    formData,
    setActiveTab,
    setEditingMode,
    updateFormData,
    saveFormData,
    validateTab,
    hasUnsavedChanges,
    validationErrors,
    isAutoSaving
  }
}