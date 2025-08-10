import { sign, verify } from 'jsonwebtoken'

// JWT utility functions for consistent token handling across the application

export interface JWTPayload {
  userId: string
  iat: number
  exp: number
}

/**
 * Creates a JWT session token for authenticated users
 * Used by both Microsoft OAuth and email/password authentication
 */
export function createSessionToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
  
  const payload: JWTPayload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  }
  
  return sign(payload, secret)
}

/**
 * Verifies and decodes a JWT session token
 * Returns null if token is invalid
 */
export function verifySessionToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    const decoded = verify(token, secret) as JWTPayload
    return decoded
  } catch (error) {
    console.log('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Extracts token from Authorization header
 * Returns null if no valid Bearer token found
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}