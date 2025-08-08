'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard since user management is now in a modal
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-pearl-600 dark:text-pearl-300">
          <div className="w-4 h-4 border-2 border-pearl-300 border-t-emerald-600 rounded-full animate-spin"></div>
          <span>Redirecting to dashboard...</span>
        </div>
      </div>
    </div>
  )
}