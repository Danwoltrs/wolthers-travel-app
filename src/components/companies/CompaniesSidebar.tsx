'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Home, Building, User, LogOut, ChevronDown, 
  Plus, Coffee, TreePine, Sun, Moon, Users, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import UserManagementModal from '@/components/users/UserManagementModal'
import useSWR from 'swr'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

// Custom Car icon component
const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 48 48" fill="currentColor">
    <path d="M42 28h-2.5l-2-8c-0.5-2-2.3-3.5-4.4-3.5H14.9c-2.1 0-3.9 1.5-4.4 3.5l-2 8H6c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h2v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h16v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h2c1.1 0 2-0.9 2-2v-6c0-1.1-0.9-2-2-2zM12 32c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm24 0c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm4-10H8l1.5-6c0.2-0.8 0.9-1.5 1.8-1.5h25.4c0.9 0 1.6 0.7 1.8 1.5L40 22z"/>
  </svg>
)

interface CompaniesSidebarProps {
  selectedSection: 'wolthers' | 'buyers' | 'suppliers'
  onSectionChange: (section: 'wolthers' | 'buyers' | 'suppliers') => void
  isCollapsed?: boolean
  onToggle?: () => void
  className?: string
  onAddBuyer?: () => void
  onAddSupplier?: () => void
  onAddLab?: () => void
  onViewDashboard?: (company: any) => void
  selectedExternalCompany?: any // Track external company selection
}

export default function CompaniesSidebar({ 
  selectedSection, 
  onSectionChange, 
  isCollapsed = false, 
  onToggle, 
  className = '',
  onAddBuyer,
  onAddSupplier,
  onAddLab,
  onViewDashboard,
  selectedExternalCompany
}: CompaniesSidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [isUserExpanded, setIsUserExpanded] = useState(false)
  const [isWolthersExpanded, setIsWolthersExpanded] = useState(false)
  const [isBuyersExpanded, setIsBuyersExpanded] = useState(false)
  const [isSuppliersExpanded, setIsSuppliersExpanded] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  // Fetch real company data
  const { data: buyersData } = useSWR('/api/companies/buyers', fetcher)
  const { data: suppliersData } = useSWR('/api/companies/suppliers', fetcher)
  const { data: labsData } = useSWR('/api/labs', fetcher)
  
  const wolthersLabs = labsData?.labs || []
  const buyers = buyersData?.companies || []
  const suppliers = suppliersData?.companies || []

  const handleAddNew = (type: string) => {
    console.log(`CompaniesSidebar: handleAddNew called with type: ${type}`)
    switch (type) {
      case 'buyer':
        console.log('CompaniesSidebar: Calling onAddBuyer')
        onAddBuyer?.()
        break
      case 'supplier':
        console.log('CompaniesSidebar: Calling onAddSupplier')
        onAddSupplier?.()
        break
      case 'lab':
        console.log('CompaniesSidebar: Calling onAddLab')
        onAddLab?.()
        break
      default:
        console.log(`Add new ${type}`)
    }
  }

  return (
    <>
      {/* Mobile Toggle Button - Enhanced for touch */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 bg-gradient-to-br from-emerald-900 to-emerald-800 hover:from-emerald-800 hover:to-emerald-700 text-white rounded-xl shadow-xl transition-all duration-200 transform active:scale-95 touch-manipulation"
        aria-label={isCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
        style={{ minWidth: '48px', minHeight: '48px' }} // Ensure minimum touch target size
      >
        {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
      </button>

      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-gradient-to-b from-emerald-900 via-emerald-900 to-emerald-950 dark:from-emerald-950 dark:via-emerald-950 dark:to-black border-r border-emerald-800/50 dark:border-emerald-900/50 h-screen flex flex-col transition-all duration-300 ease-in-out backdrop-blur-sm",
        "lg:translate-x-0 lg:shadow-none", // Always visible on large screens
        isCollapsed ? "-translate-x-full" : "translate-x-0 shadow-2xl", // Mobile: slide in/out with enhanced shadow
        className
      )}>
      {/* Logo at Top */}
      <div className="p-6 pb-10 flex justify-center">
        <Link href="/" className="block">
          <Image
            src="/images/logos/wolthers-logo-off-white.svg"
            alt="Wolthers & Associates"
            width={160}
            height={43}
            priority
            className="h-10 w-auto filter brightness-0 invert"
          />
        </Link>
      </div>

      {/* User Profile - Collapsible */}
      <div className="px-6 pb-4">
        <button
          onClick={() => setIsUserExpanded(!isUserExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-emerald-800/30 rounded-lg transition-all duration-200 group active:scale-[0.98] touch-manipulation"
          aria-label={isUserExpanded ? 'Collapse user menu' : 'Expand user menu'}
        >
          <div className="flex items-center gap-3">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || user.email}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-100" />
              </div>
            )}
            <span className="text-emerald-50 font-medium">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-emerald-300 transition-transform",
            isUserExpanded && "rotate-180"
          )} />
        </button>

        {/* Expanded User Section */}
        {isUserExpanded && (
          <div className="mt-3 bg-gradient-to-br from-emerald-800/20 via-emerald-800/30 to-emerald-700/20 rounded-lg p-4 space-y-4 border border-emerald-700/30 shadow-lg backdrop-blur-sm animate-in slide-in-from-top duration-200">
            {/* User Info */}
            <div>
              <div className="font-bold text-white">
                {user?.name || 'User'}
              </div>
              <div className="text-sm text-emerald-300">
                {user?.email}
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-emerald-700/30"></div>
            
            {/* Theme Options */}
            <div>
              <div className="text-sm text-emerald-200 mb-2">Theme</div>
              <div className="space-y-1">
                <button
                  onClick={() => toggleTheme()}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-[0.98] touch-manipulation",
                    theme === 'dark' 
                      ? "text-white bg-emerald-700/60 shadow-sm border border-emerald-600/50" 
                      : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/40"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
                <button
                  onClick={() => toggleTheme()}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-[0.98] touch-manipulation",
                    theme === 'light' 
                      ? "text-white bg-emerald-700/60 shadow-sm border border-emerald-600/50" 
                      : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/40"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/40 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-[0.98] touch-manipulation"
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-amber-400"></div>
                  System
                </button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-emerald-700/30"></div>
            
            {/* Logout */}
            <button
              onClick={signOut}
              className="w-full text-left px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-[0.98] touch-manipulation border border-red-800/30 hover:border-red-700/50"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Line */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/30"></div>
      </div>

      {/* Navigation Icons - Enhanced for mobile touch */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          <Link
            href="/"
            className="p-3 lg:p-3 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-all duration-200 active:scale-95 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </Link>
          
          <div className="p-3 lg:p-3 rounded-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white shadow-lg min-w-[48px] min-h-[48px] flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          
          <Link
            href="/fleet"
            className="p-3 lg:p-3 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-all duration-200 active:scale-95 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Vehicles"
          >
            <CarIcon className="w-5 h-5" />
          </Link>
          
          <button
            onClick={() => setShowUserModal(true)}
            className="p-3 lg:p-3 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-all duration-200 active:scale-95 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Users"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* Wolthers Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => {
            onSectionChange('wolthers')
            // Close all sections first, then open Wolthers
            setIsBuyersExpanded(false)
            setIsSuppliersExpanded(false)
            setIsWolthersExpanded(true)
          }}
          className={cn(
            "relative w-full flex items-center justify-between px-3 py-3 transition-all duration-200 group focus:outline-none",
            selectedSection === 'wolthers'
              ? "text-golden-400 dark:text-golden-400"
              : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/30 rounded-lg"
          )}
          aria-expanded={isWolthersExpanded}
          aria-label="Wolthers section - toggle to expand or collapse"
        >
          <div className="flex items-center gap-3">
            <Building className={cn(
              "w-5 h-5 transition-colors",
              selectedSection === 'wolthers' ? "text-golden-400 dark:text-golden-400" : "text-emerald-400"
            )} />
            <span className="font-semibold tracking-wide">Wolthers</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-all duration-200",
            isWolthersExpanded && "rotate-180",
            selectedSection === 'wolthers' ? "text-golden-400 dark:text-golden-400" : "text-emerald-400 group-hover:text-emerald-300"
          )} />
          {selectedSection === 'wolthers' && (
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-golden-400 dark:bg-golden-400"></div>
          )}
        </button>

        {isWolthersExpanded && (
          <div className="mt-3 ml-4 space-y-1">
            {/* Show single entry for Brazil/Santos - merged entity */}
            <div
              onClick={() => onViewDashboard?.({
                id: '840783f4-866d-4bdb-9b5d-5d0facf62db0',
                name: 'Wolthers Santos',
                country: 'Brazil',
                location: 'Santos',
                category: 'service_provider'
              })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onViewDashboard?.({
                    id: '840783f4-866d-4bdb-9b5d-5d0facf62db0',
                    name: 'Wolthers Santos',
                    country: 'Brazil',
                    location: 'Santos',
                    category: 'service_provider'
                  })
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="View Wolthers Santos dashboard"
              className="flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer group relative focus:outline-none text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/40"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Santos
                </span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full transition-colors text-emerald-400/70 bg-emerald-800/20 group-hover:bg-emerald-700/30">
                Brazil
              </span>
            </div>
            <button
              onClick={() => handleAddNew('lab')}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/40 rounded-lg transition-all duration-200 group border border-dashed border-emerald-600/30 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-emerald-900"
              aria-label="Add new lab"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add new lab</span>
            </button>
          </div>
        )}
      </div>

      {/* Separation Bar */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/30"></div>
      </div>

      {/* Buyers Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => {
            onSectionChange('buyers')
            // Close all sections first, then open Buyers
            setIsWolthersExpanded(false)
            setIsSuppliersExpanded(false)
            setIsBuyersExpanded(true)
          }}
          className={cn(
            "relative w-full flex items-center justify-between px-3 py-3 transition-all duration-200 group focus:outline-none",
            selectedSection === 'buyers'
              ? "text-golden-400 dark:text-golden-400"
              : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/30 rounded-lg"
          )}
          aria-expanded={isBuyersExpanded}
          aria-label="Buyers section - toggle to expand or collapse"
        >
          <div className="flex items-center gap-3">
            <Coffee className={cn(
              "w-5 h-5 transition-colors",
              selectedSection === 'buyers' ? "text-golden-400 dark:text-golden-400" : "text-emerald-400"
            )} />
            <span className="font-semibold tracking-wide">Buyers</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-all duration-200",
            isBuyersExpanded && "rotate-180",
            selectedSection === 'buyers' ? "text-golden-400 dark:text-golden-400" : "text-emerald-400 group-hover:text-emerald-300"
          )} />
          {selectedSection === 'buyers' && (
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-golden-400 dark:bg-golden-400"></div>
          )}
        </button>

        {isBuyersExpanded && (
          <div className="mt-3 ml-4 space-y-1">
            {buyers.map((company) => {
              const isSelected = selectedExternalCompany?.id === company.id
              return (
                <div
                  key={company.id}
                  onClick={() => onViewDashboard?.(company)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onViewDashboard?.(company)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${company.fantasy_name || company.name} dashboard - ${company.category}`}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer group relative focus:outline-none",
                    isSelected
                      ? "text-white"
                      : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      isSelected ? "text-white" : "group-hover:text-emerald-100"
                    )}>
                      {company.fantasy_name || company.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full transition-colors uppercase tracking-wider font-medium",
                    isSelected 
                      ? "text-white/80 bg-emerald-700/30" 
                      : "text-emerald-400/70 bg-emerald-800/20 group-hover:bg-emerald-700/30"
                  )}>
                    {company.category}
                  </span>
                </div>
              )
            })}
            <button
              onClick={() => handleAddNew('buyer')}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/40 rounded-lg transition-all duration-200 group border border-dashed border-emerald-600/30 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-emerald-900"
              aria-label="Add new buyer company"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add new buyer</span>
            </button>
          </div>
        )}
      </div>

      {/* Separation Bar */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/30"></div>
      </div>

      {/* Suppliers Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => {
            onSectionChange('suppliers')
            // Close all sections first, then open Suppliers
            setIsWolthersExpanded(false)
            setIsBuyersExpanded(false)
            setIsSuppliersExpanded(true)
          }}
          className={cn(
            "relative w-full flex items-center justify-between px-3 py-3 transition-all duration-200 group focus:outline-none",
            selectedSection === 'suppliers'
              ? "text-golden-400 dark:text-golden-400"
              : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/30 rounded-lg"
          )}
          aria-expanded={isSuppliersExpanded}
          aria-label="Suppliers section - toggle to expand or collapse"
        >
          <div className="flex items-center gap-3">
            <TreePine className={cn(
              "w-5 h-5 transition-colors",
              selectedSection === 'suppliers' ? "text-golden-400 dark:text-golden-400" : "text-emerald-400"
            )} />
            <span className="font-semibold tracking-wide">Suppliers</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-all duration-200",
            isSuppliersExpanded && "rotate-180",
            selectedSection === 'suppliers' ? "text-golden-400 dark:text-golden-400" : "text-emerald-400 group-hover:text-emerald-300"
          )} />
          {selectedSection === 'suppliers' && (
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-golden-400 dark:bg-golden-400"></div>
          )}
        </button>

        {isSuppliersExpanded && (
          <div className="mt-3 ml-4 space-y-1">
            {suppliers.map((company) => {
              const isSelected = selectedExternalCompany?.id === company.id
              return (
                <div
                  key={company.id}
                  onClick={() => onViewDashboard?.(company)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onViewDashboard?.(company)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${company.fantasy_name || company.name} dashboard - ${company.category}`}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer group relative focus:outline-none",
                    isSelected
                      ? "text-white"
                      : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      isSelected ? "text-white" : "group-hover:text-emerald-100"
                    )}>
                      {company.fantasy_name || company.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full transition-colors uppercase tracking-wider font-medium",
                    isSelected 
                      ? "text-white/80 bg-emerald-700/30" 
                      : "text-emerald-400/70 bg-emerald-800/20 group-hover:bg-emerald-700/30"
                  )}>
                    {company.category}
                  </span>
                </div>
              )
            })}
            <button
              onClick={() => handleAddNew('supplier')}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/40 rounded-lg transition-all duration-200 group border border-dashed border-emerald-600/30 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-emerald-900"
              aria-label="Add new supplier company"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add new supplier</span>
            </button>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      <UserManagementModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
      />
      </div>
    </>
  )
}