import { useState, useEffect, useCallback } from 'react'
import { debounce } from '@/lib/debounce'
import { generateTripCode } from '@/lib/tripCodeGenerator'
import { TripFormData } from '@/components/trips/TripCreationModal'

interface TripCodeValidationResult {
  isValid: boolean
  message: string
  isChecking: boolean
}

export function useTripCodeValidation(
  initialCode: string = '', 
  formData?: Partial<TripFormData>
) {
  const [code, setCode] = useState(initialCode)
  const [validationResult, setValidationResult] = useState<TripCodeValidationResult>({
    isValid: true,
    message: '',
    isChecking: false
  })

  // Function to generate a smart trip code using the full generator
  const generateSmartTripCode = useCallback((formData?: Partial<TripFormData>): string => {
    if (!formData || !formData.title || !formData.startDate) return ''

    return generateTripCode({
      title: formData.title || '',
      companies: formData.companies || [],
      startDate: formData.startDate,
      tripType: formData.tripType || 'convention',
      // Add other required fields with defaults
      description: formData.description || '',
      subject: formData.subject || '',
      endDate: formData.endDate || formData.startDate,
      participants: formData.participants || [],
      estimatedBudget: formData.estimatedBudget,
      accessCode: formData.accessCode || ''
    })
  }, [])

  // Debounced validation function
  const validateTripCode = useCallback(
    debounce(async (codeToValidate: string) => {
      // Skip validation for empty strings
      if (!codeToValidate) {
        setValidationResult({
          isValid: true,
          message: '',
          isChecking: false
        })
        return
      }

      // Basic format check
      const tripCodeRegex = /^[A-Z]{3}_[A-Z]{3}_[A-Z]{2}_\d{4}$/
      if (!tripCodeRegex.test(codeToValidate)) {
        setValidationResult({
          isValid: false,
          message: 'Invalid trip code format. Use format like AMS_BER_QA_1208.',
          isChecking: false
        })
        return
      }

      setValidationResult(prev => ({ ...prev, isChecking: true }))

      try {
        const response = await fetch('/api/trips/validate-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: codeToValidate })
        })

        const result = await response.json()

        setValidationResult({
          isValid: result.isValid,
          message: result.message,
          isChecking: false
        })
      } catch (error) {
        console.error('Trip code validation error:', error)
        setValidationResult({
          isValid: false,
          message: 'Error validating trip code. Please try again.',
          isChecking: false
        })
      }
    }, 500),
    []
  )

  // Automatically generate or validate the code when form data changes
  useEffect(() => {
    if (formData && formData.title && formData.startDate) {
      // Only auto-generate if no code exists or if key parameters changed
      if (!code || (initialCode === '' && code !== initialCode)) {
        const generatedCode = generateSmartTripCode(formData)
        if (generatedCode && generatedCode !== code) {
          setCode(generatedCode)
          validateTripCode(generatedCode)
        }
      } else if (code) {
        validateTripCode(code)
      }
    } else if (code) {
      validateTripCode(code)
    }
  }, [code, formData?.title, formData?.startDate, formData?.companies, formData, validateTripCode, generateSmartTripCode, initialCode])

  // Handler to update trip code
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
    validateTripCode(newCode)
  }, [validateTripCode])

  return {
    code,
    setCode: handleCodeChange,
    generateTripCode: generateSmartTripCode,
    validationResult
  }
}