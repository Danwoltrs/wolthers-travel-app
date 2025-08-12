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
          .select('id, email, full_name, phone, user_type, company_id')
          .order('full_name')

        console.log('📊 All users:', allUsers)
        console.log('❌ All users error:', allUsersError)

        // Filter Wolthers staff specifically - include both wolthers_staff and admin types
        const wolthersStaff = allUsers?.filter(user => 
          user.user_type === 'wolthers_staff' || 
          user.user_type === 'admin'
        ) || []

        console.log('👥 Wolthers staff data:', wolthersStaff)

        setStaff(wolthersStaff)
        setError(null)
        console.log('✅ Staff loaded successfully:', wolthersStaff.length, 'members')
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