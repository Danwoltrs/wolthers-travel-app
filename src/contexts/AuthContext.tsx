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
      // First check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setSession(session)
        await loadUserProfile(session.user)
      } else {
        // Check for token-based authentication (Microsoft auth)
        const authToken = localStorage.getItem('auth-token')
        console.log('🌐 Browser check:', {
          userAgent: navigator.userAgent.includes('Edge') ? 'Microsoft Edge' : 'Other browser',
          hasToken: !!authToken,
          tokenLength: authToken?.length || 0
        })
        
        if (authToken) {
          try {
            await loadUserProfileFromToken(authToken)
          } catch (error) {
            console.error('Failed to load user from token:', error)
            localStorage.removeItem('auth-token') // Clear invalid token
            await loadCachedUserProfile()
          }
        } else {
          console.log('🔍 No auth token found, trying cached profile...')
          // Try to load cached user for offline access
          await loadCachedUserProfile()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        
        if (session?.user) {
          await loadUserProfile(session.user)
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

      // Fetch fresh profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
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
    // Map user_type to our role system
    let role = UserRole.GUEST
    if (profile.is_global_admin) {
      role = UserRole.GLOBAL_ADMIN
    } else if (profile.user_type === 'wolthers_staff') {
      role = UserRole.WOLTHERS_STAFF
    } else if (profile.user_type === 'admin') {
      role = UserRole.COMPANY_ADMIN
    } else if (profile.user_type === 'client') {
      role = UserRole.VISITOR
    } else if (profile.user_type === 'driver') {
      role = UserRole.DRIVER
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
    }
    
    setUser(mappedUser)
  }

  const refreshUserProfile = async () => {
    if (session?.user) {
      await loadUserProfile(session.user)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
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
      const redirectUri = `${window.location.origin}/auth/callback`
      
      const authProvider = createMicrosoftAuthProvider(redirectUri)
      const authUrl = authProvider.getAuthUrl()

      // Store the provider instance for callback handling
      sessionStorage.setItem('microsoftAuthProvider', JSON.stringify({
        clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
        tenantId: process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID,
        redirectUri,
      }))

      // Redirect to Microsoft OAuth
      window.location.href = authUrl
      
      return { error: null }
    } catch (error) {
      console.error('Microsoft sign-in error:', error)
      return { error: 'Failed to initiate Microsoft sign-in' }
    }
  }

  const signOut = async () => {
    // Clear both Supabase session and our custom token
    await supabase.auth.signOut()
    localStorage.removeItem('auth-token')
    
    // Clear auth state
    setSession(null)
    setUser(null)
    
    router.push('/')
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