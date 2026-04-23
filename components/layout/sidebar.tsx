'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  UserCircle,
  Building,
  CreditCard,
  Wrench,
  Megaphone,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/dashboard/properties', icon: Building2, labelKey: 'properties' },
  { href: '/dashboard/units', icon: Home, labelKey: 'units' },
  { href: '/dashboard/tenants', icon: Users, labelKey: 'tenants' },
  { href: '/dashboard/owners', icon: UserCircle, labelKey: 'owners' },
  { href: '/dashboard/associations', icon: Building, labelKey: 'associations' },
  { href: '/dashboard/payments', icon: CreditCard, labelKey: 'payments' },
  { href: '/dashboard/maintenance', icon: Wrench, labelKey: 'maintenance' },
  { href: '/dashboard/announcements', icon: Megaphone, labelKey: 'announcements' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const { signOut } = useAuth()

  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft

  return (
    <aside
      className={cn(
        'fixed start-0 top-0 z-40 flex h-screen flex-col border-e bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              {tCommon('appName').split(' ').slice(0, 2).join(' ')}
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="border-t p-2">
        <Link
          href="/dashboard/notifications"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <Bell className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('notifications')}</span>}
        </Link>
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('settings')}</span>}
        </Link>
        
        <Separator className="my-2" />
        
        <button
          onClick={() => signOut()}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('signOut')}</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute end-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full border bg-background shadow-sm"
      >
        <CollapseIcon className="h-4 w-4" />
      </Button>
    </aside>
  )
}
