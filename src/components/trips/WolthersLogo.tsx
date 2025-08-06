'use client'

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { UserCircle, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface WolthersLogoProps {
  onMobileMenuToggle?: (isOpen: boolean) => void
  onMenuHeightChange?: (height: number) => void
}

export default function WolthersLogo({ onMobileMenuToggle, onMenuHeightChange }: WolthersLogoProps) {
  const { user, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [otherTripsExpanded, setOtherTripsExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    onMobileMenuToggle?.(isMobileMenuOpen)
  }, [isMobileMenuOpen, onMobileMenuToggle])

  useEffect(() => {
    if (menuRef.current && isMobileMenuOpen) {
      const height = menuRef.current.offsetHeight
      onMenuHeightChange?.(height)
    } else {
      onMenuHeightChange?.(0)
    }
  }, [isMobileMenuOpen, otherTripsExpanded, onMenuHeightChange])

  return (
    <div className="fixed top-0 left-0 right-0 z-40 transition-all duration-300">
      <div className={`transition-all duration-300 ${
        isScrolled 
          ? 'bg-emerald-800/95 dark:bg-emerald-900/95 backdrop-blur-xl py-3 border-b border-emerald-700/30 dark:border-emerald-800/40 shadow-lg' 
          : 'bg-emerald-800 dark:bg-emerald-900 py-6 border-b border-emerald-700/50 dark:border-emerald-800/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            {/* Light mode logo */}
            <Image
              src="/images/logos/wolthers-logo-off-white.svg"
              alt="Wolthers & Associates"
              width={isScrolled ? 140 : 180}
              height={isScrolled ? 38 : 48}
              priority
              className={`transition-all duration-300 dark:hidden ${
                isScrolled ? 'h-8 sm:h-10' : 'h-12 sm:h-12'
              } w-auto`}
            />
            {/* Dark mode logo */}
            <Image
              src="/images/logos/wolthers-logo-off-white.svg"
              alt="Wolthers & Associates"
              width={isScrolled ? 140 : 180}
              height={isScrolled ? 38 : 48}
              priority
              className={`transition-all duration-300 hidden dark:block ${
                isScrolled ? 'h-8 sm:h-10' : 'h-12 sm:h-12'
              } w-auto`}
            />
          </div>
          
          {/* Center content - Trip Itinerary (Hidden on mobile) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex-col items-center hidden md:flex">
            <p className={`text-golden-400 font-semibold tracking-wider uppercase transition-all duration-300 ${
              isScrolled ? 'text-sm' : 'text-lg'
            }`}>
              Trip Itinerary
            </p>
          </div>
          
          {/* Desktop - User Profile/Theme Toggle - Right Side */}
          <div className="hidden md:flex">
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <div className="text-right mr-3">
                  <div className="text-sm font-medium text-emerald-100 dark:text-emerald-200">
                    {user?.email || 'User'}
                  </div>
                  {!isScrolled && user?.role && (
                    <div className="text-xs text-emerald-200/80 dark:text-emerald-300/80 capitalize">
                      {user.role}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    className="relative"
                  >
                    <div className={cn(
                      "rounded-full transition-all duration-300 ease-in-out",
                      isScrolled ? "w-6 h-3" : "w-8 h-4",
                      theme === 'dark' ? "bg-[#0E3D2F]" : "bg-white/30"
                    )}>
                      <div className={cn(
                        "absolute rounded-full transition-all duration-300 ease-in-out transform flex items-center justify-center",
                        isScrolled ? "top-0.5 w-2 h-2" : "top-0.5 w-3 h-3",
                        theme === 'dark'
                          ? (isScrolled ? "translate-x-3.5" : "translate-x-4.5") + " bg-white"
                          : "translate-x-0.5 bg-white"
                      )}>
                        {theme === 'dark' ? (
                          <Moon className={cn(isScrolled ? "w-1 h-1" : "w-1.5 h-1.5", "text-[#0E3D2F]")} />
                        ) : (
                          <Sun className={cn(isScrolled ? "w-1 h-1" : "w-1.5 h-1.5", "text-amber-600")} />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    className="p-2 rounded-full text-emerald-100 dark:text-emerald-200 hover:text-white hover:bg-emerald-700/20 dark:hover:bg-emerald-800/20 transition-all duration-200"
                    title="User Profile"
                  >
                    <UserCircle className={`${isScrolled ? 'w-6 h-6' : 'w-8 h-8'} transition-all duration-300`} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Theme Toggle - For guests when not authenticated */}
            {!isAuthenticated && (
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="relative"
              >
                <div className={cn(
                  "rounded-full transition-all duration-300 ease-in-out",
                  isScrolled ? "w-6 h-3" : "w-8 h-4",
                  theme === 'dark' ? "bg-[#0E3D2F]" : "bg-white/30"
                )}>
                  <div className={cn(
                    "absolute rounded-full transition-all duration-300 ease-in-out transform flex items-center justify-center",
                    isScrolled ? "top-0.5 w-2 h-2" : "top-0.5 w-3 h-3",
                    theme === 'dark'
                      ? (isScrolled ? "translate-x-3.5" : "translate-x-4.5") + " bg-white"
                      : "translate-x-0.5 bg-white"
                  )}>
                    {theme === 'dark' ? (
                      <Moon className={cn(isScrolled ? "w-1 h-1" : "w-1.5 h-1.5", "text-[#0E3D2F]")} />
                    ) : (
                      <Sun className={cn(isScrolled ? "w-1 h-1" : "w-1.5 h-1.5", "text-amber-600")} />
                    )}
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Mobile - Hamburger Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-emerald-100 dark:text-emerald-200 hover:text-white hover:bg-emerald-700/20 dark:hover:bg-emerald-800/20 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

      </div>
      
      {/* Mobile Menu Dropdown - Outside the fixed header */}
      {isMobileMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-emerald-800 dark:bg-emerald-900 border-b border-emerald-700/50 dark:border-emerald-800/60 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* User Info */}
            {isAuthenticated && user && (
              <div className="pb-3 border-b border-emerald-700/30">
                <div className="text-sm font-medium text-emerald-100 dark:text-emerald-200">
                  {user.email}
                </div>
                {user.role && (
                  <div className="text-xs text-emerald-200/80 dark:text-emerald-300/80 capitalize">
                    {user.role}
                  </div>
                )}
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-emerald-100 hover:bg-emerald-700/20 rounded-md transition-colors">
                Account Settings
              </button>
              
              {/* Other Trips - Only show if user has multiple trips */}
              <div>
                <button 
                  onClick={() => setOtherTripsExpanded(!otherTripsExpanded)}
                  className="w-full text-left px-3 py-2 text-emerald-100 hover:bg-emerald-700/20 rounded-md transition-colors flex items-center justify-between"
                >
                  <span>Other Trips</span>
                  <span className="text-xs text-emerald-300">
                    {otherTripsExpanded ? '−' : '+'}
                  </span>
                </button>
                
                {/* Expandable Trip List */}
                {otherTripsExpanded && (
                  <div className="mt-2 pl-3 space-y-1">
                    {/* Mock trips - replace with actual userTrips */}
                    <a href="/trips/CPH_NESP_BT_0825" className="block px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-700/20 rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>CPH_NESP_BT_0825</span>
                      </div>
                    </a>
                    <a href="/trips/AMS_DCI_QA_0825" className="block px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-700/20 rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-60"></div>
                        <span>AMS_DCI_QA_0825</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
              
              <button 
                onClick={toggleTheme}
                className="w-full text-left px-3 py-2 text-emerald-100 hover:bg-emerald-700/20 rounded-md transition-colors flex items-center justify-between"
              >
                <span>Theme</span>
                <span className="text-xs text-emerald-300">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer div to prevent content from going under fixed header and mobile menu */}
      <div className={`transition-all duration-300 ${
        isScrolled ? 'h-16' : 'h-24'
      } ${isMobileMenuOpen ? 'mb-48' : ''}`}></div>
    </div>
  )
}