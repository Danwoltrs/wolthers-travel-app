'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return default values for SSR compatibility
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      setTheme: () => {}
    }
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('wolthers-theme') as Theme
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme)
      } else {
        // Check system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setThemeState(systemTheme)
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error)
    }
    setMounted(true)
  }, [])

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (!mounted) return

    try {
      localStorage.setItem('wolthers-theme', theme)
      
      // Apply theme class to html element
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
      
      // Also set data attribute for more specific targeting
      root.setAttribute('data-theme', theme)
    } catch (error) {
      console.error('Error applying theme:', error)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121]">
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}