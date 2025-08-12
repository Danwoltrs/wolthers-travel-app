import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { User } from '@/types'

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
        console.log('🔍 Fetching Wolthers staff...')
        const supabase = getSupabaseClient()
        
        // First check what users exist
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, full_name, phone, user_type')
          .order('full_name')

        console.log('📊 All users:', allUsers)
        console.log('❌ All users error:', allUsersError)

        // Then get specifically wolthers_staff
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, email, full_name, phone, user_type')
          .eq('user_type', 'wolthers_staff')
          .order('full_name')

        console.log('👥 Wolthers staff data:', data)
        console.log('❌ Fetch error:', fetchError)

        if (fetchError) {
          throw fetchError
        }

        setStaff(data || [])
        setError(null)
        console.log('✅ Staff loaded successfully:', data?.length || 0, 'members')
      } catch (err) {
        console.error('❌ Error fetching Wolthers staff:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch staff')
      } finally {
        setLoading(false)
      }
    }

    fetchWolthersStaff()
  }, [])

  return { staff, loading, error }
}