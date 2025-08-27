'use client'

import { useState } from 'react'
import { X, Building, MapPin, Phone, Mail, User } from 'lucide-react'

interface LabCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onLabCreated?: (lab: any) => void
}

interface LabFormData {
  name: string
  location: string
  country: string
  address_line1: string
  address_line2: string
  city: string
  state_province: string
  postal_code: string
  phone: string
  email: string
  manager_name: string
  manager_email: string
  specializations: string[]
  notes: string
}

const LAB_SPECIALIZATIONS = [
  'Cupping & Sensory Analysis',
  'Quality Control',
  'Moisture Analysis', 
  'Bean Grading',
  'Chemical Analysis',
  'Pest Detection',
  'Storage Conditions',
  'Processing Methods'
]

export default function LabCreationModal({ isOpen, onClose, onLabCreated }: LabCreationModalProps) {
  const [formData, setFormData] = useState<LabFormData>({
    name: '',
    location: '',
    country: 'Brasil',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    phone: '',
    email: '',
    manager_name: '',
    manager_email: '',
    specializations: [],
    notes: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof LabFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Create the lab via API
      const response = await fetch('/api/labs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lab: {
            name: formData.name,
            location: formData.location,
            country: formData.country,
            specializations: formData.specializations,
            notes: formData.notes,
            is_active: true
          },
          address: {
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            state_province: formData.state_province,
            postal_code: formData.postal_code,
            country: formData.country,
            phone: formData.phone,
            email: formData.email
          },
          manager: formData.manager_name ? {
            name: formData.manager_name,
            email: formData.manager_email,
            title: 'Lab Manager'
          } : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create lab')
      }

      const result = await response.json()
      onLabCreated?.(result.lab)
      handleClose()
    } catch (err) {
      console.error('Lab creation error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      location: '',
      country: 'Brasil',
      address_line1: '',
      address_line2: '',
      city: '',
      state_province: '',
      postal_code: '',
      phone: '',
      email: '',
      manager_name: '',
      manager_email: '',
      specializations: [],
      notes: ''
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building className="w-5 h-5" />
            Adicionar Novo Laboratório Wolthers
          </h2>
          <button
            onClick={handleClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Laboratório *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="ex: Wolthers Lab Santos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="ex: Santos, São Paulo"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado/Província
                  </label>
                  <input
                    type="text"
                    value={formData.state_province}
                    onChange={(e) => handleInputChange('state_province', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Lab Manager */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Responsável do Laboratório
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => handleInputChange('manager_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail do Responsável
                </label>
                <input
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => handleInputChange('manager_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
              Especializações do Laboratório
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {LAB_SPECIALIZATIONS.map(specialization => (
                <div key={specialization} className="flex items-center">
                  <input
                    type="checkbox"
                    id={specialization}
                    checked={formData.specializations.includes(specialization)}
                    onChange={(e) => handleSpecializationChange(specialization, e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor={specialization} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {specialization}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Informações adicionais sobre o laboratório..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  Criar Laboratório
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}