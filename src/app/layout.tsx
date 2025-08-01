import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'

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
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}