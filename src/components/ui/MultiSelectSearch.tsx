import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  id: string
  label: string
  sublabel?: string
  avatar?: string
}

interface MultiSelectSearchProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export default function MultiSelectSearch({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  className,
  disabled = false
}: MultiSelectSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.sublabel?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const selectedOptions = options.filter(option => value.includes(option.id))

  const toggleOption = (optionId: string) => {
    if (disabled) return
    
    if (value.includes(optionId)) {
      onChange(value.filter(id => id !== optionId))
    } else {
      onChange([...value, optionId])
    }
  }

  const removeOption = (optionId: string) => {
    if (disabled) return
    onChange(value.filter(id => id !== optionId))
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    
    if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredOptions.length > 0 && !value.includes(filteredOptions[0].id)) {
        toggleOption(filteredOptions[0].id)
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[42px] px-3 py-2 text-left border rounded-lg transition-colors",
          "bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]",
          "hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          disabled && "opacity-50 cursor-not-allowed",
          "flex items-center justify-between gap-2"
        )}
      >
        <div className="flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map(option => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOption(option.id)
                    }}
                    disabled={disabled}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-3",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 border rounded flex items-center justify-center",
                      isSelected 
                        ? "bg-blue-600 border-blue-600" 
                        : "border-gray-300 dark:border-gray-500"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    
                    {option.avatar && (
                      <img 
                        src={option.avatar} 
                        alt={option.label}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {option.label}
                      </div>
                      {option.sublabel && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {option.sublabel}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}