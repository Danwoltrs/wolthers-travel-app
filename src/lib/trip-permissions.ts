import { createServerSupabaseClient } from '@/lib/supabase-server'

export type TripPermission = 'view' | 'edit' | 'admin'

export interface TripPermissionResult {
  hasAccess: boolean
  permissions: TripPermission[]
  canEdit: boolean
  canAdmin: boolean
  reason?: string
}

export class TripPermissionService {
  private supabase

  constructor() {
    this.supabase = createServerSupabaseClient()
  }

  /**
   * Check if a user has access to a trip and what level of access
   */
  async checkTripAccess(userId: string, tripId: string): Promise<TripPermissionResult> {
    try {
      // Get user information
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return {
          hasAccess: false,
          permissions: [],
          canEdit: false,
          canAdmin: false,
          reason: 'User not found'
        }
      }

      // Get trip with related permission data
      const { data: trip, error: tripError } = await this.supabase
        .from('trips')
        .select(`
          *,
          trip_access_permissions!inner(user_id, permission_type, expires_at, granted_by),
          trip_participants!inner(user_id, company_id, role)
        `)
        .eq('id', tripId)
        .single()

      if (tripError || !trip) {
        return {
          hasAccess: false,
          permissions: [],
          canEdit: false,
          canAdmin: false,
          reason: 'Trip not found'
        }
      }

      let permissions: TripPermission[] = []
      let accessReasons: string[] = []

      // 1. Creator always has full access
      if (trip.creator_id === userId) {
        permissions = ['view', 'edit', 'admin']
        accessReasons.push('trip creator')
      }

      // 2. Global admin has full access
      if (user.is_global_admin) {
        permissions = ['view', 'edit', 'admin']
        accessReasons.push('global admin')
      }

      // 3. Check explicit trip permissions
      const explicitPermission = trip.trip_access_permissions?.find((perm: any) =>
        perm.user_id === userId &&
        (!perm.expires_at || new Date(perm.expires_at) > new Date())
      )

      if (explicitPermission) {
        permissions.push('view')
        if (['edit', 'admin'].includes(explicitPermission.permission_type)) {
          permissions.push('edit')
        }
        if (explicitPermission.permission_type === 'admin') {
          permissions.push('admin')
        }
        accessReasons.push('explicit permission')
      }

      // 4. Check if user is a trip participant
      const userParticipation = trip.trip_participants?.find((tp: any) => tp.user_id === userId)
      if (userParticipation) {
        if (!permissions.includes('view')) {
          permissions.push('view')
        }
        accessReasons.push('trip participant')
      }

      // 5. Check company-based permissions
      if (user.company_id) {
        // Check if user's company is participating in the trip
        const companyParticipation = trip.trip_participants?.find((tp: any) => 
          tp.company_id === user.company_id
        )

        if (companyParticipation) {
          // Get company role information
          const { data: companyRole } = await this.supabase
            .from('company_user_roles')
            .select('*')
            .eq('company_id', user.company_id)
            .eq('user_id', userId)
            .single()

          if (companyRole) {
            if (!permissions.includes('view')) {
              permissions.push('view')
            }

            if (companyRole.role === 'admin' || companyRole.can_edit_all_company_trips) {
              if (!permissions.includes('edit')) {
                permissions.push('edit')
              }
              accessReasons.push('company admin')
            }

            if (!accessReasons.includes('trip participant')) {
              accessReasons.push('company member')
            }
          }
        }

        // Check if user has company-wide trip viewing permissions
        if (user.can_view_company_trips && companyParticipation) {
          if (!permissions.includes('view')) {
            permissions.push('view')
          }
          accessReasons.push('company trip viewer')
        }
      }

      // 6. Check global trip viewing permissions
      if (user.can_view_all_trips) {
        if (!permissions.includes('view')) {
          permissions.push('view')
        }
        accessReasons.push('global trip viewer')
      }

      // Remove duplicates
      permissions = [...new Set(permissions)]

      const result: TripPermissionResult = {
        hasAccess: permissions.length > 0,
        permissions,
        canEdit: permissions.includes('edit'),
        canAdmin: permissions.includes('admin'),
        reason: accessReasons.join(', ')
      }

      return result

    } catch (error) {
      console.error('Error checking trip access:', error)
      return {
        hasAccess: false,
        permissions: [],
        canEdit: false,
        canAdmin: false,
        reason: 'Permission check failed'
      }
    }
  }

  /**
   * Grant access permission to a user for a specific trip
   */
  async grantAccess(
    tripId: string, 
    userId: string, 
    grantedByUserId: string,
    permission: TripPermission = 'view',
    expiresAt?: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if the granter has permission to grant access
      const granterPermission = await this.checkTripAccess(grantedByUserId, tripId)
      
      if (!granterPermission.canAdmin && granterPermission.permissions.length === 0) {
        return {
          success: false,
          error: 'You do not have permission to grant access to this trip'
        }
      }

      // Check if trip creator or global admin
      const { data: trip } = await this.supabase
        .from('trips')
        .select('creator_id')
        .eq('id', tripId)
        .single()

      const { data: granter } = await this.supabase
        .from('users')
        .select('is_global_admin')
        .eq('id', grantedByUserId)
        .single()

      const canGrant = 
        trip?.creator_id === grantedByUserId || 
        granter?.is_global_admin === true ||
        granterPermission.canAdmin

      if (!canGrant) {
        return {
          success: false,
          error: 'Insufficient permissions to grant access'
        }
      }

      // Grant the permission
      const { error } = await this.supabase
        .from('trip_access_permissions')
        .upsert({
          trip_id: tripId,
          user_id: userId,
          permission_type: permission,
          granted_by: grantedByUserId,
          expires_at: expiresAt?.toISOString()
        }, {
          onConflict: 'trip_id,user_id'
        })

      if (error) {
        return {
          success: false,
          error: 'Failed to grant permission: ' + error.message
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error granting access:', error)
      return {
        success: false,
        error: 'Failed to grant access'
      }
    }
  }

  /**
   * Remove access permission from a user for a specific trip
   */
  async revokeAccess(
    tripId: string, 
    userId: string, 
    revokedByUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if the revoker has permission to revoke access
      const revokerPermission = await this.checkTripAccess(revokedByUserId, tripId)
      
      if (!revokerPermission.canAdmin) {
        // Users can revoke their own access
        if (userId !== revokedByUserId) {
          return {
            success: false,
            error: 'You do not have permission to revoke access to this trip'
          }
        }
      }

      const { error } = await this.supabase
        .from('trip_access_permissions')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', userId)

      if (error) {
        return {
          success: false,
          error: 'Failed to revoke permission: ' + error.message
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error revoking access:', error)
      return {
        success: false,
        error: 'Failed to revoke access'
      }
    }
  }

  /**
   * Get all users who have access to a specific trip
   */
  async getTripAccessList(tripId: string, requesterId: string) {
    try {
      // Check if requester has permission to view access list
      const requesterPermission = await this.checkTripAccess(requesterId, tripId)
      
      if (!requesterPermission.hasAccess) {
        return {
          success: false,
          error: 'You do not have permission to view this trip\'s access list'
        }
      }

      // Get all users with access
      const { data: accessList, error } = await this.supabase
        .from('trip_access_permissions')
        .select(`
          *,
          users!trip_access_permissions_user_id_fkey(id, full_name, email),
          granted_by_user:users!trip_access_permissions_granted_by_fkey(full_name, email)
        `)
        .eq('trip_id', tripId)

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch access list: ' + error.message
        }
      }

      return {
        success: true,
        data: accessList || []
      }

    } catch (error) {
      console.error('Error getting trip access list:', error)
      return {
        success: false,
        error: 'Failed to get access list'
      }
    }
  }

  /**
   * Get all trips accessible by a user
   */
  async getAccessibleTrips(userId: string) {
    try {
      const { data: user } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      let query = this.supabase
        .from('trips')
        .select(`
          *,
          trip_participants(user_id, company_id, role),
          trip_access_permissions(user_id, permission_type, expires_at)
        `)

      // Build conditions based on user permissions
      const conditions = []

      // Creator trips
      conditions.push(`creator_id.eq.${userId}`)

      // Global admin sees all
      if (user.is_global_admin) {
        const { data: trips, error } = await this.supabase
          .from('trips')
          .select('*')
        
        return {
          success: true,
          data: trips || []
        }
      }

      // Trips with explicit permissions
      conditions.push(`trip_access_permissions.user_id.eq.${userId}`)

      // Trips as participant
      conditions.push(`trip_participants.user_id.eq.${userId}`)

      // Company trips if user has company access
      if (user.can_view_company_trips && user.company_id) {
        conditions.push(`trip_participants.company_id.eq.${user.company_id}`)
      }

      // This is a simplified version - in practice, you'd want to use a more complex query
      // or handle this logic in the RLS policies
      const { data: trips, error } = await this.supabase
        .from('trips')
        .select(`
          *,
          trip_participants(user_id, company_id, role),
          trip_access_permissions(user_id, permission_type, expires_at)
        `)

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch trips: ' + error.message
        }
      }

      // Filter trips based on access permissions (this would be better handled by RLS)
      const accessibleTrips = []
      
      for (const trip of trips || []) {
        const access = await this.checkTripAccess(userId, trip.id)
        if (access.hasAccess) {
          accessibleTrips.push({
            ...trip,
            _permissions: access.permissions
          })
        }
      }

      return {
        success: true,
        data: accessibleTrips
      }

    } catch (error) {
      console.error('Error getting accessible trips:', error)
      return {
        success: false,
        error: 'Failed to get accessible trips'
      }
    }
  }
}

// Export a singleton instance
export const tripPermissionService = new TripPermissionService()