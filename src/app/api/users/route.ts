import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_REQUESTS = 20
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(identifier)
  
  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userRequests.count >= RATE_LIMIT_REQUESTS) {
    return false
  }
  
  userRequests.count++
  return true
}

// Admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Enhanced validation functions
function validateUserData(updates: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Name validation
  if (updates.full_name !== undefined) {
    if (!updates.full_name || typeof updates.full_name !== 'string' || !updates.full_name.trim()) {
      errors.push('Full name is required and cannot be empty')
    } else if (updates.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long')
    } else if (updates.full_name.trim().length > 100) {
      errors.push('Full name cannot exceed 100 characters')
    }
  }
  
  // Phone validation
  if (updates.phone !== undefined && updates.phone) {
    if (!/^[+]?[0-9\s\-\(\)]{7,}$/.test(updates.phone)) {
      errors.push('Please enter a valid phone number')
    }
  }
  
  // WhatsApp validation
  if (updates.whatsapp !== undefined && updates.whatsapp) {
    if (!/^\+\d{1,4}\s?\d{2,}\s?\d[\d\s\-\(\)]*$/.test(updates.whatsapp)) {
      errors.push('WhatsApp number must include country code (e.g., +55 13 98123 9867)')
    } else {
      const digitsOnly = updates.whatsapp.replace(/[^\d]/g, '')
      if (digitsOnly.length < 8) {
        errors.push('WhatsApp number too short - must include country code')
      }
    }
  }
  
  // User type validation
  if (updates.user_type !== undefined) {
    const validUserTypes = ['guest', 'client', 'driver', 'admin', 'wolthers_staff']
    if (!validUserTypes.includes(updates.user_type)) {
      errors.push('Invalid user type specified')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    
    let currentUser: any = null
    
    // Try JWT token authentication first (Microsoft OAuth)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        // Get user from database with service role (bypasses RLS)
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          currentUser = userData
          console.log('🔑 JWT Auth: Successfully authenticated user:', currentUser.email)
        }
      } catch (jwtError) {
        console.log('🔑 JWT verification failed, trying Supabase session...')
      }
    }

    // If JWT failed, try Supabase session authentication (Email/Password)
    if (!currentUser) {
      try {
        const supabaseClient = createSupabaseServiceClient()
        
        // Try to get session from Supabase auth header
        let authToken = null
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7)
        }
        
        // Check if this might be a Supabase session token
        if (authToken && authToken.includes('.')) {
          // This looks like a Supabase JWT token, try to verify with Supabase
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(authToken)
          
          if (!sessionError && supabaseUser) {
            // Get full user profile from database
            const { data: userData, error: userError } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              currentUser = userData
              console.log('🔑 Supabase Auth: Successfully authenticated user:', currentUser.email)
            }
          }
        }
      } catch (supabaseError) {
        console.log('🔑 Supabase authentication also failed:', supabaseError)
      }
    }
    
    // If both methods failed, return unauthorized
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { userId, updates } = body

    // Basic input validation
    if (!userId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Validate the update data
    const validation = validateUserData(updates)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 })
    }

    // Check if user is trying to update their own profile or has admin permissions
    const canEditProfile = currentUser.id === userId || 
                          currentUser.is_global_admin || 
                          currentUser.user_type === 'wolthers_staff' ||
                          (currentUser.user_type === 'admin' && currentUser.company_id)

    if (!canEditProfile) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to edit profile',
        details: ['You can only edit your own profile unless you have administrative privileges']
      }, { status: 403 })
    }

    // Prepare update data with tracking
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_profile_update: new Date().toISOString(),
      last_profile_updated_by: currentUser.id
    }

    // Update user profile using admin client
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Log the profile update for audit trail
    const auditLogEntry = {
      user_id: currentUser.id,
      action: 'profile_update',
      resource_type: 'user_profile',
      resource_id: userId,
      details: {
        updated_fields: Object.keys(updates),
        updated_by: currentUser.email,
        timestamp: new Date().toISOString()
      }
    }

    // Try to insert audit log (don't fail the main operation if this fails)
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert(auditLogEntry)
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      updated_at: updateData.updated_at
    })

  } catch (error) {
    console.error('User profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    let currentUser: any = null
    
    // Try JWT token authentication first (Microsoft OAuth)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        // Get user from database with service role (bypasses RLS)
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          currentUser = userData
          console.log('🔑 JWT Auth: Successfully authenticated user:', currentUser.email)
        }
      } catch (jwtError) {
        console.log('🔑 JWT verification failed, trying Supabase session...')
      }
    }

    // If JWT failed, try Supabase session authentication (Email/Password)
    if (!currentUser) {
      try {
        const supabaseClient = createSupabaseServiceClient()
        
        // Try to get session from Supabase auth header
        let authToken = null
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7)
        }
        
        // Check if this might be a Supabase session token
        if (authToken && authToken.includes('.')) {
          // This looks like a Supabase JWT token, try to verify with Supabase
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(authToken)
          
          if (!sessionError && supabaseUser) {
            // Get full user profile from database
            const { data: userData, error: userError } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              currentUser = userData
              console.log('🔑 Supabase Auth: Successfully authenticated user:', currentUser.email)
            }
          }
        }
      } catch (supabaseError) {
        console.log('🔑 Supabase authentication also failed:', supabaseError)
      }
    }
    
    // If both methods failed, return unauthorized
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permission to view users
    const canViewAllUsers = currentUser.is_global_admin || currentUser.user_type === 'wolthers_staff'
    const canViewCompanyUsers = currentUser.user_type === 'admin' && currentUser.company_id

    if (!canViewAllUsers && !canViewCompanyUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Build query with admin client to bypass RLS
    let query = supabaseAdmin.from('users').select(`
      *,
      companies!users_company_id_fkey(name)
    `)

    // Apply filtering based on permissions
    if (!canViewAllUsers && currentUser.company_id) {
      query = query.eq('company_id', currentUser.company_id)
    }

    const { data: usersData, error: usersError } = await query.order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Add company_name field for compatibility
    const enrichedUsers = (usersData || []).map(user => ({
      ...user,
      company_name: user.companies?.name || 'Wolthers & Associates'
    }))

    return NextResponse.json({ 
      users: enrichedUsers,
      total: enrichedUsers.length 
    })

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH endpoint for batch operations
export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    
    let currentUser: any = null
    
    // Authentication (same logic as other endpoints)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          currentUser = userData
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        try {
          const supabaseClient = createSupabaseServiceClient()
          if (token.includes('.')) {
            const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
            
            if (!sessionError && supabaseUser) {
              const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single()

              if (!userError && userData) {
                currentUser = userData
              }
            }
          }
        } catch (supabaseError) {
          console.log('🔑 Supabase authentication also failed:', supabaseError)
        }
      }
    }
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { operation, userIds, updates } = body

    // Check permissions for batch operations
    const canPerformBatchOps = currentUser.is_global_admin || 
                               currentUser.user_type === 'wolthers_staff' ||
                               currentUser.user_type === 'admin'

    if (!canPerformBatchOps) {
      return NextResponse.json({ 
        error: 'Insufficient permissions for batch operations',
        details: ['Batch operations require administrative privileges']
      }, { status: 403 })
    }

    const results: any[] = []
    const errors: any[] = []

    switch (operation) {
      case 'bulk_update':
        if (!userIds || !Array.isArray(userIds) || !updates) {
          return NextResponse.json({ error: 'Invalid batch update data' }, { status: 400 })
        }

        // Validate update data
        const validation = validateUserData(updates)
        if (!validation.isValid) {
          return NextResponse.json({ 
            error: 'Validation failed for batch update', 
            details: validation.errors 
          }, { status: 400 })
        }

        for (const userId of userIds) {
          try {
            const updateData = {
              ...updates,
              updated_at: new Date().toISOString(),
              last_profile_updated_by: currentUser.id
            }

            const { data: updatedUser, error: updateError } = await supabaseAdmin
              .from('users')
              .update(updateData)
              .eq('id', userId)
              .select('*')
              .single()

            if (updateError) {
              errors.push({ userId, error: updateError.message })
            } else {
              results.push({ userId, success: true, user: updatedUser })
            }
          } catch (error) {
            errors.push({ userId, error: error.message || 'Unknown error' })
          }
        }

        // Create audit log for batch operation
        try {
          await supabaseAdmin
            .from('audit_logs')
            .insert({
              user_id: currentUser.id,
              action: 'bulk_user_update',
              resource_type: 'user_profiles',
              resource_id: userIds.join(','),
              details: {
                affected_users: userIds.length,
                successful_updates: results.length,
                failed_updates: errors.length,
                updated_fields: Object.keys(updates),
                updated_by: currentUser.email,
                timestamp: new Date().toISOString()
              }
            })
        } catch (auditError) {
          console.warn('Failed to create batch audit log:', auditError)
        }

        return NextResponse.json({
          success: true,
          operation: 'bulk_update',
          results: {
            successful: results,
            failed: errors,
            total_processed: userIds.length,
            success_count: results.length,
            error_count: errors.length
          }
        })

      case 'export':
        // Handle user export (CSV generation)
        const exportUsers = await supabaseAdmin
          .from('users')
          .select('*')
          .in('id', userIds)

        if (exportUsers.error) {
          return NextResponse.json({ error: 'Failed to export users' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          operation: 'export',
          data: exportUsers.data,
          exported_count: exportUsers.data?.length || 0
        })

      default:
        return NextResponse.json({ error: 'Unknown batch operation' }, { status: 400 })
    }

  } catch (error) {
    console.error('Batch operation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during batch operation' },
      { status: 500 }
    )
  }
}