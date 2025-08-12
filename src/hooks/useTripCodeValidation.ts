import { useState, useEffect, useCallback } from 'react'
import { debounce } from '@/lib/debounce'

interface TripCodeValidationResult {
  isValid: boolean
  message: string
  isChecking: boolean
}

export function useTripCodeValidation(
  initialCode: string = '', 
  autoGenerate: boolean = true
) {
  const [code, setCode] = useState(initialCode)
  const [validationResult, setValidationResult] = useState<TripCodeValidationResult>({
    isValid: true,
    message: '',
    isChecking: false
  })

  // Function to generate a trip code
  const generateTripCode = useCallback((title?: string): string => {
    if (!title) return ''

    // Extract first letters and add random 4-digit number
    const titleParts = title
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.substring(0, 3).toUpperCase())
      .slice(0, 3)  // Limit to first 3 words

    const randomNumber = Math.floor(Math.random() * 9000 + 1000)
    const prefix = titleParts.map(part => part.slice(0, 3)).join('_')
    const code = `${prefix}_QA_${randomNumber}`

    return code.slice(0, 15)  // Ensure max length
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

  // Automatically generate or validate the code
  useEffect(() => {
    if (autoGenerate && !code) {
      const generatedCode = generateTripCode()
      setCode(generatedCode)
      validateTripCode(generatedCode)
    } else if (code) {
      validateTripCode(code)
    }
  }, [code, autoGenerate, validateTripCode, generateTripCode])

  // Handler to update trip code
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
    validateTripCode(newCode)
  }, [validateTripCode])

  return {
    code,
    setCode: handleCodeChange,
    generateTripCode,
    validationResult
  }
}