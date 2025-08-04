"use client"

import { createContext, useContext, ReactNode } from "react"
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react"
import { Session } from "next-auth"
import { AuthUser, UserRole } from "@/types/index"

interface AuthContextType {
  session: Session | null
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: typeof signIn
  signOut: typeof signOut
  hasRole: (role: UserRole) => boolean
  hasPermission: (permission: string) => boolean
  isCompanyUser: (companyId?: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  session?: Session | null
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const isAuthenticated = !!session?.user

  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role,
    companyId: session.user.companyId,
    permissions: session.user.permissions,
    azure_id: session.user.azure_id,
    preferred_username: session.user.preferred_username,
  } : null

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
    isAuthenticated,
    signIn,
    signOut,
    hasRole,
    hasPermission,
    isCompanyUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
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
export function useRequireAuth(redirectUrl = "/auth/signin") {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (!isLoading && !isAuthenticated) {
    signIn(undefined, { callbackUrl: window.location.href })
  }
  
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