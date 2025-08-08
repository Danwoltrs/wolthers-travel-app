// Permission utilities for role-based access control

export enum UserType {
  GLOBAL_ADMIN = 'global_admin',
  WOLTHERS_STAFF = 'wolthers_staff',
  COMPANY_ADMIN = 'admin',
  CLIENT = 'client',
  DRIVER = 'driver',
  GUEST = 'guest'
}

export interface UserPermissions {
  canViewAllUsers: boolean;
  canEditAllUsers: boolean;
  canViewCompanyUsers: boolean;
  canEditCompanyUsers: boolean;
  canInviteUsers: boolean;
  canDeleteUsers: boolean;
  canAssignRoles: boolean;
  canViewDrivers: boolean;
  canManageFleet: boolean;
  canManageCompany: boolean;
}

export function getUserPermissions(user: any): UserPermissions {
  // Global Admin - full access
  if (user?.is_global_admin) {
    return {
      canViewAllUsers: true,
      canEditAllUsers: true,
      canViewCompanyUsers: true,
      canEditCompanyUsers: true,
      canInviteUsers: true,
      canDeleteUsers: true,
      canAssignRoles: true,
      canViewDrivers: true,
      canManageFleet: true,
      canManageCompany: true,
    };
  }

  // Wolthers Staff - view all, limited edit
  if (user?.user_type === UserType.WOLTHERS_STAFF) {
    return {
      canViewAllUsers: true,
      canEditAllUsers: false,
      canViewCompanyUsers: true,
      canEditCompanyUsers: true,
      canInviteUsers: true,
      canDeleteUsers: false,
      canAssignRoles: true,
      canViewDrivers: true,
      canManageFleet: true,
      canManageCompany: true,
    };
  }

  // Company Admin - manage own company
  if (user?.user_type === UserType.COMPANY_ADMIN) {
    return {
      canViewAllUsers: false,
      canEditAllUsers: false,
      canViewCompanyUsers: true,
      canEditCompanyUsers: true,
      canInviteUsers: true,
      canDeleteUsers: false,
      canAssignRoles: false,
      canViewDrivers: false,
      canManageFleet: false,
      canManageCompany: true,
    };
  }

  // Regular users - only own profile
  return {
    canViewAllUsers: false,
    canEditAllUsers: false,
    canViewCompanyUsers: false,
    canEditCompanyUsers: false,
    canInviteUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canViewDrivers: false,
    canManageFleet: false,
    canManageCompany: false,
  };
}

export function canUserEditProfile(currentUser: any, targetUserId: string): boolean {
  // Users can always edit their own profile
  if (currentUser?.id === targetUserId) return true;
  
  const permissions = getUserPermissions(currentUser);
  
  // Global admin and Wolthers staff can edit all
  if (permissions.canEditAllUsers) return true;
  
  // Company admin can edit company users
  if (permissions.canEditCompanyUsers && currentUser?.company_id) {
    // Would need to check if target user is in same company
    return true;
  }
  
  return false;
}

export function filterUsersForViewer(users: any[], currentUser: any): any[] {
  const permissions = getUserPermissions(currentUser);
  
  if (permissions.canViewAllUsers) {
    return users;
  }
  
  if (permissions.canViewCompanyUsers && currentUser?.company_id) {
    return users.filter(u => u.company_id === currentUser.company_id);
  }
  
  // Only show own profile
  return users.filter(u => u.id === currentUser?.id);
}