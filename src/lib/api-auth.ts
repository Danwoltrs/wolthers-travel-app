import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * User data returned from authentication
 */
export interface AuthenticatedUser {
  id: string
  email: string
  full_name: string
  user_type: string
  is_global_admin: boolean
  company_id?: string
  can_view_cost_data: boolean
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
  statusCode?: number
}

/**
 * Data filtering options for financial data
 */
export interface DataFilterOptions {
  excludeCostFields?: boolean
  includeFinancialData?: boolean
}

/**
 * Authenticates and authorizes API requests with comprehensive role-based access control
 * @param request - The incoming NextRequest
 * @returns Promise<AuthResult> - Authentication and authorization result
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for auth token in cookies
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      console.log('🔒 API Auth: No auth-token cookie found')
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      }
    }

    // Verify JWT token
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let decoded: any
    
    try {
      decoded = verify(authToken, secret) as any
      console.log('🔑 API Auth: JWT Token decoded successfully for userId:', decoded.userId)
    } catch (jwtError: any) {
      console.log('🔒 API Auth: JWT verification failed:', jwtError.message)
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401
      }
    }

    // Get user data from database using service role client
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, email, full_name, user_type, is_global_admin, company_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      console.log('🔒 API Auth: User lookup failed:', userError?.message || 'User not found')
      return {
        success: false,
        error: 'User not found or invalid',
        statusCode: 401
      }
    }

    // Determine cost data access permissions
    const canViewCostData = canUserAccessCostData(userData)
    
    const authenticatedUser: AuthenticatedUser = {
      ...userData,
      can_view_cost_data: canViewCostData
    }

    console.log('✅ API Auth: Successfully authenticated user:', {
      email: userData.email,
      user_type: userData.user_type,
      is_global_admin: userData.is_global_admin,
      can_view_cost_data: canViewCostData,
      company_id: userData.company_id
    })

    return {
      success: true,
      user: authenticatedUser
    }

  } catch (error) {
    console.error('💥 API Auth: Unexpected authentication error:', error)
    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    }
  }
}

/**
 * Determines if a user can access cost/financial data based on their role
 * @param user - User data from database
 * @returns boolean - Whether user can access cost data
 */
export function canUserAccessCostData(user: { 
  user_type: string
  is_global_admin: boolean
  company_id?: string 
}): boolean {
  const WOLTHERS_COMPANY_ID = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
  
  // Global admins always have access
  if (user.is_global_admin) {
    console.log('🔓 Cost Access: GRANTED - Global Admin')
    return true
  }

  // WOLTHERS_FINANCE role has access
  if (user.user_type === 'wolthers_finance') {
    console.log('🔓 Cost Access: GRANTED - Wolthers Finance Role')
    return true
  }

  // Log access denial for audit purposes
  console.log('🔒 Cost Access: DENIED - User type:', user.user_type, 'Company ID:', user.company_id)
  return false
}

/**
 * Filters trip data to exclude cost fields for unauthorized users
 * @param trips - Array of trip data
 * @param canViewCosts - Whether user can view cost data
 * @returns Filtered trip data
 */
export function filterTripCostData(trips: any[], canViewCosts: boolean): any[] {
  if (canViewCosts) {
    return trips // Return full data including costs
  }

  // Remove cost-sensitive fields for unauthorized users
  return trips.map(trip => {
    const filteredTrip = { ...trip }
    delete filteredTrip.total_cost
    delete filteredTrip.estimated_budget
    delete filteredTrip.actual_cost
    delete filteredTrip.cost_breakdown
    delete filteredTrip.expenses
    return filteredTrip
  })
}

/**
 * Filters chart/analytics data to exclude cost information for unauthorized users
 * @param data - Chart data object
 * @param canViewCosts - Whether user can view cost data
 * @returns Filtered chart data
 */
export function filterChartCostData(data: any, canViewCosts: boolean): any {
  if (canViewCosts) {
    return data // Return full data including costs
  }

  // Create filtered copy without cost data
  const filteredData = { ...data }

  // Remove cost data from trends data
  if (filteredData.trendsData) {
    filteredData.trendsData = {
      ...filteredData.trendsData,
      totalCost: 0, // Set to 0 instead of removing for API compatibility
      monthlyData: filteredData.trendsData.monthlyData?.map((month: any) => ({
        ...month,
        totalCost: 0 // Remove individual month costs
      })) || []
    }
  }

  // Heatmap data doesn't contain costs, so it's safe to leave as-is
  
  return filteredData
}

/**
 * Returns a standardized authentication error response
 * @param error - Error message
 * @param statusCode - HTTP status code (default: 401)
 * @returns NextResponse with error
 */
export function createAuthErrorResponse(error: string, statusCode: number = 401): NextResponse {
  console.log(`🔒 API Auth Error: ${error} (Status: ${statusCode})`)
  return NextResponse.json(
    { 
      error,
      authenticated: false,
      timestamp: new Date().toISOString()
    }, 
    { status: statusCode }
  )
}

/**
 * Logs security events for audit purposes
 * @param event - Security event type
 * @param user - User information (if available)
 * @param details - Additional event details
 */
export function logSecurityEvent(
  event: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'COST_ACCESS_GRANTED' | 'COST_ACCESS_DENIED' | 'UNAUTHORIZED_REQUEST',
  user?: AuthenticatedUser | null,
  details?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    user: user ? {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      company_id: user.company_id
    } : null,
    details
  }

  console.log('🔐 SECURITY LOG:', JSON.stringify(logEntry))
  
  // In production, you might want to send this to a proper logging service
  // or security information and event management (SIEM) system
}