"use client"

import { createContext, useContext, ReactNode, useEffect, useState } from "react"
import { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase, getCachedTrips, getCachedUserProfile, cacheUserProfile, isOnline } from '@/lib/supabase-client'
import { AuthUser, UserRole } from "@/types/index"
import { useRouter } from 'next/navigation'

interface AuthContextType {
  session: Session | null
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isOnline: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>
  signInWithAzure: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  verifyOtp: (email: string, token: string, type: 'email' | 'recovery') => Promise<{ error: AuthError | null }>
  sendOtpLogin: (email: string) => Promise<{ error: string | null }>
  verifyOtpLogin: (email: string, otp: string) => Promise<{ error: string | null; user?: AuthUser | null; otpLogin?: boolean }>
  hasRole: (role: UserRole) => boolean
  hasPermission: (permission: string) => boolean
  isCompanyUser: (companyId?: string) => boolean
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineStatus, setOnlineStatus] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Starting auth initialization...')
      
      // First check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📊 Supabase session check:', { hasSession: !!session?.user })
      
      if (session?.user) {
        console.log('✅ Found Supabase session for:', session.user.email)
        setSession(session)
        await loadUserProfile(session.user)
      } else {
        // Check for session via httpOnly cookie (Microsoft auth flow)
        try {
          console.log('🔍 Checking session via httpOnly cookie...')
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include', // Important: include cookies
          })
          
          if (response.ok) {
            const sessionData = await response.json()
            console.log('📊 Session API response:', { 
              authenticated: sessionData.authenticated,
              hasUser: !!sessionData.user,
              userEmail: sessionData.user?.email,
              userType: sessionData.user?.user_type,
              isGlobalAdmin: sessionData.user?.is_global_admin
            })
            
            if (sessionData.authenticated && sessionData.user) {
              console.log('✅ Found valid session for:', sessionData.user.email)
              
              // Create a session-like object for compatibility
              const mockSession = {
                access_token: sessionData.sessionToken,
                refresh_token: '',
                expires_in: 30 * 24 * 60 * 60,
                token_type: 'Bearer',
                user: {
                  id: sessionData.user.id,
                  email: sessionData.user.email,
                  user_metadata: {},
                  app_metadata: {},
                  aud: '',
                  created_at: '',
                  last_sign_in_at: '',
                  confirmed_at: '',
                  email_confirmed_at: '',
                  phone: '',
                  role: ''
                }
              }
              
              setSession(mockSession as any)
              mapUserProfile(sessionData.user, null)
              
              // Cache the user profile for offline access
              cacheUserProfile(sessionData.user)
              
              // Also store token in localStorage for compatibility with existing code
              localStorage.setItem('auth-token', sessionData.sessionToken)
            } else {
              console.log('❌ No valid session found')
              await handleNoSession()
            }
          } else {
            console.log('❌ Session check failed, status:', response.status)
            await handleNoSession()
          }
        } catch (error) {
          console.error('❌ Session check error:', error)
          await handleNoSession()
        }
      }
      setIsLoading(false)
    }

    const handleNoSession = async () => {
      // Check localStorage as fallback for existing tokens
      const authToken = localStorage.getItem('auth-token')
      console.log('🔍 Fallback: checking localStorage token...', { hasToken: !!authToken })
      
      if (authToken) {
        try {
          await loadUserProfileFromToken(authToken)
        } catch (error) {
          console.error('Failed to load user from localStorage token:', error)
          localStorage.removeItem('auth-token') // Clear invalid token
          await loadCachedUserProfile()
        }
      } else {
        console.log('🔍 No auth token found, trying cached profile...')
        // Try to load cached user for offline access
        await loadCachedUserProfile()
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        
        if (session?.user) {
          await loadUserProfile(session.user)
          
          // Store Supabase session token for API compatibility
          if (session.access_token && typeof window !== 'undefined') {
            // For Supabase sessions, store the access token
            // JWT sessions from email/password or Microsoft OAuth are already stored
            const existingToken = localStorage.getItem('auth-token')
            if (!existingToken) {
              localStorage.setItem('auth-token', session.access_token)
              console.log('🗺️ Stored Supabase session token for API calls')
            }
          }
          
          // Redirect to dashboard after successful authentication
          if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            // Only redirect if on auth pages, not on trip pages
            if (currentPath.includes('/auth/')) {
              window.location.href = '/dashboard'
            }
            // If on a trip page, just stay there (the page will refresh to show authenticated content)
          }
        } else {
          setUser(null)
          // Clear cached data on sign out
          if (typeof window !== 'undefined') {
            localStorage.removeItem('trip_cache')
            localStorage.removeItem('user_profile_cache')
            localStorage.removeItem('auth-token')
            console.log('🗺️ Cleared all authentication tokens')
          }
        }
        
        setIsLoading(false)
      }
    )

    // Listen for online/offline status
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)
    
    if (typeof window !== 'undefined') {
      setOnlineStatus(navigator.onLine)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      subscription.unsubscribe()
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const loadUserProfile = async (authUser: User) => {
    try {
      if (!isOnline()) {
        // Load from cache when offline
        const cachedProfile = getCachedUserProfile()
        if (cachedProfile) {
          mapUserProfile(cachedProfile, authUser)
          return
        }
      }

      // Fetch fresh profile from database with company information
      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name,
            category
          )
        `)
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.warn('Failed to load user profile:', error)
        // Create minimal user from auth data
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email || '',
          image: authUser.user_metadata?.avatar_url || undefined,
          role: UserRole.GUEST,
          companyId: undefined,
          permissions: {},
          azure_id: authUser.user_metadata?.azure_id || undefined,
          preferred_username: authUser.user_metadata?.preferred_username || undefined,
        })
        return
      }

      mapUserProfile(profile, authUser)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadCachedUserProfile = () => {
    const cachedProfile = getCachedUserProfile()
    if (cachedProfile) {
      mapUserProfile(cachedProfile, null)
    }
  }

  const loadUserProfileFromToken = async (token: string) => {
    // First try to verify online
    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Invalid token')
      }

      const { user } = await response.json()
      
      // Cache user profile for offline access
      cacheUserProfile(user)
      
      // Create session-like object for consistency
      setSession({
        access_token: token,
        refresh_token: '',
        expires_in: 30 * 24 * 60 * 60,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {},
          app_metadata: {},
          aud: '',
          created_at: '',
          last_sign_in_at: '',
          confirmed_at: '',
          email_confirmed_at: '',
          phone: '',
          role: ''
        }
      } as any)

      // Map the user profile
      mapUserProfile(user, null)
    } catch (error) {
      // If online verification fails, try to use cached profile for offline access
      console.log('Online verification failed, checking cached profile for offline access')
      const cachedProfile = getCachedUserProfile()
      if (cachedProfile) {
        // Create session-like object for consistency
        setSession({
          access_token: token,
          refresh_token: '',
          expires_in: 30 * 24 * 60 * 60,
          token_type: 'Bearer',
          user: {
            id: cachedProfile.id,
            email: cachedProfile.email,
            user_metadata: {},
            app_metadata: {},
            aud: '',
            created_at: '',
            last_sign_in_at: '',
            confirmed_at: '',
            email_confirmed_at: '',
            phone: '',
            role: ''
          }
        } as any)

        // Map the cached user profile
        mapUserProfile(cachedProfile, null)
        console.log('Using cached profile for offline access:', cachedProfile.email)
      } else {
        throw error // Re-throw if no cached profile available
      }
    }
  }

  const mapUserProfile = (profile: any, authUser: User | null) => {
    console.log('🔄 mapUserProfile called with:', {
      email: profile.email,
      user_type: profile.user_type,
      is_global_admin: profile.is_global_admin,
      company_id: profile.company_id,
      profileKeys: Object.keys(profile)
    })
    
    // Map user_type to our role system
    let role = UserRole.GUEST
    if (profile.is_global_admin) {
      role = UserRole.GLOBAL_ADMIN
      console.log('🔑 Role mapped to GLOBAL_ADMIN')
    } else if (profile.user_type === 'wolthers_staff') {
      role = UserRole.WOLTHERS_STAFF
      console.log('🔑 Role mapped to WOLTHERS_STAFF')
    } else if (profile.user_type === 'admin') {
      role = UserRole.COMPANY_ADMIN
      console.log('🔑 Role mapped to COMPANY_ADMIN')
    } else if (profile.user_type === 'client') {
      role = UserRole.VISITOR
      console.log('🔑 Role mapped to VISITOR')
    } else if (profile.user_type === 'driver') {
      role = UserRole.DRIVER
      console.log('🔑 Role mapped to DRIVER')
    } else {
      console.log('🔑 No role match found, defaulting to GUEST. user_type:', profile.user_type)
    }

    // Create permissions based on database flags
    const permissions: Record<string, boolean> = {
      view_all_trips: profile.can_view_all_trips || false,
      view_company_trips: profile.can_view_company_trips || false,
      manage_users: profile.is_global_admin || false,
      manage_companies: profile.is_global_admin || false,
    }

    const mappedUser: AuthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || (authUser?.email || ''),
      image: authUser?.user_metadata?.avatar_url || undefined,
      role,
      companyId: profile.company_id || undefined,
      permissions,
      azure_id: profile.microsoft_oauth_id || authUser?.user_metadata?.azure_id || undefined,
      preferred_username: authUser?.user_metadata?.preferred_username || undefined,
      // Include all database fields for profile management - maintain both name AND full_name for consistency
      full_name: profile.full_name, // Keep this for UserProfileSection compatibility
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      timezone: profile.timezone,
      last_login_at: profile.last_login_at,
      last_login_timezone: profile.last_login_timezone,
      last_login_provider: profile.last_login_provider,
      last_profile_update: profile.last_profile_update,
      user_type: profile.user_type,
      is_global_admin: profile.is_global_admin,
      can_view_all_trips: profile.can_view_all_trips,
      can_view_company_trips: profile.can_view_company_trips,
      microsoft_oauth_id: profile.microsoft_oauth_id,
      company_name: profile.company_name,
      company_category: profile.companies?.category || null,
      notification_preferences: profile.notification_preferences,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
    
    console.log('🔄 AuthContext: Mapped user profile with full_name:', mappedUser.full_name)
    console.log('🏢 AuthContext: Final user companyId:', mappedUser.companyId)
    setUser(mappedUser)
  }

  const refreshUserProfile = async () => {
    console.log('🔄 Refreshing user profile...', { hasSession: !!session?.user, userId: session?.user?.id, currentUserEmail: user?.email })
    
    try {
      if (session?.user) {
        console.log('🔄 Refreshing via Supabase session...')
        await loadUserProfile(session.user)
      } else {
        // For users authenticated via Microsoft OAuth or JWT tokens
        const authToken = localStorage.getItem('auth-token')
        if (authToken) {
          console.log('🔄 Refreshing via stored auth token...')
          await loadUserProfileFromToken(authToken)
        } else {
          console.warn('🔄 No session or auth token available for refresh')
        }
      }
      console.log('✅ Profile refresh completed successfully')
    } catch (error) {
      console.error('❌ Profile refresh failed:', error)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Use our custom login API that creates JWT tokens
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for httpOnly token
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return { error: { message: data.error || 'Login failed' } as any }
      }

      // Store token for API calls
      if (data.sessionToken) {
        localStorage.setItem('auth-token', data.sessionToken)
        console.log('🗺️ Stored JWT session token for API calls')
      }

      // Create session-like object for compatibility
      const mockSession = {
        access_token: data.sessionToken,
        refresh_token: '',
        expires_in: 30 * 24 * 60 * 60,
        token_type: 'Bearer',
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: {},
          app_metadata: {},
          aud: '',
          created_at: '',
          last_sign_in_at: '',
          confirmed_at: '',
          email_confirmed_at: '',
          phone: '',
          role: ''
        }
      }
      
      setSession(mockSession as any)
      mapUserProfile(data.user, null)
      
      // Cache the user profile for offline access
      cacheUserProfile(data.user)

      return { error: null as any }
    } catch (error) {
      console.error('Email sign-in error:', error)
      return { error: { message: 'Network error during login' } as any }
    }
  }

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const signInWithAzure = async () => {
    try {
      const { createMicrosoftAuthProvider } = await import('@/lib/microsoft-auth')
      
      // Always use the server-side API endpoint for consistency
      const redirectUri = `${window.location.origin}/api/auth/callback/microsoft`
      
      const authProvider = createMicrosoftAuthProvider(redirectUri)
      const authUrl = authProvider.getAuthUrl()

      console.log('🔗 Azure sign-in redirecting to:', { redirectUri })

      // Redirect to Microsoft OAuth
      window.location.href = authUrl
      
      return { error: null }
    } catch (error) {
      console.error('Microsoft sign-in error:', error)
      return { error: 'Failed to initiate Microsoft sign-in' }
    }
  }

  const signOut = async () => {
    try {
      // Clear both Supabase session and our custom token
      await supabase.auth.signOut()
      localStorage.removeItem('auth-token')
      
      // Clear the httpOnly cookie by calling logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore errors, we're logging out anyway
      })
      
      // Clear auth state
      setSession(null)
      setUser(null)
      
      // Clear cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('trip_cache')
        localStorage.removeItem('user_profile_cache')
      }
      
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      // Still clear local state even if server request fails
      setSession(null)
      setUser(null)
      router.push('/')
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  }

  const verifyOtp = async (email: string, token: string, type: 'email' | 'recovery') => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    })
    return { error }
  }

  const sendOtpLogin = async (email: string) => {
    try {
      const response = await fetch('/api/auth/otp-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'send',
          email: email.toLowerCase()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to send login code' };
      }

      return { error: null };
    } catch (error) {
      console.error('Send OTP login error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  const verifyOtpLogin = async (email: string, otp: string) => {
    try {
      const response = await fetch('/api/auth/otp-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'verify',
          email: email.toLowerCase(),
          otp: otp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Invalid login code' };
      }

      if (data.success && data.user) {
        // Update the local user state
        setUser(data.user);
        setSession({ user: data.user } as Session);
        
        return { 
          error: null, 
          user: data.user, 
          otpLogin: data.user.otp_login 
        };
      }

      return { error: 'Login failed' };
    } catch (error) {
      console.error('Verify OTP login error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  const hasRole = (role: UserRole): boolean => {
    if (!user?.role) return false
    
    // Role hierarchy check
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.GUEST]: 0,
      [UserRole.VISITOR]: 1,
      [UserRole.VISITOR_ADMIN]: 2,
      [UserRole.HOST]: 2,
      [UserRole.DRIVER]: 2,
      [UserRole.COMPANY_ADMIN]: 3,
      [UserRole.WOLTHERS_STAFF]: 4,
      [UserRole.WOLTHERS_FINANCE]: 4,
      [UserRole.GLOBAL_ADMIN]: 5,
    }

    return roleHierarchy[user.role] >= roleHierarchy[role]
  }

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false
    return user.permissions[permission] === true
  }

  const isCompanyUser = (companyId?: string): boolean => {
    if (!user?.companyId) return false
    return companyId ? user.companyId === companyId : true
  }

  const contextValue: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    isOnline: onlineStatus,
    signInWithEmail,
    signInWithOtp,
    signInWithAzure,
    signOut,
    resetPassword,
    verifyOtp,
    sendOtpLogin,
    verifyOtpLogin,
    hasRole,
    hasPermission,
    isCompanyUser,
    refreshUserProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Additional custom hooks for common auth patterns
export function useRequireAuth(redirectUrl = "/") {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectUrl)
    }
  }, [isAuthenticated, isLoading, router, redirectUrl])
  
  return { isAuthenticated, isLoading }
}

export function useRequireRole(requiredRole: UserRole) {
  const { hasRole, isLoading } = useAuth()
  const hasRequiredRole = hasRole(requiredRole)
  
  return { hasRequiredRole, isLoading }
}

export function useUserPermissions() {
  const { user, hasPermission, hasRole, isCompanyUser } = useAuth()
  
  return {
    user,
    hasPermission,
    hasRole,
    isCompanyUser,
    isGlobalAdmin: hasRole(UserRole.GLOBAL_ADMIN),
    isWolthersStaff: hasRole(UserRole.WOLTHERS_STAFF),
    isCompanyAdmin: hasRole(UserRole.COMPANY_ADMIN),
    isClientUser: hasRole(UserRole.VISITOR),
    isDriver: hasRole(UserRole.DRIVER),
  }
}

// Hook for offline-aware data access
export function useOfflineData() {
  const { isOnline } = useAuth()
  
  const getTrips = async () => {
    if (!isOnline) {
      return getCachedTrips() || []
    }
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      
    if (error) {
      console.warn('Failed to fetch trips, falling back to cache')
      return getCachedTrips() || []
    }
    
    return data || []
  }
  
  return {
    isOnline,
    getTrips,
  }
}