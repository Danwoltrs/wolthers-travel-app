'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Car, Building, Users, Settings, UserCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Home', href: '/' },
  { icon: <Car className="w-5 h-5" />, label: 'Fleet', href: '/fleet' },
  { icon: <Building className="w-5 h-5" />, label: 'Companies', href: '/companies' },
  { icon: <Users className="w-5 h-5" />, label: 'Users', href: '/users' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/settings' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="relative bg-emerald-800/90 backdrop-blur-xl rounded-full shadow-2xl border border-emerald-600/30 px-8 py-4">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/30 to-emerald-900/30 rounded-full" />
          
          <div className="relative flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-white hover:text-emerald-100 transition-colors">
              Wolthers
            </Link>

            {/* Icon Navigation */}
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    'p-2.5 rounded-full transition-all duration-200 hover:scale-110',
                    pathname === item.href
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-emerald-100 hover:text-white hover:bg-white/10'
                  )}
                >
                  {item.icon}
                </Link>
              ))}
              
              {/* User Profile Icon */}
              <button
                title="User Profile"
                className="p-2.5 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110"
              >
                <UserCircle className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}