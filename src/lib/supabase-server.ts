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
export async function verifyUserPassword(email: string, password: string) {
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
    return {
      isValid: result?.is_valid || false,
      user: result ? { id: result.id, email: result.email } : null,
      error: null
    }
  } catch (err) {
    console.error('Password verification exception:', err)
    return { isValid: false, user: null, error: err }
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