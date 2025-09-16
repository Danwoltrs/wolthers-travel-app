import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = createServerSupabaseClient()
  const cookieStore = await cookies()
  
  const sessionCookie = cookieStore.get('sb-access-token')
  if (!sessionCookie) {
    return null
  }

  const { data: { user } } = await supabase.auth.getUser(sessionCookie.value)
  if (!user) return null

  const { data: userDetails } = await supabase
    .from('users')
    .select('id, email, company_id, role, user_type')
    .eq('id', user.id)
    .single()

  return userDetails
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const resolvedParams = await params
    const companyId = resolvedParams.id

    console.log(`[API] Fetching users for company ID: ${companyId}`)

    // First, verify the company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError) {
      console.error('Company not found:', companyError)
      return NextResponse.json(
        { error: 'Company not found', details: companyError.message },
        { status: 404 }
      )
    }

    console.log(`[API] Found company: ${company.name}`)

    // Fetch users for the specific company including the new role field and company info
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        whatsapp,
        user_type,
        role,
        last_login_at,
        created_at,
        company_id,
        companies!inner(
          name
        )
      `)
      .eq('company_id', companyId)
      .order('full_name')

    if (error) {
      console.error('Error fetching company users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company users', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[API] Found ${users?.length || 0} users for company ${company.name}`)

    // Add computed is_active field for each user and flatten company info
    const usersWithStatus = users?.map(user => ({
      ...user,
      is_active: true, // All users are considered active since no deletion/ban system exists
      last_login: user.last_login_at, // Map to expected field name
      company: user.companies ? { name: user.companies.name } : null
    })) || []

    return NextResponse.json({
      users: usersWithStatus,
      staff: usersWithStatus, // Add staff field for compatibility with CompanyUsersManager
      count: usersWithStatus.length,
      companyName: company.name,
      message: usersWithStatus.length === 0 
        ? `No users found for ${company.name}. Users can be added through the user management system.`
        : `Found ${usersWithStatus.length} users for ${company.name}`
    })
  } catch (error) {
    console.error('Error in company users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user role within company
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const currentUser = await getAuthenticatedUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const companyId = resolvedParams.id
    const { userId, role, isActive } = await request.json()

    // Validate role if provided
    if (role) {
      const validRoles = ['staff', 'driver', 'manager', 'admin']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ 
          error: 'Invalid role. Must be one of: staff, driver, manager, admin' 
        }, { status: 400 })
      }
    }

    // Check authorization
    const isWolthersStaff = currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    const isCompanyAdmin = currentUser.company_id === companyId && ['admin', 'manager'].includes(currentUser.role)

    if (!isWolthersStaff && !isCompanyAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized to manage users for this company' 
      }, { status: 403 })
    }

    // Verify the user belongs to the company
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, company_id, role')
      .eq('id', userId)
      .eq('company_id', companyId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ 
        error: 'User not found in this company' 
      }, { status: 404 })
    }

    // Prevent self-demotion from admin
    if (currentUser.id === userId && role && role !== 'admin' && currentUser.role === 'admin') {
      return NextResponse.json({ 
        error: 'Cannot demote yourself from admin role' 
      }, { status: 400 })
    }

    // Build update object
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) {
      // Note: Since we don't have an is_active field, we could implement this as a soft delete
      // For now, we'll just log it
      console.log(`[USER UPDATE] isActive flag: ${isActive} for user ${userId}`)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid update fields provided' 
      }, { status: 400 })
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user' 
      }, { status: 500 })
    }

    console.log(`[USER UPDATE] Updated user ${targetUser.full_name} (${targetUser.email})`, updateData)

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        company_id: updatedUser.company_id
      }
    })

  } catch (error) {
    console.error('Error in user update API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}