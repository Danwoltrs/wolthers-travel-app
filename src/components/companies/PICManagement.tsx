'use client'

import { useState } from 'react'
import { User, Mail, Phone, MessageCircle, Briefcase, Plus, X } from 'lucide-react'

export interface PICData {
  name: string
  email: string
  whatsapp: string
  title: string
}

interface PICManagementProps {
  initialData?: PICData
  onChange: (data: PICData | null) => void
  required?: boolean
  className?: string
}

export default function PICManagement({
  initialData,
  onChange,
  required = false,
  className = ''
}: PICManagementProps) {
  const [picData, setPicData] = useState<PICData>(initialData || {
    name: '',
    email: '',
    whatsapp: '',
    title: ''
  })
  const [hasPIC, setHasPIC] = useState(!!initialData)

  const updatePICData = (field: keyof PICData, value: string) => {
    const newData = { ...picData, [field]: value }
    setPicData(newData)
    onChange(hasPIC ? newData : null)
  }

  const togglePIC = () => {
    const newHasPIC = !hasPIC
    setHasPIC(newHasPIC)
    
    if (!newHasPIC) {
      // Reset data when disabling PIC
      const resetData = { name: '', email: '', whatsapp: '', title: '' }
      setPicData(resetData)
      onChange(null)
    } else {
      // Send current data when enabling PIC
      onChange(picData)
    }
  }

  const isValid = !hasPIC || (picData.name.trim() && picData.email.trim())

  return (
    <div className={`space-y-4 ${className}`}>
      {/* PIC Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 flex items-center gap-2">
            <User className="w-5 h-5" />
            Person in Charge (PIC)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Person responsible for business with this company
          </p>
        </div>
        
        {!required && (
          <button
            type="button"
            onClick={togglePIC}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              hasPIC
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {hasPIC ? (
              <>
                <X className="w-4 h-4" />
                Remove PIC
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add PIC
              </>
            )}
          </button>
        )}
      </div>

      {/* PIC Form */}
      {(hasPIC || required) && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name {required && '*'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={picData.name}
                    onChange={(e) => updatePICData('name', e.target.value)}
                    required={required}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="John Silva"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Title/Position
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={picData.title}
                    onChange={(e) => updatePICData('title', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Commercial Manager"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail {required && '*'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={picData.email}
                    onChange={(e) => updatePICData('email', e.target.value)}
                    required={required}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={picData.whatsapp}
                    onChange={(e) => updatePICData('whatsapp', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+55 11 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Validation Message */}
            {required && !isValid && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
                Name and email are required for PIC
              </div>
            )}
          </div>
        </div>
      )}

      {/* PIC Benefits Info */}
      {(hasPIC || required) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">PIC Benefits:</p>
              <ul className="space-y-1 text-xs">
                <li>• Main contact for trip coordination</li>
                <li>• Direct WhatsApp communication for updates</li>
                <li>• CRM system integration for relationship history</li>
                <li>• Automatic notifications about trips and meetings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}