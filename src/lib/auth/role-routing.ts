import { UserRole } from '@/types'

// Role-based dashboard routing configuration
export const roleBasedRoutes: Record<UserRole, string> = {
  [UserRole.GLOBAL_ADMIN]: '/admin/dashboard',
  [UserRole.WOLTHERS_STAFF]: '/dashboard',
  [UserRole.WOLTHERS_FINANCE]: '/finance/dashboard',
  [UserRole.COMPANY_ADMIN]: '/company/dashboard',
  [UserRole.VISITOR]: '/trips',
  [UserRole.VISITOR_ADMIN]: '/company/trips',
  [UserRole.HOST]: '/host/dashboard',
  [UserRole.DRIVER]: '/driver/schedule',
  [UserRole.GUEST]: '/guest/trips'
}

// Get the appropriate dashboard route for a user role
export function getDashboardRoute(role: UserRole): string {
  return roleBasedRoutes[role] || '/dashboard'
}

// Check if a user has permission to access a route
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Global admins can access everything
  if (userRole === UserRole.GLOBAL_ADMIN) return true

  // Define route permissions
  const routePermissions: Record<string, UserRole[]> = {
    '/admin': [UserRole.GLOBAL_ADMIN],
    '/dashboard': [UserRole.WOLTHERS_STAFF, UserRole.GLOBAL_ADMIN],
    '/finance': [UserRole.WOLTHERS_FINANCE, UserRole.GLOBAL_ADMIN],
    '/trips': [UserRole.VISITOR, UserRole.VISITOR_ADMIN, UserRole.WOLTHERS_STAFF, UserRole.GLOBAL_ADMIN, UserRole.GUEST],
    '/company': [UserRole.COMPANY_ADMIN, UserRole.VISITOR_ADMIN, UserRole.WOLTHERS_STAFF, UserRole.GLOBAL_ADMIN],
    '/host': [UserRole.HOST, UserRole.WOLTHERS_STAFF, UserRole.GLOBAL_ADMIN],
    '/driver': [UserRole.DRIVER, UserRole.WOLTHERS_STAFF, UserRole.GLOBAL_ADMIN],
    '/guest': [UserRole.GUEST]
  }

  // Check if the route starts with any of the protected paths
  for (const [path, allowedRoles] of Object.entries(routePermissions)) {
    if (route.startsWith(path)) {
      return allowedRoles.includes(userRole)
    }
  }

  // Default to allowing access
  return true
}

// Redirect unauthorized users to appropriate page
export function getUnauthorizedRedirect(userRole: UserRole): string {
  return getDashboardRoute(userRole)
}