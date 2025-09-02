import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  let currentUser = null
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const { user } = await response.json()
        currentUser = user
      }
    } catch (error) {
      console.error('Token verification failed:', error)
    }
  }

  // Try cookie-based auth as fallback
  if (!currentUser) {
    try {
      const cookieHeader = request.headers.get('cookie')
      const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
        headers: { cookie: cookieHeader || '' }
      })
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        if (sessionData.authenticated) {
          currentUser = sessionData.user
        }
      }
    } catch (error) {
      console.error('Cookie auth failed:', error)
    }
  }

  return currentUser
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params

    // Authentication check
    const currentUser = await authenticateUser(request)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - users can view their own data or global admins can view any user
    const isGlobalAdmin = currentUser.is_global_admin
    const isOwnProfile = currentUser.id === resolvedParams.id
    
    if (!isGlobalAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own profile or must be a global administrator.' },
        { status: 403 }
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        whatsapp,
        user_type,
        is_global_admin,
        company_id,
        last_login_at,
        created_at,
        companies!users_company_id_fkey (
          id,
          name,
          fantasy_name
        )
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in user detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params

    // Authentication check
    const currentUser = await authenticateUser(request)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - only global admins or the user themselves can update
    const isGlobalAdmin = currentUser.is_global_admin
    const isOwnProfile = currentUser.id === resolvedParams.id
    
    if (!isGlobalAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: 'Access denied. Only global administrators or the user themselves can update user data.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Remove fields that shouldn't be updated directly
    const { id, created_at, last_login_at, ...updateData } = body
    
    // Only global admins can change sensitive fields
    if (!isGlobalAdmin) {
      delete updateData.is_global_admin
      delete updateData.user_type
      delete updateData.company_id
    }

    // Prevent users from removing their own global admin status
    if (isOwnProfile && currentUser.is_global_admin && updateData.is_global_admin === false) {
      return NextResponse.json(
        { error: 'You cannot remove your own global administrator status.' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }

    // Log the update for audit purposes
    console.log(`User ${resolvedParams.id} updated by ${currentUser.id} (global admin: ${isGlobalAdmin})`)

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Error in update user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params

    // Authentication check
    const currentUser = await authenticateUser(request)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - only global admins can delete users
    if (!currentUser.is_global_admin) {
      return NextResponse.json(
        { error: 'Access denied. Only global administrators can delete users.' },
        { status: 403 }
      )
    }

    // Prevent deletion of own account
    if (currentUser.id === resolvedParams.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account.' },
        { status: 403 }
      )
    }

    // Get user details before deletion for logging
    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, company_id, is_global_admin')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch user for deletion' },
        { status: 500 }
      )
    }

    // Check if this is the last global admin (prevent system lockout)
    if (userToDelete.is_global_admin) {
      const { data: globalAdmins, error: adminCountError } = await supabase
        .from('users')
        .select('id')
        .eq('is_global_admin', true)

      if (adminCountError || !globalAdmins || globalAdmins.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last global administrator. System must have at least one global admin.' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json(
        { error: 'Failed to delete user', details: error.message },
        { status: 500 }
      )
    }

    // Log the deletion for audit purposes
    console.log(`User deleted: ${userToDelete.email} (${userToDelete.full_name}) by ${currentUser.email}`)

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        full_name: userToDelete.full_name
      }
    })
  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}