'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show header on login page (main page)
  if (pathname === '/') {
    return null
  }
  
  // Don't show header on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return null
  }
  
  // Don't show header on trip pages (they have their own custom header)
  if (pathname.startsWith('/trips/') && pathname.length > 8) {
    return null
  }
  
  // Don't show header on companies page and company-specific pages (uses custom layout)
  if (pathname.startsWith('/companies')) {
    return null
  }
  
  return <Header />
}