'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations('common')
  const tNav = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const { user, signOut } = useAuth()

  const displayName = user?.nameEn?.trim() || user?.nameAr?.trim() || ''
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder={t('search')} className="ps-9" />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
          >
            3
          </Badge>
          <span className="sr-only">{tNav('notifications')}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatarUrl} alt={displayName || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={displayName || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName || 'User'}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">{tNav('profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">{tNav('settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut()
                router.push('/login')
                router.refresh()
              }}
            >
              <LogOut className="me-2 h-4 w-4" />
              {tAuth('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
