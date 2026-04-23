'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, Eye, Mail, Phone } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type LeaseStatus = 'active' | 'expired' | 'pending'

type TenantRow = {
  id: string
  nameEn: string
  nameAr: string
  email: string
  phone: string
  unitNumber: string
  leaseStatus: LeaseStatus
}

const tenants: TenantRow[] = []

const leaseBadge: Record<LeaseStatus, { variant: 'default' | 'secondary' | 'outline' }> = {
  active: { variant: 'default' },
  expired: { variant: 'secondary' },
  pending: { variant: 'outline' },
}

export default function TenantsPage() {
  const t = useTranslations('tenants')
  const tCommon = useTranslations('common')
  const { locale } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filtered = tenants.filter((row) => {
    const name = (locale === 'ar' ? row.nameAr : row.nameEn).toLowerCase()
    const q = searchQuery.toLowerCase()
    return (
      name.includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      row.unitNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {tenants.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addTenant')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addTenant')}</DialogTitle>
              <DialogDescription>
                {locale === 'ar'
                  ? 'سيتم ربط إضافة المستأجرين بقاعدة البيانات قريباً. يمكن للمستأجرين التسجيل من صفحة إنشاء الحساب.'
                  : 'Adding tenants from here will connect to your database soon. Tenants can also sign up via Register.'}
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
              {tCommon('close')}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tCommon('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon('name')}</TableHead>
              <TableHead className="hidden md:table-cell">{tCommon('email')}</TableHead>
              <TableHead className="hidden lg:table-cell">{tCommon('phone')}</TableHead>
              <TableHead>{t('currentUnit')}</TableHead>
              <TableHead>{t('leaseStatus')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const name = locale === 'ar' ? row.nameAr : row.nameEn
              const lease = leaseBadge[row.leaseStatus]

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Mail className="h-3 w-3 shrink-0" />
                      {row.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Phone className="h-3 w-3 shrink-0" />
                      {row.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{row.unitNumber}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lease.variant} className="text-xs">
                      {t(`lease.${row.leaseStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="me-2 h-4 w-4" />
                          {tCommon('view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="me-2 h-4 w-4" />
                          {tCommon('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="me-2 h-4 w-4" />
                          {tCommon('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              {locale === 'ar' ? 'لا يوجد مستأجرون' : 'No tenants found'}
            </h3>
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'جرّب تعديل البحث' : 'Try adjusting your search'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
