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
        
        // First check what users exist with company info
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

        console.log('📊 All users:', allUsers)
        console.log('❌ All users error:', allUsersError)

        if (allUsersError) {
          console.error('🚨 Database error:', allUsersError)
          throw new Error(`Database error: ${allUsersError.message}`)
        }

        if (!allUsers) {
          console.warn('⚠️ No users returned from database')
          setStaff([])
          return
        }

        console.log('🔍 Sample user object structure:', allUsers[0])
        console.log('🧮 Total users fetched:', allUsers.length)

        // Filter Wolthers staff specifically - include wolthers_staff, admin types, and company admins from Wolthers
        const wolthersStaff = allUsers.filter(user => {
          const isWolthersStaff = user.user_type === 'wolthers_staff'
          const isGeneralAdmin = user.user_type === 'admin' && !user.company_id // Global admin (no company)
          const isWolthersCompanyAdmin = user.user_type === 'admin' && 
            user.companies?.name?.includes('Wolthers')
          
          console.log(`🔎 Checking user ${user.full_name}: type="${user.user_type}", company="${user.companies?.name || 'none'}", isWolthersStaff=${isWolthersStaff}, isGeneralAdmin=${isGeneralAdmin}, isWolthersCompanyAdmin=${isWolthersCompanyAdmin}`)
          
          return isWolthersStaff || isGeneralAdmin || isWolthersCompanyAdmin
        })

        console.log('👥 Wolthers staff data:', wolthersStaff)
        console.log('📈 Filtered staff count:', wolthersStaff.length)

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