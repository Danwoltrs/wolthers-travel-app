import { useState, useEffect, useCallback } from 'react'
import { debounce } from '@/lib/debounce'
import { generateTripCode, makeTripSlug } from '@/lib/tripCodeGenerator'
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

  // Function to generate a smart trip code using the new business logic
  const generateSmartTripCode = useCallback((formData?: Partial<TripFormData>): string => {
    if (!formData || !formData.startDate) return ''

    // Use new makeTripSlug function with business logic
    const startDate = formData.startDate
    const month = startDate.getMonth() + 1
    const year = startDate.getFullYear()
    
    // Map trip types to new system
    const tripTypeMap: { [key: string]: 'conference' | 'event' | 'business' | 'client_visit' } = {
      'convention': 'conference',
      'conference': 'conference', 
      'event': 'event',
      'business': 'business',
      'client_visit': 'client_visit',
      'in_land': 'business'  // in_land trips use title-based generation
    }
    
    const mappedTripType = tripTypeMap[formData.tripType || 'business'] || 'business'
    
    return makeTripSlug({
      trip_type: mappedTripType,
      companies: formData.companies || [],
      month,
      year,
      code: formData.accessCode,
      title: formData.title
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

      // Basic format check - allow flexible formats
      // Must be uppercase letters, numbers, underscores, and dashes only, 2-20 characters
      const tripCodeRegex = /^[A-Z0-9_-]{2,20}$/
      if (!tripCodeRegex.test(codeToValidate)) {
        setValidationResult({
          isValid: false,
          message: 'Trip code must contain only uppercase letters, numbers, underscores, and dashes (2-20 characters).',
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

  // Track if the code has been manually edited by the user
  const [hasBeenManuallyEdited, setHasBeenManuallyEdited] = useState(false)

  // Automatically generate or validate the code when form data changes
  useEffect(() => {
    // For in_land trips, generate code as soon as title is available
    const isInLandTrip = formData?.tripType === 'in_land'
    const canGenerate = formData && formData.title && (formData.startDate || isInLandTrip)
    
    if (canGenerate && !hasBeenManuallyEdited) {
      // Only auto-generate if no code exists and hasn't been manually edited
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
  }, [code, formData?.title, formData?.startDate, formData?.companies, formData?.tripType, formData, validateTripCode, generateSmartTripCode, initialCode, hasBeenManuallyEdited])

  // Handler to update trip code
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
    setHasBeenManuallyEdited(true) // Mark as manually edited when user types
    validateTripCode(newCode)
  }, [validateTripCode])

  return {
    code,
    setCode: handleCodeChange,
    generateTripCode: generateSmartTripCode,
    validationResult
  }
}