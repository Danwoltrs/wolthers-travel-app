'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Building, Users, Settings, Sun, Moon, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import UserManagementModal from '@/components/users/UserManagementModal'
import Image from 'next/image'

// Custom Car icon component using the asset SVG
const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 48 48" fill="currentColor">
    <path d="M42 28h-2.5l-2-8c-0.5-2-2.3-3.5-4.4-3.5H14.9c-2.1 0-3.9 1.5-4.4 3.5l-2 8H6c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h2v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h16v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h2c1.1 0 2-0.9 2-2v-6c0-1.1-0.9-2-2-2zM12 32c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm24 0c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm4-10H8l1.5-6c0.2-0.8 0.9-1.5 1.8-1.5h25.4c0.9 0 1.6 0.7 1.8 1.5L40 22z"/>
  </svg>
)

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Home', href: '/' },
  { icon: <CarIcon className="w-5 h-5" />, label: 'Fleet', href: '/fleet' },
  { icon: <Building className="w-5 h-5" />, label: 'Companies', href: '/companies' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/settings' },
]

export default function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [showUserModal, setShowUserModal] = React.useState(false)
  
  const toggleMenu = () => {
    const newState = !isMenuOpen
    setIsMenuOpen(newState)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('menuToggle', {
      detail: { isOpen: newState }
    }))
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="relative bg-emerald-800/90 dark:bg-[#09261d]/95 backdrop-blur-xl rounded-full shadow-2xl border border-emerald-600/30 dark:border-emerald-900/60 px-12 py-6">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/30 to-emerald-900/30 dark:from-[#09261d]/60 dark:to-[#041611]/80 rounded-full" />
          
          <div className="relative flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
              <Image
                src="/images/logos/wolthers-logo-off-white.svg"
                alt="Wolthers & Associates"
                width={160}
                height={43}
                priority
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Icon Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    'p-3 rounded-full transition-all duration-200 hover:scale-110',
                    pathname === item.href
                      ? 'bg-white/20 dark:bg-emerald-500/20 text-white shadow-lg'
                      : 'text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15'
                  )}
                >
                  {item.icon}
                </Link>
              ))}
              
              {/* Users Modal Trigger */}
              <button
                onClick={() => setShowUserModal(true)}
                title="User Management"
                className={cn(
                  'p-3 rounded-full transition-all duration-200 hover:scale-110',
                  showUserModal
                    ? 'bg-white/20 dark:bg-emerald-500/20 text-white shadow-lg'
                    : 'text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15'
                )}
              >
                <Users className="w-5 h-5" />
              </button>
              
              {/* Theme Toggle Switch */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="relative ml-4"
              >
                <div className={cn(
                  "w-12 h-6 rounded-full transition-all duration-300 ease-in-out",
                  theme === 'dark' 
                    ? "bg-[#0E3D2F]" 
                    : "bg-white/30"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-in-out transform flex items-center justify-center",
                    theme === 'dark'
                      ? "translate-x-6 bg-white"
                      : "translate-x-0.5 bg-white"
                  )}>
                    {theme === 'dark' ? (
                      <Moon className="w-3 h-3 text-[#0E3D2F]" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                </div>
              </button>
            </nav>
            
            {/* Mobile Hamburger Menu */}
            <div className="lg:hidden flex items-center space-x-4">
              {/* Theme Toggle for Mobile */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="relative"
              >
                <div className={cn(
                  "w-12 h-6 rounded-full transition-all duration-300 ease-in-out",
                  theme === 'dark' 
                    ? "bg-[#0E3D2F]" 
                    : "bg-white/30"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-in-out transform flex items-center justify-center",
                    theme === 'dark'
                      ? "translate-x-6 bg-white"
                      : "translate-x-0.5 bg-white"
                  )}>
                    {theme === 'dark' ? (
                      <Moon className="w-3 h-3 text-[#0E3D2F]" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                </div>
              </button>
              
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleMenu}
                className="p-3 rounded-full text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15 transition-all duration-200"
                title="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 mx-6">
            <div className="bg-emerald-800/95 dark:bg-[#09261d]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-600/30 dark:border-emerald-900/60 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-700/30 to-emerald-900/30 dark:from-[#09261d]/60 dark:to-[#041611]/80" />
              <nav className="relative p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setIsMenuOpen(false)
                      window.dispatchEvent(new CustomEvent('menuToggle', {
                        detail: { isOpen: false }
                      }))
                    }}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-xl transition-all duration-200',
                      pathname === item.href
                        ? 'bg-white/20 dark:bg-emerald-500/20 text-white shadow-lg'
                        : 'text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15'
                    )}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                
                {/* Users Modal Trigger for Mobile */}
                <button
                  onClick={() => {
                    setShowUserModal(true)
                    setIsMenuOpen(false)
                    window.dispatchEvent(new CustomEvent('menuToggle', {
                      detail: { isOpen: false }
                    }))
                  }}
                  className="flex items-center space-x-3 p-3 rounded-xl text-emerald-100 dark:text-green-300 hover:text-white hover:bg-white/10 dark:hover:bg-emerald-500/15 transition-all duration-200 w-full text-left"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">User Management</span>
                </button>
                
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      <UserManagementModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
      />
    </header>
  )
}