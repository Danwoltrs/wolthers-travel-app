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

  // Sign in with popup modal
  async signInWithPopup(): Promise<{ success: boolean; user?: any; error?: string }> {
    return new Promise((resolve) => {
      try {
        const authUrl = this.getAuthUrl()
        
        // Create popup window
        const popup = window.open(
          authUrl,
          'microsoftAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        )

        if (!popup) {
          resolve({ success: false, error: 'Popup blocked. Please allow popups for this site.' })
          return
        }

        // Store the provider instance for callback handling
        sessionStorage.setItem('microsoftAuthProvider', JSON.stringify({
          clientId: this.config.clientId,
          tenantId: this.config.tenantId,
          redirectUri: this.config.redirectUri,
        }))

        // Monitor popup for callback
        const checkClosed = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkClosed)
              resolve({ success: false, error: 'Authentication cancelled by user' })
              return
            }

            // Check for successful callback
            const authResult = sessionStorage.getItem('microsoftAuthResult')
            if (authResult) {
              const result = JSON.parse(authResult)
              sessionStorage.removeItem('microsoftAuthResult')
              popup.close()
              clearInterval(checkClosed)
              resolve(result)
              return
            }

            // Check if popup URL has changed to callback
            try {
              if (popup.location.href.includes('/auth/callback')) {
                // Let the callback page handle the rest
                return
              }
            } catch (e) {
              // Cross-origin error - popup is still on Microsoft domain, continue monitoring
            }
          } catch (error) {
            // Handle any errors in monitoring
            console.warn('Error monitoring popup:', error)
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup.closed) {
            popup.close()
            clearInterval(checkClosed)
            resolve({ success: false, error: 'Authentication timeout' })
          }
        }, 300000)

      } catch (error) {
        console.error('Popup authentication error:', error)
        resolve({ success: false, error: 'Failed to open authentication popup' })
      }
    })
  }

  // Handle Microsoft OAuth callback
  async handleCallback(code: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Use server-side endpoint to handle token exchange
      const response = await fetch('/api/auth/microsoft/callback', {
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

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Authentication failed' }
      }

      const result = await response.json()
      return { success: result.success, user: result.user }
    } catch (error) {
      console.error('Microsoft auth callback error:', error)
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