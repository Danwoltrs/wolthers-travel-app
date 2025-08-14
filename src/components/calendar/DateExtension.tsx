/**
 * DateExtension Component
 * 
 * Provides functionality to extend trip dates by adding days
 * before or after the current trip period.
 */

import React, { useState } from 'react'
import { Plus, Minus, Calendar, ChevronDown } from 'lucide-react'

interface DateExtensionProps {
  direction: 'before' | 'after'
  onExtend: (days: number) => void
}

export function DateExtension({ direction, onExtend }: DateExtensionProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [selectedDays, setSelectedDays] = useState(1)

  const dayOptions = [1, 2, 3, 5, 7]

  const handleExtend = () => {
    onExtend(selectedDays)
    setShowOptions(false)
  }

  const isBeforeTrip = direction === 'before'
  const title = isBeforeTrip ? 'Add Days Before Trip' : 'Add Days After Trip'
  const description = isBeforeTrip 
    ? 'Extend trip start date backward' 
    : 'Extend trip end date forward'

  return (
    <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111]">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Add Buttons */}
            {!showOptions && (
              <>
                <button
                  onClick={() => onExtend(1)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>1 day</span>
                </button>
                
                <button
                  onClick={() => setShowOptions(true)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Extended Options */}
            {showOptions && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Add</span>
                  <select
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(Number(e.target.value))}
                    className="text-xs px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {dayOptions.map((days) => (
                      <option key={days} value={days}>
                        {days} {days === 1 ? 'day' : 'days'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExtend}
                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>

                <button
                  onClick={() => setShowOptions(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Extension Preview */}
        {showOptions && (
          <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-700">
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              This will {isBeforeTrip ? 'move the start date' : 'extend the end date'} by {selectedDays} {selectedDays === 1 ? 'day' : 'days'}.
              {isBeforeTrip && (
                <span className="block mt-1 text-emerald-600 dark:text-emerald-400">
                  New activities can be added to the extended period.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}