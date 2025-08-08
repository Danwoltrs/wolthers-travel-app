'use client'

import { supabase } from '@/lib/supabase-client'

export interface MicrosoftAuthConfig {
  clientId: string
  tenantId: string
  redirectUri: string
  scope?: string
}

export class MicrosoftAuthProvider {
  private config: MicrosoftAuthConfig

  constructor(config: MicrosoftAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || 'openid profile email User.Read'
    }
  }

  // Generate Microsoft OAuth URL
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope!,
      response_mode: 'query',
      state: this.generateState(),
    })

    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`
  }

  // Handle Microsoft OAuth callback
  async handleCallback(code: string): Promise<{ success: boolean; user?: any; sessionToken?: string; error?: string }> {
    try {
      console.log('🔗 Microsoft auth handler: Starting callback processing...')
      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      console.log('🌍 User timezone:', timezone)

      console.log('📤 Sending request to /api/auth/callback/microsoft...')
      // Use server-side endpoint to handle token exchange
      const response = await fetch('/api/auth/callback/microsoft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timezone': timezone,
        },
        body: JSON.stringify({
          code,
          redirectUri: this.config.redirectUri,
        }),
      })

      console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
        console.error('❌ API error response:', errorData)
        return { success: false, error: errorData.error || 'Authentication failed' }
      }

      const result = await response.json()
      console.log('✅ API success response:', { 
        success: result.success, 
        hasUser: !!result.user,
        hasSessionToken: !!result.sessionToken
      })
      return { 
        success: result.success, 
        user: result.user,
        sessionToken: result.sessionToken 
      }
    } catch (error) {
      console.error('❌ Microsoft auth callback error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  // Server-side handles all the complex OAuth operations

  // Generate secure state parameter
  private generateState(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

// Helper function to create Microsoft auth provider instance
export function createMicrosoftAuthProvider(redirectUri?: string): MicrosoftAuthProvider {
  const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID
  const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID

  if (!clientId || !tenantId) {
    throw new Error('Missing Microsoft Azure AD configuration')
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const defaultRedirectUri = `${baseUrl}/auth/callback`

  return new MicrosoftAuthProvider({
    clientId,
    tenantId,
    redirectUri: redirectUri || defaultRedirectUri,
  })
}

// Enhanced login tracking function
export async function trackLoginEvent(userId: string, provider: 'microsoft' | 'email', userEmail: string): Promise<void> {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()

    // Update user's last login info
    await supabase
      .from('users')
      .update({
        last_login_at: now.toISOString(),
        last_login_timezone: timezone,
        last_login_provider: provider,
        updated_at: now.toISOString(),
      })
      .eq('id', userId)

    // Log the login event for audit trail
    await supabase
      .from('login_events')
      .insert({
        user_id: userId,
        user_email: userEmail,
        login_provider: provider,
        login_timezone: timezone,
        login_timestamp: now.toISOString(),
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        ip_address: null, // Would need server-side implementation for real IP
      })

    console.log(`Login tracked for ${userEmail} via ${provider} at ${now.toISOString()} (${timezone})`)
  } catch (error) {
    console.error('Failed to track login event:', error)
  }
}