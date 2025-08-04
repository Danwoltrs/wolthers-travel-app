'use client'

import React, { useState } from 'react'
import { 
  Users, 
  Building2, 
  Shield, 
  Truck, 
  ChevronRight, 
  Coffee,
  Leaf,
  Home,
  Crown,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserRole } from '@/types'

interface TestAccount {
  id: string
  email: string
  fullName: string
  role: UserRole
  companyName?: string
  avatar?: string
  description: string
  icon: React.ReactNode
  color: string
}

interface DevAccountSwitcherProps {
  onSelectAccount: (account: TestAccount) => void
  disabled?: boolean
  className?: string
}

const testAccounts: TestAccount[] = [
  // Admin account
  {
    id: 'admin-1',
    email: 'daniel@wolthers.com',
    fullName: 'Daniel Wolthers',
    role: UserRole.GLOBAL_ADMIN,
    description: 'Global administrator with full system access',
    icon: <Crown className="w-4 h-4" />,
    color: 'from-amber-500 to-orange-500'
  },
  
  // Wolthers staff
  {
    id: 'staff-1',
    email: 'coordinator@wolthers.com',
    fullName: 'Maria Silva',
    role: UserRole.WOLTHERS_STAFF,
    description: 'Trip coordinator and logistics manager',
    icon: <Users className="w-4 h-4" />,
    color: 'from-sage-500 to-emerald-500'
  },
  
  // Wolthers Finance
  {
    id: 'finance-1',
    email: 'finance@wolthers.com',
    fullName: 'Lars Andersen',
    role: UserRole.WOLTHERS_FINANCE,
    description: 'Finance manager - handles reimbursements and travel costs',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-indigo-500 to-purple-500'
  },
  
  // Drivers
  {
    id: 'driver-1',
    email: 'carlos.driver@wolthers.com',
    fullName: 'Carlos Rodriguez',
    role: UserRole.DRIVER,
    description: 'Professional driver with 10+ years experience',
    icon: <Truck className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500'
  },
  
  // Company visitor accounts
  {
    id: 'visitor-blaser',
    email: 'executive@blaser.com',
    fullName: 'Johann Mueller',
    role: UserRole.VISITOR,
    companyName: 'Blaser Trading',
    description: 'Senior executive from Swiss coffee trading company',
    icon: <Coffee className="w-4 h-4" />,
    color: 'from-amber-600 to-yellow-600'
  },
  {
    id: 'visitor-admin-blaser',
    email: 'admin@blaser.com',
    fullName: 'Emma Schneider',
    role: UserRole.VISITOR_ADMIN,
    companyName: 'Blaser Trading',
    description: 'Travel admin - manages all Blaser employee trips',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-amber-700 to-orange-700'
  },
  {
    id: 'visitor-mitsui',
    email: 'director@mitsui.com',
    fullName: 'Hiroshi Tanaka',
    role: UserRole.VISITOR,
    companyName: 'Mitsui & Co.',
    description: 'Trading director from Japanese conglomerate',
    icon: <Building2 className="w-4 h-4" />,
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'visitor-admin-mitsui',
    email: 'admin@mitsui.com',
    fullName: 'Yuki Yamamoto',
    role: UserRole.VISITOR_ADMIN,
    companyName: 'Mitsui & Co.',
    description: 'Travel coordinator - oversees all Mitsui trips',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-red-600 to-pink-600'
  },
  {
    id: 'visitor-nespresso',
    email: 'buyer@nespresso.com',
    fullName: 'Sophie Laurent',
    role: UserRole.VISITOR,
    companyName: 'Nespresso',
    description: 'Coffee sourcing specialist',
    icon: <Coffee className="w-4 h-4" />,
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'visitor-illy',
    email: 'quality@illy.com',
    fullName: 'Marco Rossi',
    role: UserRole.VISITOR,
    companyName: 'illycaffè',
    description: 'Quality control manager for premium coffee',
    icon: <Coffee className="w-4 h-4" />,
    color: 'from-red-600 to-rose-600'
  },
  
  // Host accounts
  {
    id: 'host-veloso',
    email: 'owner@velosoagro.com',
    fullName: 'Antonio Veloso',
    role: UserRole.HOST,
    companyName: 'Veloso Agro',
    description: 'Farm owner and coffee producer in Cerrado region',
    icon: <Leaf className="w-4 h-4" />,
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 'host-boavista',
    email: 'manager@fazendaboavista.com',
    fullName: 'Fernanda Santos',
    role: UserRole.HOST,
    companyName: 'Fazenda Boa Vista',
    description: 'Estate manager for premium coffee plantation',
    icon: <Home className="w-4 h-4" />,
    color: 'from-teal-500 to-cyan-600'
  },
  
  // Guest account
  {
    id: 'guest-1',
    email: 'guest@example.com',
    fullName: 'Guest User',
    role: UserRole.GUEST,
    description: 'Limited access guest account for testing',
    icon: <User className="w-4 h-4" />,
    color: 'from-gray-500 to-slate-500'
  }
]

const DevAccountSwitcher: React.FC<DevAccountSwitcherProps> = ({
  onSelectAccount,
  disabled = false,
  className
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  const handleSelectAccount = (account: TestAccount) => {
    if (disabled) return
    
    setSelectedAccount(account.id)
    
    // Add a slight delay for visual feedback
    setTimeout(() => {
      onSelectAccount(account)
      setSelectedAccount(null)
    }, 200)
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.GLOBAL_ADMIN:
        return 'Global Admin'
      case UserRole.WOLTHERS_STAFF:
        return 'Wolthers Staff'
      case UserRole.WOLTHERS_FINANCE:
        return 'Finance Manager'
      case UserRole.COMPANY_ADMIN:
        return 'Company Admin'
      case UserRole.VISITOR:
        return 'Visitor'
      case UserRole.VISITOR_ADMIN:
        return 'Visitor Admin'
      case UserRole.HOST:
        return 'Host'
      case UserRole.DRIVER:
        return 'Driver'
      case UserRole.GUEST:
        return 'Guest'
      default:
        return role
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.GLOBAL_ADMIN:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
      case UserRole.WOLTHERS_STAFF:
        return 'bg-sage-100 text-sage-800 dark:bg-emerald-500/20 dark:text-emerald-400'
      case UserRole.WOLTHERS_FINANCE:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400'
      case UserRole.COMPANY_ADMIN:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
      case UserRole.VISITOR:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
      case UserRole.VISITOR_ADMIN:
        return 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-400'
      case UserRole.HOST:
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
      case UserRole.DRIVER:
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400'
      case UserRole.GUEST:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="bg-white dark:bg-[#0E3D2F]/50 rounded-xl p-6 shadow-lg border border-pearl-200 dark:border-[#0E3D2F]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-latte-800 dark:text-green-50">
              Development Login
            </h2>
            <p className="text-sm text-pearl-600 dark:text-slate-400">
              Quick access for testing different user roles
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-400">
                Development Environment Only
              </p>
              <p className="text-amber-700 dark:text-amber-500 mt-1">
                This component is only visible in development mode for testing purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Account List */}
        <div className="space-y-2">
          {testAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              disabled={disabled}
              className={cn(
                "w-full p-4 rounded-lg border transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-300 dark:focus:ring-emerald-400/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selectedAccount === account.id
                  ? "bg-sage-50 dark:bg-emerald-500/10 border-sage-300 dark:border-emerald-500/30 scale-[0.98]"
                  : "bg-white dark:bg-[#0E3D2F]/30 border-pearl-200 dark:border-[#0E3D2F] hover:border-sage-300 dark:hover:border-emerald-500/30",
                "group"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Avatar with gradient background */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white",
                  "bg-gradient-to-br",
                  account.color,
                  "group-hover:scale-110 transition-transform duration-200"
                )}>
                  {account.icon}
                </div>

                {/* Account info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-latte-800 dark:text-green-50">
                      {account.fullName}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      getRoleColor(account.role)
                    )}>
                      {getRoleLabel(account.role)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-pearl-600 dark:text-slate-400 mb-1">
                    {account.email}
                  </p>
                  
                  {account.companyName && (
                    <p className="text-xs text-sage-600 dark:text-emerald-400 font-medium mb-1">
                      {account.companyName}
                    </p>
                  )}
                  
                  <p className="text-xs text-pearl-500 dark:text-slate-500">
                    {account.description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className={cn(
                  "w-5 h-5 text-pearl-400 dark:text-slate-500 transition-all duration-200",
                  "group-hover:text-sage-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1",
                  selectedAccount === account.id && "text-sage-600 dark:text-emerald-400"
                )} />
              </div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-pearl-200 dark:border-[#0E3D2F]">
          <p className="text-xs text-center text-pearl-500 dark:text-slate-500">
            These are test accounts for development. In production, users will authenticate via Microsoft OAuth or email OTP.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DevAccountSwitcher
export type { TestAccount }