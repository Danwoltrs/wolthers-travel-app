"use client"

import { useSession } from "next-auth/react"
import { UserRole } from "@/types/index"

/**
 * Simplified auth hook that wraps NextAuth's useSession
 * Use this for basic authentication checks
 */
export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    session,
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    status,
  }
}

/**
 * Hook for checking user roles and permissions
 */
export function usePermissions() {
  const { session } = useAuth()
  const user = session?.user

  const hasRole = (role: UserRole): boolean => {
    if (!user?.role) return false
    
    // Role hierarchy - higher numbers have more permissions
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

  const canAccessTrip = (tripCreatorId: string, tripCompanyIds: string[] = []): boolean => {
    if (!user) return false
    
    // Global admin and Wolthers staff can access all trips
    if (hasRole(UserRole.GLOBAL_ADMIN) || hasRole(UserRole.WOLTHERS_STAFF)) {
      return true
    }
    
    // Trip creator can access their own trips
    if (user.id === tripCreatorId) {
      return true
    }
    
    // Company admin can access trips associated with their company
    if (hasRole(UserRole.COMPANY_ADMIN) && user.companyId) {
      return tripCompanyIds.includes(user.companyId)
    }
    
    // Client users can only access trips associated with their company
    if (hasRole(UserRole.VISITOR) && user.companyId) {
      return tripCompanyIds.includes(user.companyId)
    }
    
    return false
  }

  const canManageUsers = (): boolean => {
    return hasRole(UserRole.GLOBAL_ADMIN) || hasRole(UserRole.WOLTHERS_STAFF)
  }

  const canManageCompanies = (): boolean => {
    return hasRole(UserRole.GLOBAL_ADMIN) || hasRole(UserRole.WOLTHERS_STAFF)
  }

  const canManageFleet = (): boolean => {
    return hasRole(UserRole.GLOBAL_ADMIN) || hasRole(UserRole.WOLTHERS_STAFF)
  }

  const canCreateTrips = (): boolean => {
    return hasRole(UserRole.COMPANY_ADMIN) || hasRole(UserRole.WOLTHERS_STAFF) || hasRole(UserRole.GLOBAL_ADMIN)
  }

  const canEditTrip = (tripCreatorId: string, tripCompanyIds: string[] = []): boolean => {
    if (!user) return false
    
    // Global admin and Wolthers staff can edit all trips
    if (hasRole(UserRole.GLOBAL_ADMIN) || hasRole(UserRole.WOLTHERS_STAFF)) {
      return true
    }
    
    // Trip creator can edit their own trips
    if (user.id === tripCreatorId) {
      return true
    }
    
    // Company admin can edit trips associated with their company
    if (hasRole(UserRole.COMPANY_ADMIN) && user.companyId) {
      return tripCompanyIds.includes(user.companyId)
    }
    
    return false
  }

  return {
    user,
    hasRole,
    hasPermission,
    isCompanyUser,
    canAccessTrip,
    canManageUsers,
    canManageCompanies,
    canManageFleet,
    canCreateTrips,
    canEditTrip,
    // Quick role checks
    isGlobalAdmin: hasRole(UserRole.GLOBAL_ADMIN),
    isWolthersStaff: hasRole(UserRole.WOLTHERS_STAFF),
    isCompanyAdmin: hasRole(UserRole.COMPANY_ADMIN),
    isClientUser: hasRole(UserRole.VISITOR),
    isDriver: hasRole(UserRole.DRIVER),
    isGuest: hasRole(UserRole.GUEST),
  }
}