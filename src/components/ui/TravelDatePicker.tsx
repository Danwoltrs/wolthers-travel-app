import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TravelDatePickerProps {
  startDate?: Date | null
  endDate?: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  autoFocus?: boolean
}

// Forward ref to expose focus method
export interface TravelDatePickerRef {
  focus: () => void
  openCalendar: () => void
}

const TravelDatePicker = React.forwardRef<TravelDatePickerRef, TravelDatePickerProps>(({
  startDate,
  endDate,
  onChange,
  placeholder = "Select travel dates",
  required = false,
  className,
  disabled = false,
  autoFocus = false
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [internalStartDate, setInternalStartDate] = useState<Date | null>(startDate || null)
  const [internalEndDate, setInternalEndDate] = useState<Date | null>(endDate || null)
  const [isSelectingStart, setIsSelectingStart] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      triggerRef.current?.focus()
    },
    openCalendar: () => {
      updateDropdownPosition()
      setIsOpen(true)
    }
  }))

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && triggerRef.current) {
      triggerRef.current.focus()
      // Small delay to ensure focus, then open calendar
      setTimeout(() => {
        setIsOpen(true)
      }, 100)
    }
  }, [autoFocus])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      
      // Check if click is outside both the trigger button and dropdown
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        // For portal, we need to check if the click is within any calendar element in the DOM
        const calendarElements = document.querySelectorAll('[data-calendar-dropdown]')
        let isInsideCalendar = false
        
        calendarElements.forEach(element => {
          if (element.contains(target)) {
            isInsideCalendar = true
          }
        })
        
        if (!isInsideCalendar) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      const handleResize = () => updateDropdownPosition()
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleResize, true)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleResize, true)
      }
    }
  }, [isOpen])

  // Generate calendar dates for current month
  const generateCalendarDates = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const dates = []
    const current = new Date(startDate)
    
    while (current <= lastDay || dates.length < 42) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
      if (dates.length >= 42) break
    }
    
    return dates
  }

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return ''
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    }
    return date.toLocaleDateString('en-US', options)
  }

  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDisplayText = () => {
    if (!internalStartDate && !internalEndDate) return placeholder
    if (internalStartDate && !internalEndDate) {
      return `${formatDisplayDate(internalStartDate)} – Select end date`
    }
    if (internalStartDate && internalEndDate) {
      if (internalStartDate.getTime() === internalEndDate.getTime()) {
        return `${formatDisplayDate(internalStartDate)} (1 day)`
      }
      const diffTime = Math.abs(internalEndDate.getTime() - internalStartDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return `${formatDisplayDate(internalStartDate)} – ${formatDisplayDate(internalEndDate)} (${diffDays} days)`
    }
    return placeholder
  }

  const handleDateClick = (date: Date) => {
    if (isSelectingStart) {
      setInternalStartDate(date)
      setInternalEndDate(null)
      setIsSelectingStart(false)
    } else {
      if (date < internalStartDate!) {
        // If selected end date is before start date, swap them
        setInternalStartDate(date)
        setInternalEndDate(internalStartDate)
        onChange(date, internalStartDate)
        setIsOpen(false)
        setIsSelectingStart(true)
      } else {
        setInternalEndDate(date)
        onChange(internalStartDate, date)
        setIsOpen(false)
        setIsSelectingStart(true)
      }
    }
  }

  const isDateInRange = (date: Date) => {
    if (!internalStartDate || !internalEndDate) return false
    return date >= internalStartDate && date <= internalEndDate
  }

  const isDateSelected = (date: Date) => {
    if (!internalStartDate) return false
    if (internalStartDate.toDateString() === date.toDateString()) return true
    if (internalEndDate && internalEndDate.toDateString() === date.toDateString()) return true
    return false
  }

  const isStartDate = (date: Date) => {
    return internalStartDate && internalStartDate.toDateString() === date.toDateString()
  }

  const isEndDate = (date: Date) => {
    return internalEndDate && internalEndDate.toDateString() === date.toDateString()
  }

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalStartDate(null)
    setInternalEndDate(null)
    onChange(null, null)
    setIsSelectingStart(true)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const calendarDates = generateCalendarDates(currentYear, currentMonth)

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            if (!isOpen) {
              updateDropdownPosition()
            }
            setIsOpen(!isOpen)
          }
        }}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left',
          'border border-gray-300 dark:border-[#2a2a2a] rounded-lg',
          'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100',
          'shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
          'hover:border-gray-400 dark:hover:border-[#3a3a3a] transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={cn(
            'text-sm',
            !internalStartDate && !internalEndDate ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
          )}>
            {getDisplayText()}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {(internalStartDate || internalEndDate) && !disabled && (
            <div
              onClick={clearDates}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )} />
        </div>
      </button>

      {/* Dropdown Calendar - Rendered in Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          data-calendar-dropdown
          className="fixed z-[9999] w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-2xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${Math.max(dropdownPosition.width, 320)}px`
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90 text-gray-600 dark:text-gray-400" />
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 -rotate-90 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Instructions */}
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#2a2a2a]">
            {isSelectingStart ? 'Select start date' : 'Select end date'}
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Dates */}
            <div className="grid grid-cols-7 gap-0 relative">
              {calendarDates.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth
                const isSelected = isDateSelected(date)
                const isInRange = isDateInRange(date)
                const isDisabled = isDateDisabled(date)
                const isToday = date.toDateString() === new Date().toDateString()
                const isStart = isStartDate(date)
                const isEnd = isEndDate(date)

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isDisabled && handleDateClick(date)}
                    disabled={isDisabled}
                    className={cn(
                      'relative w-8 h-8 text-sm transition-all duration-150 m-0.5',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      'disabled:cursor-not-allowed disabled:opacity-30',
                      !isCurrentMonth && 'text-gray-300 dark:text-gray-600',
                      isCurrentMonth && 'text-gray-700 dark:text-gray-300',
                      isToday && 'font-bold text-emerald-600 dark:text-emerald-400',
                      
                      // Start and end dates - fully selected styling with rounded corners
                      (isStart || isEnd) && 'bg-emerald-500 text-white hover:bg-emerald-600 relative z-10 rounded-full',
                      
                      // Dates in range - connected background without rounded corners  
                      isInRange && !isStart && !isEnd && 'bg-emerald-300 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-100 rounded-sm relative z-0 mx-0'
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                handleDateClick(today)
                if (!isSelectingStart) {
                  setIsOpen(false)
                  setIsSelectingStart(true)
                }
              }}
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsSelectingStart(true)
              }}
              className="px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

TravelDatePicker.displayName = 'TravelDatePicker'

export default TravelDatePicker