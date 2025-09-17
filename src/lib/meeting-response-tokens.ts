import { createHash, randomBytes } from 'crypto'

/**
 * Meeting response token generation and validation utilities
 * 
 * This system generates secure tokens for meeting response URLs that allow
 * hosts to respond to meeting invitations without authentication.
 */

export interface MeetingResponseTokenData {
  meetingId?: string
  activityId?: string
  hostEmail: string
  companyName: string
  responseType: 'accept' | 'decline' | 'reschedule'
  expiresAt: Date
}

export interface TokenValidationResult {
  valid: boolean
  expired?: boolean
  data?: MeetingResponseTokenData
  error?: string
}

/**
 * Generate a secure token for meeting responses
 * 
 * @param data - Meeting and host information to embed in token
 * @param expiryHours - How many hours the token should be valid (default: 168 = 1 week)
 * @returns Secure token string
 */
export function generateMeetingResponseToken(
  data: Omit<MeetingResponseTokenData, 'expiresAt'>,
  expiryHours: number = 168
): string {
  // Create expiry date
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiryHours)

  // Create token data with expiry
  const tokenData: MeetingResponseTokenData = {
    ...data,
    expiresAt
  }

  // Generate random bytes for the token
  const randomToken = randomBytes(32).toString('hex')
  
  // Create a hash of the token data for integrity verification
  const dataString = JSON.stringify(tokenData)
  const dataHash = createHash('sha256')
    .update(dataString + process.env.MEETING_TOKEN_SECRET)
    .digest('hex')
  
  // Combine random token, data hash, and base64-encoded data
  const encodedData = Buffer.from(dataString).toString('base64url')
  const fullToken = `${randomToken}.${dataHash}.${encodedData}`
  
  return fullToken
}

/**
 * Validate and decode a meeting response token
 * 
 * @param token - Token string to validate
 * @returns Validation result with decoded data if valid
 */
export function validateMeetingResponseToken(token: string): TokenValidationResult {
  try {
    // Split token into components
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' }
    }

    const [randomToken, providedHash, encodedData] = parts

    // Decode the data
    const dataString = Buffer.from(encodedData, 'base64url').toString('utf-8')
    const tokenData: MeetingResponseTokenData = JSON.parse(dataString)

    // Verify the hash
    const expectedHash = createHash('sha256')
      .update(dataString + process.env.MEETING_TOKEN_SECRET)
      .digest('hex')

    if (providedHash !== expectedHash) {
      return { valid: false, error: 'Token integrity check failed' }
    }

    // Check expiry
    const now = new Date()
    const expiresAt = new Date(tokenData.expiresAt)
    
    if (now > expiresAt) {
      return { valid: false, expired: true, error: 'Token has expired' }
    }

    return { valid: true, data: tokenData }

  } catch (error) {
    return { 
      valid: false, 
      error: `Token parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Generate secure meeting response URLs for all response types
 * 
 * @param baseUrl - Base URL of the application
 * @param meetingData - Meeting and host information
 * @returns Object with accept, decline, and reschedule URLs
 */
export function generateMeetingResponseUrls(
  baseUrl: string,
  meetingData: {
    meetingId?: string
    activityId?: string
    hostEmail: string
    companyName: string
  }
) {
  const { meetingId, activityId, hostEmail, companyName } = meetingData

  // Generate tokens for each response type
  const acceptToken = generateMeetingResponseToken({
    meetingId,
    activityId,
    hostEmail,
    companyName,
    responseType: 'accept'
  })

  const declineToken = generateMeetingResponseToken({
    meetingId,
    activityId,
    hostEmail,
    companyName,
    responseType: 'decline'
  })

  const rescheduleToken = generateMeetingResponseToken({
    meetingId,
    activityId,
    hostEmail,
    companyName,
    responseType: 'reschedule'
  })

  return {
    acceptUrl: `${baseUrl}/meeting/response/accept?token=${acceptToken}`,
    declineUrl: `${baseUrl}/meeting/response/decline?token=${declineToken}`,
    rescheduleUrl: `${baseUrl}/meeting/response/reschedule?token=${rescheduleToken}`
  }
}

/**
 * Extract meeting response information from a token
 * Used by API endpoints to process responses
 * 
 * @param token - Token from URL parameters
 * @returns Validation result with meeting and response information
 */
export function processMeetingResponseToken(token: string): TokenValidationResult {
  const validation = validateMeetingResponseToken(token)
  
  if (!validation.valid) {
    console.error('❌ Invalid meeting response token:', validation.error)
    return validation
  }

  console.log('✅ Valid meeting response token processed:', {
    responseType: validation.data?.responseType,
    hostEmail: validation.data?.hostEmail,
    companyName: validation.data?.companyName,
    expiresAt: validation.data?.expiresAt
  })

  return validation
}

/**
 * Create a meeting response record in the database
 * This should be called after validating the token and processing the response
 * 
 * @param tokenData - Validated token data
 * @param additionalData - Additional response data (message, reschedule info, etc.)
 * @returns Meeting response record data for database insertion
 */
export function createMeetingResponseRecord(
  tokenData: MeetingResponseTokenData,
  additionalData?: {
    responseMessage?: string
    rescheduleRequestedDate?: Date
    rescheduleRequestedTime?: string
    originalMeetingDate?: Date
    originalMeetingTime?: string
    tripId?: string
  }
) {
  // Generate a new token for this specific response (for database storage)
  const responseToken = randomBytes(32).toString('hex')

  return {
    response_token: responseToken,
    meeting_id: tokenData.meetingId || null,
    activity_id: tokenData.activityId || null,
    host_name: '', // This should be filled from the meeting/activity data
    host_email: tokenData.hostEmail,
    company_name: tokenData.companyName,
    response_type: tokenData.responseType,
    response_message: additionalData?.responseMessage || null,
    reschedule_requested_date: additionalData?.rescheduleRequestedDate || null,
    reschedule_requested_time: additionalData?.rescheduleRequestedTime || null,
    trip_id: additionalData?.tripId || null,
    original_meeting_date: additionalData?.originalMeetingDate || null,
    original_meeting_time: additionalData?.originalMeetingTime || null,
    status: 'pending',
    organizer_notified: false
  }
}