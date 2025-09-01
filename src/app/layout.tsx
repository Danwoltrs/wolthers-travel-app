import type { Metadata } from 'next'
import './globals.css'
import ConditionalHeader from '@/components/layout/ConditionalHeader'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { TripCacheProvider } from '@/contexts/TripCacheContext'
import { ModalProvider } from '@/hooks/use-modal'
import ErrorBoundary, { CacheErrorBoundary, SyncErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Wolthers Travel App',
  description: 'Travel management for Wolthers & Associates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script src="/extension-protection.js" async></script>
      </head>
      {/* Prevent horizontal scroll on narrow viewports */}
      <body suppressHydrationWarning={true} className="overflow-x-hidden">
        <ErrorBoundary context="general">
          <AuthProvider>
            <ThemeProvider>
              <CacheErrorBoundary>
                <SyncErrorBoundary>
                  <TripCacheProvider>
                    <ModalProvider>
                      <ConditionalHeader />
                      {/* Ensure pages don't introduce horizontal scrolling */}
                      <main className="min-h-screen overflow-x-hidden">
                        {children}
                      </main>
                    </ModalProvider>
                  </TripCacheProvider>
                </SyncErrorBoundary>
              </CacheErrorBoundary>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}