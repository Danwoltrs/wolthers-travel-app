'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Home, Building, User, LogOut, ChevronDown, 
  Plus, Coffee, TreePine, Sun, Moon, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import UserManagementModal from '@/components/users/UserManagementModal'

// Custom Car icon component
const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 48 48" fill="currentColor">
    <path d="M42 28h-2.5l-2-8c-0.5-2-2.3-3.5-4.4-3.5H14.9c-2.1 0-3.9 1.5-4.4 3.5l-2 8H6c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h2v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h16v4c0 1.1 0.9 2 2 2h4c1.1 0 2-0.9 2-2v-4h2c1.1 0 2-0.9 2-2v-6c0-1.1-0.9-2-2-2zM12 32c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm24 0c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm4-10H8l1.5-6c0.2-0.8 0.9-1.5 1.8-1.5h25.4c0.9 0 1.6 0.7 1.8 1.5L40 22z"/>
  </svg>
)

interface CompaniesSidebarProps {
  selectedSection: 'wolthers' | 'importers' | 'exporters'
  onSectionChange: (section: 'wolthers' | 'importers' | 'exporters') => void
}

export default function CompaniesSidebar({ selectedSection, onSectionChange }: CompaniesSidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [isUserExpanded, setIsUserExpanded] = useState(false)
  const [isWolthersExpanded, setIsWolthersExpanded] = useState(false)
  const [isImportersExpanded, setIsImportersExpanded] = useState(false)
  const [isExportersExpanded, setIsExportersExpanded] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  // Mock data - in real app this would come from API
  const wolthersLabs = [
    { id: 'santos', name: 'Santos Office', country: 'Colombia' },
    { id: 'guatemala', name: 'Guatemala Lab', country: 'Guatemala' }
  ]

  const importersRoasters = [
    { id: '1', name: 'Nordic Coffee Works', type: 'Roaster' },
    { id: '2', name: 'Global Bean Imports', type: 'Importer' }
  ]

  const exportersCoops = [
    { id: '1', name: 'Antigua Coffee Co-op', type: 'Cooperative' },
    { id: '2', name: 'Colombian Premium Exports', type: 'Exporter' }
  ]

  const handleAddNew = (type: string) => {
    // TODO: Open modal for adding new entity
    console.log(`Add new ${type}`)
  }

  return (
    <div className="w-80 bg-emerald-900 dark:bg-emerald-950 border-r border-emerald-800 dark:border-emerald-900 h-screen flex flex-col">
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
          className="w-full flex items-center justify-between p-2 hover:bg-emerald-800/30 rounded transition-all duration-200"
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
          <div className="mt-3 bg-emerald-800/20 rounded-lg p-4 space-y-4">
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
                    "w-full text-left px-3 py-2 text-sm rounded transition-colors",
                    theme === 'dark' 
                      ? "text-white bg-emerald-700/40" 
                      : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/30"
                  )}
                >
                  Dark
                </button>
                <button
                  onClick={() => toggleTheme()}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded transition-colors",
                    theme === 'light' 
                      ? "text-white bg-emerald-700/40" 
                      : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/30"
                  )}
                >
                  Light
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/30 rounded transition-colors"
                >
                  System
                </button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-emerald-700/30"></div>
            
            {/* Logout */}
            <button
              onClick={signOut}
              className="w-full text-left px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Line */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/30"></div>
      </div>

      {/* Navigation Icons */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="p-3 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-all duration-200"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </Link>
          
          <div className="p-3 rounded-full bg-emerald-600/60 text-white shadow-lg">
            <Building className="w-5 h-5" />
          </div>
          
          <Link
            href="/fleet"
            className="p-3 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-all duration-200"
            title="Vehicles"
          >
            <CarIcon className="w-5 h-5" />
          </Link>
          
          <button
            onClick={() => setShowUserModal(true)}
            className="p-3 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-all duration-200"
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
            setIsWolthersExpanded(!isWolthersExpanded)
          }}
          className={cn(
            "relative w-full flex items-center justify-between px-2 py-3 transition-all duration-200",
            selectedSection === 'wolthers'
              ? "text-white"
              : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/30"
          )}
        >
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5" />
            <span className="font-medium">Wolthers</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isWolthersExpanded && "rotate-180"
          )} />
          {selectedSection === 'wolthers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>

        {isWolthersExpanded && (
          <div className="mt-2 ml-4 space-y-1">
            {wolthersLabs.map((lab) => (
              <div
                key={lab.id}
                className="flex items-center justify-between px-4 py-2 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/30 transition-all duration-200 cursor-pointer"
              >
                <span>{lab.name}</span>
                <span className="text-xs text-emerald-400/60">{lab.country}</span>
              </div>
            ))}
            <button
              onClick={() => handleAddNew('lab')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/30 transition-all duration-200"
            >
              <Plus className="w-3 h-3" />
              <span>Add new lab</span>
            </button>
          </div>
        )}
      </div>

      {/* Separation Bar */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/30"></div>
      </div>

      {/* Importers/Roasters Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => {
            onSectionChange('importers')
            setIsImportersExpanded(!isImportersExpanded)
          }}
          className={cn(
            "relative w-full flex items-center justify-between px-2 py-3 transition-all duration-200",
            selectedSection === 'importers'
              ? "text-white"
              : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/30"
          )}
        >
          <div className="flex items-center gap-3">
            <Coffee className="w-5 h-5" />
            <span className="font-medium">Importers/Roasters</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isImportersExpanded && "rotate-180"
          )} />
          {selectedSection === 'importers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>

        {isImportersExpanded && (
          <div className="mt-2 ml-4 space-y-1">
            {importersRoasters.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between px-4 py-2 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/30 transition-all duration-200 cursor-pointer"
              >
                <span>{company.name}</span>
                <span className="text-xs text-emerald-400/60">{company.type}</span>
              </div>
            ))}
            <button
              onClick={() => handleAddNew('importer/roaster')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/30 transition-all duration-200"
            >
              <Plus className="w-3 h-3" />
              <span>Add new roaster/importer</span>
            </button>
          </div>
        )}
      </div>

      {/* Separation Bar */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/30"></div>
      </div>

      {/* Exporters/Producers/Coops Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => {
            onSectionChange('exporters')
            setIsExportersExpanded(!isExportersExpanded)
          }}
          className={cn(
            "relative w-full flex items-center justify-between px-2 py-3 transition-all duration-200",
            selectedSection === 'exporters'
              ? "text-white"
              : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-800/30"
          )}
        >
          <div className="flex items-center gap-3">
            <TreePine className="w-5 h-5" />
            <span className="font-medium">Exporters/Producers/Coops</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isExportersExpanded && "rotate-180"
          )} />
          {selectedSection === 'exporters' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>

        {isExportersExpanded && (
          <div className="mt-2 ml-4 space-y-1">
            {exportersCoops.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between px-4 py-2 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/30 transition-all duration-200 cursor-pointer"
              >
                <span>{company.name}</span>
                <span className="text-xs text-emerald-400/60">{company.type}</span>
              </div>
            ))}
            <button
              onClick={() => handleAddNew('exporter/producer/coop')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-800/30 transition-all duration-200"
            >
              <Plus className="w-3 h-3" />
              <span>Add new exporter/producer</span>
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
  )
}