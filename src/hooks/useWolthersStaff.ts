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
    async function fetchWolthersStaff() {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, email, full_name, phone, user_type')
          .eq('user_type', 'wolthers_staff')
          .order('full_name')

        if (fetchError) {
          throw fetchError
        }

        setStaff(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching Wolthers staff:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch staff')
      } finally {
        setLoading(false)
      }
    }

    fetchWolthersStaff()
  }, [])

  return { staff, loading, error }
}