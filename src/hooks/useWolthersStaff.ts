import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface WolthersStaffMember {
  id: string
  email: string
  full_name: string
  phone?: string
  user_type: string
}

export function useWolthersStaff() {
  const [staff, setStaff] = useState<WolthersStaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip if running on server-side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    async function fetchWolthersStaff() {
      try {
        setLoading(true)
        console.log('🔍 Fetching Wolthers staff via API...')
        
        // Get auth token for API request
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          console.warn('⚠️ No auth session found')
          throw new Error('Authentication required')
        }

        // Use API endpoint instead of direct Supabase query to bypass RLS issues
        const response = await fetch('/api/users/wolthers-staff', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('📡 API response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('🚨 API error:', errorData)
          throw new Error(errorData.error || `API request failed with status ${response.status}`)
        }

        const staffData: WolthersStaffMember[] = await response.json()
        console.log('👥 Wolthers staff from API:', staffData)
        console.log('📈 API staff count:', staffData.length)

        setStaff(staffData)
        setError(null)
        console.log('✅ Staff loaded successfully via API:', staffData.length, 'members')
      } catch (err) {
        console.error('❌ Error fetching Wolthers staff via API:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch staff')
        
        // Fallback to direct Supabase query (will likely fail due to RLS but worth trying)
        try {
          console.log('🔄 Attempting fallback to direct Supabase query...')
          const supabase = getSupabaseClient()
          
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select(`
              id, 
              email, 
              full_name, 
              phone, 
              user_type, 
              company_id,
              companies!company_id (
                id,
                name
              )
            `)
            .order('full_name')

          console.log('📊 Fallback - All users:', allUsers)
          console.log('❌ Fallback - All users error:', allUsersError)

          if (!allUsersError && allUsers) {
            const wolthersStaff = allUsers.filter(user => {
              const isWolthersStaff = user.user_type === 'wolthers_staff'
              const isWolthersCompanyAdmin = user.user_type === 'admin' && 
                user.companies?.name?.includes('Wolthers')
              
              return isWolthersStaff || isWolthersCompanyAdmin
            })

            if (wolthersStaff.length > 0) {
              setStaff(wolthersStaff)
              setError(null)
              console.log('✅ Fallback successful:', wolthersStaff.length, 'members')
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWolthersStaff()
  }, [])

  return { staff, loading, error }
}