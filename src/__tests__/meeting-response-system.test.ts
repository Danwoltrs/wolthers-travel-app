/**
 * Meeting Response System Test Suite
 * 
 * Tests the complete meeting response workflow including:
 * - Token generation and validation
 * - URL creation and processing
 * - Response handling and database storage
 * - Security and expiration validation
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { 
  generateMeetingResponseToken,
  validateMeetingResponseToken,
  generateMeetingResponseUrls,
  processMeetingResponseToken,
  createMeetingResponseRecord,
  type MeetingResponseTokenData
} from '@/lib/meeting-response-tokens'

// Mock crypto module
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hash-value')
  })),
  randomBytes: jest.fn(() => Buffer.from('mocked-random-bytes'))
}))

describe('Meeting Response System', () => {
  const originalEnv = process.env

  beforeAll(() => {
    // Set up test environment variables
    process.env.MEETING_TOKEN_SECRET = 'test-secret-key-for-meeting-tokens'
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Date.now() for consistent testing
    jest.spyOn(Date, 'now').mockImplementation(() => 
      new Date('2024-01-15T10:00:00.000Z').getTime()
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Token Generation Tests', () => {
    
    it('should generate unique tokens for different response types', () => {
      const meetingData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      const acceptToken = generateMeetingResponseToken({
        ...meetingData,
        responseType: 'accept'
      })

      const declineToken = generateMeetingResponseToken({
        ...meetingData,
        responseType: 'decline'
      })

      const rescheduleToken = generateMeetingResponseToken({
        ...meetingData,
        responseType: 'reschedule'
      })

      // Tokens should be different
      expect(acceptToken).not.toBe(declineToken)
      expect(declineToken).not.toBe(rescheduleToken)
      expect(acceptToken).not.toBe(rescheduleToken)

      // All tokens should have the correct format (random.hash.data)
      expect(acceptToken.split('.')).toHaveLength(3)
      expect(declineToken.split('.')).toHaveLength(3)
      expect(rescheduleToken.split('.')).toHaveLength(3)
    })

    it('should generate tokens with configurable expiry', () => {
      const tokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept' as const
      }

      // Test default expiry (168 hours = 7 days)
      const defaultToken = generateMeetingResponseToken(tokenData)
      expect(defaultToken).toBeTruthy()

      // Test custom expiry (24 hours)
      const customToken = generateMeetingResponseToken(tokenData, 24)
      expect(customToken).toBeTruthy()
      expect(customToken).not.toBe(defaultToken)
    })

    it('should handle missing environment variables gracefully', () => {
      const originalSecret = process.env.MEETING_TOKEN_SECRET
      delete process.env.MEETING_TOKEN_SECRET

      const tokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept' as const
      }

      // Should still generate token but with undefined secret (handled by crypto)
      const token = generateMeetingResponseToken(tokenData)
      expect(token).toBeTruthy()

      process.env.MEETING_TOKEN_SECRET = originalSecret
    })

    it('should include all required data in token', () => {
      const tokenData = {
        meetingId: 'meeting-456',
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept' as const
      }

      const token = generateMeetingResponseToken(tokenData, 72)

      // Mock the validation to check data is preserved
      const [randomPart, hashPart, dataPart] = token.split('.')
      expect(randomPart).toBeTruthy()
      expect(hashPart).toBeTruthy()
      expect(dataPart).toBeTruthy()

      // Decode the data part
      const decodedData = JSON.parse(Buffer.from(dataPart, 'base64url').toString('utf-8'))
      expect(decodedData.meetingId).toBe('meeting-456')
      expect(decodedData.activityId).toBe('activity-123')
      expect(decodedData.hostEmail).toBe('host@client.com')
      expect(decodedData.companyName).toBe('Client Corp')
      expect(decodedData.responseType).toBe('accept')
      expect(decodedData.expiresAt).toBeTruthy()
    })
  })

  describe('Token Validation Tests', () => {
    
    it('should validate correctly formatted tokens', () => {
      // Mock a valid token structure
      const validTokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }

      const dataString = JSON.stringify(validTokenData)
      const encodedData = Buffer.from(dataString).toString('base64url')
      const mockToken = `random-bytes.mocked-hash-value.${encodedData}`

      const result = validateMeetingResponseToken(mockToken)

      expect(result.valid).toBe(true)
      expect(result.data).toEqual(validTokenData)
      expect(result.error).toBeUndefined()
    })

    it('should reject tokens with invalid format', () => {
      const invalidTokens = [
        'invalid-token',
        'only.two.parts',
        '',
        'too.many.parts.here.invalid',
        'random.hash.' // Missing data part
      ]

      invalidTokens.forEach(token => {
        const result = validateMeetingResponseToken(token)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid token format')
      })
    })

    it('should reject expired tokens', () => {
      // Create an expired token
      const expiredTokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      }

      const dataString = JSON.stringify(expiredTokenData)
      const encodedData = Buffer.from(dataString).toString('base64url')
      const expiredToken = `random-bytes.mocked-hash-value.${encodedData}`

      const result = validateMeetingResponseToken(expiredToken)

      expect(result.valid).toBe(false)
      expect(result.expired).toBe(true)
      expect(result.error).toBe('Token has expired')
    })

    it('should reject tokens with invalid hash', () => {
      const tokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      const dataString = JSON.stringify(tokenData)
      const encodedData = Buffer.from(dataString).toString('base64url')
      const tokenWithWrongHash = `random-bytes.wrong-hash-value.${encodedData}`

      const result = validateMeetingResponseToken(tokenWithWrongHash)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token integrity check failed')
    })

    it('should handle malformed JSON in token data', () => {
      const invalidJsonData = Buffer.from('invalid-json-data').toString('base64url')
      const malformedToken = `random-bytes.hash-value.${invalidJsonData}`

      const result = validateMeetingResponseToken(malformedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Token parsing failed')
    })
  })

  describe('URL Generation Tests', () => {
    
    it('should generate all three response URLs', () => {
      const meetingData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      const urls = generateMeetingResponseUrls('https://app.wolthers.com', meetingData)

      expect(urls.acceptUrl).toContain('https://app.wolthers.com/meeting/response/accept?token=')
      expect(urls.declineUrl).toContain('https://app.wolthers.com/meeting/response/decline?token=')
      expect(urls.rescheduleUrl).toContain('https://app.wolthers.com/meeting/response/reschedule?token=')

      // Verify tokens are different
      const acceptToken = urls.acceptUrl.split('token=')[1]
      const declineToken = urls.declineUrl.split('token=')[1]
      const rescheduleToken = urls.rescheduleUrl.split('token=')[1]

      expect(acceptToken).not.toBe(declineToken)
      expect(declineToken).not.toBe(rescheduleToken)
      expect(acceptToken).not.toBe(rescheduleToken)
    })

    it('should handle different base URLs correctly', () => {
      const meetingData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      const urls1 = generateMeetingResponseUrls('http://localhost:3000', meetingData)
      const urls2 = generateMeetingResponseUrls('https://production.app.com', meetingData)

      expect(urls1.acceptUrl).toContain('http://localhost:3000/meeting/response/accept')
      expect(urls2.acceptUrl).toContain('https://production.app.com/meeting/response/accept')
    })

    it('should support both meetingId and activityId', () => {
      const withMeetingId = {
        meetingId: 'meeting-456',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      const withActivityId = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      const urls1 = generateMeetingResponseUrls('http://localhost:3000', withMeetingId)
      const urls2 = generateMeetingResponseUrls('http://localhost:3000', withActivityId)

      // Both should generate valid URLs
      expect(urls1.acceptUrl).toBeTruthy()
      expect(urls2.acceptUrl).toBeTruthy()
      
      // URLs should be different due to different data
      expect(urls1.acceptUrl).not.toBe(urls2.acceptUrl)
    })
  })

  describe('Response Processing Tests', () => {
    
    it('should process valid response tokens correctly', () => {
      const validTokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      // Mock validateMeetingResponseToken to return valid result
      jest.spyOn(require('@/lib/meeting-response-tokens'), 'validateMeetingResponseToken')
        .mockReturnValue({
          valid: true,
          data: validTokenData
        })

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result = processMeetingResponseToken('valid-token')

      expect(result.valid).toBe(true)
      expect(result.data).toEqual(validTokenData)
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Valid meeting response token processed:',
        expect.objectContaining({
          responseType: 'accept',
          hostEmail: 'host@client.com',
          companyName: 'Client Corp'
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle invalid response tokens', () => {
      // Mock validateMeetingResponseToken to return invalid result
      jest.spyOn(require('@/lib/meeting-response-tokens'), 'validateMeetingResponseToken')
        .mockReturnValue({
          valid: false,
          error: 'Token has expired'
        })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = processMeetingResponseToken('expired-token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token has expired')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Invalid meeting response token:',
        'Token has expired'
      )

      consoleErrorSpy.mockRestore()
    })

    it('should log detailed information for valid tokens', () => {
      const tokenData: MeetingResponseTokenData = {
        meetingId: 'meeting-456',
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'reschedule',
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
      }

      jest.spyOn(require('@/lib/meeting-response-tokens'), 'validateMeetingResponseToken')
        .mockReturnValue({
          valid: true,
          data: tokenData
        })

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      processMeetingResponseToken('valid-token')

      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Valid meeting response token processed:',
        expect.objectContaining({
          responseType: 'reschedule',
          hostEmail: 'host@client.com',
          companyName: 'Client Corp',
          expiresAt: tokenData.expiresAt
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Database Record Creation Tests', () => {
    
    it('should create complete meeting response record', () => {
      const tokenData: MeetingResponseTokenData = {
        meetingId: 'meeting-456',
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      const additionalData = {
        responseMessage: 'Looking forward to the meeting!',
        tripId: 'trip-789',
        originalMeetingDate: new Date('2024-01-20T14:00:00Z'),
        originalMeetingTime: '2:00 PM'
      }

      const record = createMeetingResponseRecord(tokenData, additionalData)

      expect(record).toEqual({
        response_token: expect.any(String),
        meeting_id: 'meeting-456',
        activity_id: 'activity-123',
        host_name: '', // Should be filled from meeting/activity data
        host_email: 'host@client.com',
        company_name: 'Client Corp',
        response_type: 'accept',
        response_message: 'Looking forward to the meeting!',
        reschedule_requested_date: null,
        reschedule_requested_time: null,
        trip_id: 'trip-789',
        original_meeting_date: additionalData.originalMeetingDate,
        original_meeting_time: '2:00 PM',
        status: 'pending',
        organizer_notified: false
      })

      // Verify response_token is generated
      expect(record.response_token).toHaveLength(64) // 32 bytes * 2 for hex
    })

    it('should create reschedule response record with requested date/time', () => {
      const tokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'reschedule',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      const rescheduleData = {
        responseMessage: 'Could we move this to next week?',
        rescheduleRequestedDate: new Date('2024-01-27T14:00:00Z'),
        rescheduleRequestedTime: '2:00 PM',
        originalMeetingDate: new Date('2024-01-20T14:00:00Z'),
        originalMeetingTime: '2:00 PM'
      }

      const record = createMeetingResponseRecord(tokenData, rescheduleData)

      expect(record.response_type).toBe('reschedule')
      expect(record.reschedule_requested_date).toEqual(rescheduleData.rescheduleRequestedDate)
      expect(record.reschedule_requested_time).toBe('2:00 PM')
      expect(record.response_message).toBe('Could we move this to next week?')
    })

    it('should create decline response record', () => {
      const tokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'decline',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      const declineData = {
        responseMessage: 'Unfortunately, I have a conflict and cannot attend.',
        tripId: 'trip-789'
      }

      const record = createMeetingResponseRecord(tokenData, declineData)

      expect(record.response_type).toBe('decline')
      expect(record.response_message).toBe('Unfortunately, I have a conflict and cannot attend.')
      expect(record.reschedule_requested_date).toBeNull()
      expect(record.reschedule_requested_time).toBeNull()
    })

    it('should handle minimal data gracefully', () => {
      const tokenData: MeetingResponseTokenData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      const record = createMeetingResponseRecord(tokenData)

      expect(record.meeting_id).toBeNull()
      expect(record.activity_id).toBe('activity-123')
      expect(record.response_message).toBeNull()
      expect(record.trip_id).toBeNull()
      expect(record.status).toBe('pending')
      expect(record.organizer_notified).toBe(false)
    })
  })

  describe('Security Tests', () => {
    
    it('should generate cryptographically secure random tokens', () => {
      const { randomBytes } = require('crypto')
      
      // Test multiple token generations
      const tokens = Array.from({ length: 10 }, () => 
        generateMeetingResponseToken({
          activityId: 'activity-123',
          hostEmail: 'host@client.com',
          companyName: 'Client Corp',
          responseType: 'accept'
        })
      )

      // All tokens should be different
      const uniqueTokens = new Set(tokens)
      expect(uniqueTokens.size).toBe(10)

      // Verify randomBytes was called for each token
      expect(randomBytes).toHaveBeenCalledTimes(10)
    })

    it('should prevent token tampering through hash validation', () => {
      const originalToken = generateMeetingResponseToken({
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept'
      })

      const [randomPart, hashPart, dataPart] = originalToken.split('.')
      
      // Try to tamper with the data
      const tamperedData = Buffer.from(JSON.stringify({
        activityId: 'hacked-activity',
        hostEmail: 'hacker@evil.com',
        companyName: 'Evil Corp',
        responseType: 'accept',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })).toString('base64url')

      const tamperedToken = `${randomPart}.${hashPart}.${tamperedData}`

      const result = validateMeetingResponseToken(tamperedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token integrity check failed')
    })

    it('should require environment secret for token validation', () => {
      const originalSecret = process.env.MEETING_TOKEN_SECRET
      
      // Generate token with secret
      const token = generateMeetingResponseToken({
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept'
      })

      // Change secret and try to validate
      process.env.MEETING_TOKEN_SECRET = 'different-secret'

      const result = validateMeetingResponseToken(token)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token integrity check failed')

      // Restore original secret
      process.env.MEETING_TOKEN_SECRET = originalSecret
    })

    it('should enforce reasonable expiration times', () => {
      // Test very long expiration (should still work but be flagged)
      const longTermToken = generateMeetingResponseToken({
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept'
      }, 8760) // 1 year

      expect(longTermToken).toBeTruthy()

      // Test immediate expiration
      const immediateToken = generateMeetingResponseToken({
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept'
      }, 0) // Expires immediately

      // Should be generated but will be expired when validated
      expect(immediateToken).toBeTruthy()

      // Advance time slightly to make token expired
      jest.spyOn(Date, 'now').mockImplementation(() => 
        new Date('2024-01-15T10:01:00.000Z').getTime()
      )

      const result = validateMeetingResponseToken(immediateToken)
      expect(result.valid).toBe(false)
      expect(result.expired).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    
    it('should complete full token lifecycle: generate → validate → process', () => {
      const meetingData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      // 1. Generate URLs
      const urls = generateMeetingResponseUrls('http://localhost:3000', meetingData)
      expect(urls.acceptUrl).toBeTruthy()

      // 2. Extract token from URL
      const acceptToken = urls.acceptUrl.split('token=')[1]
      expect(acceptToken).toBeTruthy()

      // 3. Validate token
      const validationResult = validateMeetingResponseToken(acceptToken)
      expect(validationResult.valid).toBe(true)
      expect(validationResult.data?.responseType).toBe('accept')

      // 4. Process token (with mocked validation)
      jest.spyOn(require('@/lib/meeting-response-tokens'), 'validateMeetingResponseToken')
        .mockReturnValue(validationResult)

      const processingResult = processMeetingResponseToken(acceptToken)
      expect(processingResult.valid).toBe(true)

      // 5. Create database record
      const record = createMeetingResponseRecord(
        validationResult.data!,
        { tripId: 'trip-789' }
      )
      expect(record.activity_id).toBe('activity-123')
      expect(record.response_type).toBe('accept')
    })

    it('should handle concurrent token generation for same meeting', () => {
      const meetingData = {
        activityId: 'activity-123',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp'
      }

      // Generate multiple token sets concurrently
      const tokenSets = Array.from({ length: 5 }, () => 
        generateMeetingResponseUrls('http://localhost:3000', meetingData)
      )

      // All token sets should be unique
      const allTokens = tokenSets.flatMap(set => [
        set.acceptUrl.split('token=')[1],
        set.declineUrl.split('token=')[1],
        set.rescheduleUrl.split('token=')[1]
      ])

      const uniqueTokens = new Set(allTokens)
      expect(uniqueTokens.size).toBe(15) // 5 sets * 3 tokens each
    })

    it('should validate email integration workflow', () => {
      // Simulate the workflow of sending a host meeting request email
      const hostEmailData = {
        hostName: 'John Host',
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        meetingTitle: 'Strategy Discussion',
        meetingDate: '2024-01-20T14:00:00Z',
        inviterName: 'Trip Organizer'
      }

      // Generate response URLs (as would happen in email service)
      const responseUrls = generateMeetingResponseUrls('https://app.wolthers.com', {
        activityId: 'activity-123',
        hostEmail: hostEmailData.hostEmail,
        companyName: hostEmailData.companyName
      })

      // Validate that URLs contain expected elements
      expect(responseUrls.acceptUrl).toMatch(/\/meeting\/response\/accept\?token=/)
      expect(responseUrls.declineUrl).toMatch(/\/meeting\/response\/decline\?token=/)
      expect(responseUrls.rescheduleUrl).toMatch(/\/meeting\/response\/reschedule\?token=/)

      // Extract and validate one token
      const acceptToken = responseUrls.acceptUrl.split('token=')[1]
      const validationResult = validateMeetingResponseToken(acceptToken)

      expect(validationResult.valid).toBe(true)
      expect(validationResult.data?.hostEmail).toBe(hostEmailData.hostEmail)
      expect(validationResult.data?.companyName).toBe(hostEmailData.companyName)
      expect(validationResult.data?.responseType).toBe('accept')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    
    it('should handle extremely long company names and email addresses', () => {
      const longData = {
        activityId: 'activity-123',
        hostEmail: 'a'.repeat(100) + '@' + 'b'.repeat(100) + '.com',
        companyName: 'C'.repeat(500) + ' Corporation'
      }

      const token = generateMeetingResponseToken({
        ...longData,
        responseType: 'accept'
      })

      expect(token).toBeTruthy()

      // Should still validate correctly
      const result = validateMeetingResponseToken(token)
      expect(result.valid).toBe(true)
      expect(result.data?.hostEmail).toBe(longData.hostEmail)
      expect(result.data?.companyName).toBe(longData.companyName)
    })

    it('should handle special characters in data fields', () => {
      const specialCharData = {
        activityId: 'activity-123',
        hostEmail: 'host+test@client-company.com',
        companyName: 'Client & Associates (São Paulo)'
      }

      const token = generateMeetingResponseToken({
        ...specialCharData,
        responseType: 'accept'
      })

      const result = validateMeetingResponseToken(token)
      expect(result.valid).toBe(true)
      expect(result.data?.companyName).toBe('Client & Associates (São Paulo)')
    })

    it('should handle timezone edge cases', () => {
      // Test token generation at different times
      const testDates = [
        '2024-01-01T00:00:00.000Z', // New Year
        '2024-12-31T23:59:59.999Z', // End of year
        '2024-02-29T12:00:00.000Z'  // Leap year
      ]

      testDates.forEach(dateStr => {
        jest.spyOn(Date, 'now').mockImplementation(() => 
          new Date(dateStr).getTime()
        )

        const token = generateMeetingResponseToken({
          activityId: 'activity-123',
          hostEmail: 'host@client.com',
          companyName: 'Client Corp',
          responseType: 'accept'
        }, 24)

        const result = validateMeetingResponseToken(token)
        expect(result.valid).toBe(true)
      })
    })

    it('should handle missing optional fields', () => {
      // Test with only required fields
      const minimalData = {
        hostEmail: 'host@client.com',
        companyName: 'Client Corp',
        responseType: 'accept' as const
      }

      const token = generateMeetingResponseToken(minimalData)
      const result = validateMeetingResponseToken(token)

      expect(result.valid).toBe(true)
      expect(result.data?.meetingId).toBeUndefined()
      expect(result.data?.activityId).toBeUndefined()
      expect(result.data?.hostEmail).toBe('host@client.com')
    })
  })
})