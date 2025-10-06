import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verify } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  console.log('💰 [Expenses API] POST request received')
  
  try {
    // Use JWT authentication (same as other APIs)
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      console.log('🔑 [Expenses API] No auth-token cookie found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify the JWT token
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let user: any = null
    
    try {
      const decoded = verify(authToken, secret) as any
      console.log('🔑 [Expenses API] JWT Token decoded successfully:', { userId: decoded.userId })
      
      // Get user from database
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (userError || !userData) {
        console.log('🔑 [Expenses API] User lookup failed:', userError?.message)
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }

      user = userData
      console.log('🔑 [Expenses API] Successfully authenticated user:', user.email)
    } catch (jwtError) {
      console.log('🔑 [Expenses API] JWT verification failed:', jwtError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const data = await request.json()
    console.log('📥 [Expenses API] Request data:', {
      trip_id: data.trip_id,
      amount: data.amount,
      currency: data.currency,
      category: data.category
    })
    const {
      trip_id,
      amount,
      currency = 'BRL',
      category,
      description,
      expense_date,
      expense_location,
      card_last_four,
      is_personal_card = false,
      requires_reimbursement = false
    } = data

    // Validate required fields
    if (!trip_id || !amount || !category || !expense_date) {
      return NextResponse.json(
        { error: 'Missing required fields: trip_id, amount, category, expense_date' },
        { status: 400 }
      )
    }

    // Validate category against enum
    const validCategories = ['transport', 'accommodation', 'meals', 'activities', 'business', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify user has access to this trip (either participant or creator)
    console.log('🔍 [Expenses API] Checking trip access for user:', user.id)
    const { data: tripAccess, error: accessError } = await supabase
      .from('trips')
      .select(`
        id,
        creator_id,
        trip_participants!inner(user_id)
      `)
      .eq('id', trip_id)
      .or(`creator_id.eq.${user.id},trip_participants.user_id.eq.${user.id}`)

    if (accessError || !tripAccess || tripAccess.length === 0) {
      return NextResponse.json({ error: 'Access denied to this trip' }, { status: 403 })
    }

    // Create expense record
    console.log('💾 [Expenses API] Creating expense in database...')
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id,
        user_id: user.id,
        amount: parseFloat(amount),
        currency,
        category,
        description,
        expense_date,
        expense_location,
        card_last_four,
        is_personal_card,
        requires_reimbursement
      })
      .select()
      .single()

    if (expenseError) {
      console.error('❌ [Expenses API] Error creating expense:', expenseError)
      return NextResponse.json(
        { error: 'Failed to create expense: ' + expenseError.message },
        { status: 500 }
      )
    }

    console.log('✅ [Expenses API] Expense created successfully:', expense.id)
    return NextResponse.json({
      success: true,
      expense
    })

  } catch (error) {
    console.error('Expense creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('trip_id')

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id parameter required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user has access to this trip
    const { data: tripAccess, error: accessError } = await supabase
      .from('trips')
      .select(`
        id,
        creator_id,
        trip_participants!inner(user_id)
      `)
      .eq('id', tripId)
      .or(`creator_id.eq.${userData.id},trip_participants.user_id.eq.${userData.id}`)

    if (accessError || !tripAccess || tripAccess.length === 0) {
      return NextResponse.json({ error: 'Access denied to this trip' }, { status: 403 })
    }

    // Get all expenses for this trip
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        *,
        users!inner(full_name, email)
      `)
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false })

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
      return NextResponse.json(
        { error: 'Failed to fetch expenses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      expenses: expenses || []
    })

  } catch (error) {
    console.error('Expense fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}