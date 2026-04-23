'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, firebaseUser, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && !firebaseUser) {
      router.replace('/login')
    }
  }, [firebaseUser, loading, initialized, router])

  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!firebaseUser || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed top-0 z-40 h-screen w-64 bg-sidebar transition-transform md:hidden',
          'left-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </div>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          'md:ml-64',
          sidebarCollapsed && 'md:ml-16',
        )}
      >
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
