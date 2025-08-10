import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key for admin operations
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Service client for bypassing RLS policies
export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Helper function to execute SQL queries with proper error handling
export async function executeSQL(query: string, params: any[] = []) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Use rpc to call our custom functions or direct SQL via rpc
    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query,
      query_params: params
    })

    if (error) {
      console.error('Supabase SQL Error:', error)
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Database execution error:', err)
    return { data: null, error: err }
  }
}

// Password verification function
export async function verifyUserPassword(email: string, password: string, userAgent?: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase.rpc('verify_user_password', {
      user_email: email,
      user_password: password
    })

    if (error) {
      console.error('Password verification error:', error)
      return { isValid: false, user: null, error }
    }

    const result = data?.[0]
    
    if (result?.is_valid) {
      // Track successful login event
      await trackServerLoginEvent(result.id, 'email', email, userAgent)
      
      // Return complete user profile data (matching Microsoft OAuth flow)
      const fullUser = {
        id: result.id,
        email: result.email,
        full_name: result.full_name,
        user_type: result.user_type,
        company_id: result.company_id,
        is_global_admin: result.is_global_admin,
        can_view_all_trips: result.can_view_all_trips,
        can_view_company_trips: result.can_view_company_trips,
        microsoft_oauth_id: result.microsoft_oauth_id,
        phone: result.phone,
        whatsapp: result.whatsapp,
        timezone: result.timezone,
        last_login_at: result.last_login_at,
        last_login_timezone: result.last_login_timezone,
        last_login_provider: result.last_login_provider,
        company_name: result.company_name,
        notification_preferences: result.notification_preferences,
        profile_picture_url: result.profile_picture_url,
        created_at: result.created_at,
        updated_at: result.updated_at,
      }
      
      return {
        isValid: true,
        user: fullUser,
        error: null
      }
    }
    
    return {
      isValid: false,
      user: null,
      error: null
    }
  } catch (err) {
    console.error('Password verification exception:', err)
    return { isValid: false, user: null, error: err }
  }
}

// Server-side login tracking function
export async function trackServerLoginEvent(userId: string, provider: 'email' | 'microsoft', userEmail: string, userAgent?: string) {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()

    // Update user's last login info
    await supabase
      .from('users')
      .update({
        last_login_at: now.toISOString(),
        last_login_provider: provider,
        updated_at: now.toISOString(),
      })
      .eq('id', userId)

    // Log the login event for audit trail
    await supabase
      .from('login_events')
      .insert({
        user_id: userId,
        user_email: userEmail,
        login_provider: provider,
        login_timezone: 'UTC', // Server timezone, client will provide actual timezone
        login_timestamp: now.toISOString(),
        user_agent: userAgent,
        ip_address: null, // Would need request context for real IP
      })

    console.log(`Server: Login tracked for ${userEmail} via ${provider} at ${now.toISOString()}`)
  } catch (error) {
    console.error('Failed to track server login event:', error)
  }
}

// Password update function
export async function updateUserPassword(email: string, newPassword: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Update password using PostgreSQL's crypt function
    const { data, error } = await supabase.rpc('update_user_password', {
      user_email: email,
      new_password: newPassword
    })

    if (error) {
      console.error('Password update error:', error)
      return { success: false, error }
    }

    return { success: true, data, error: null }
  } catch (err) {
    console.error('Password update exception:', err)
    return { success: false, error: err }
  }
}