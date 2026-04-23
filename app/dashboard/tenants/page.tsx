'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, Eye, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
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
import { TenantForm } from '@/components/tenants/tenant-form'
import { useOpenAddDialogFromQuery } from '@/hooks/use-open-add-dialog-from-query'
import { subscribeTenantRecords } from '@/lib/tenants-db'
import type { TenantLeaseStatus, TenantRecord } from '@/lib/types'

const leaseBadge: Record<TenantLeaseStatus, { variant: 'default' | 'secondary' | 'outline' }> = {
  active: { variant: 'default' },
  expired: { variant: 'secondary' },
  pending: { variant: 'outline' },
}

export default function TenantsPage() {
  const t = useTranslations('tenants')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const { locale } = useLocale()
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [tenantFormKey, setTenantFormKey] = useState(0)
  const listErrorShown = useRef(false)

  useOpenAddDialogFromQuery(setIsAddDialogOpen, () => setTenantFormKey((k) => k + 1))

  useEffect(() => {
    listErrorShown.current = false
    const unsubscribe = subscribeTenantRecords(
      (rows) => setTenants(rows),
      (err) => {
        console.error(err)
        if (!listErrorShown.current) {
          listErrorShown.current = true
          const code =
            err && typeof err === 'object' && 'code' in err
              ? String((err as { code: string }).code)
              : ''
          if (code === 'permission-denied') {
            toast.error(tErrors('firestorePermissionDenied'))
          } else {
            toast.error(tErrors('somethingWentWrong'))
          }
        }
      },
    )
    return () => unsubscribe()
  }, [tErrors])

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
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) setTenantFormKey((k) => k + 1)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addTenant')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addTenant')}</DialogTitle>
              <DialogDescription>{t('addTenantDescription')}</DialogDescription>
            </DialogHeader>
            <TenantForm key={tenantFormKey} onSuccess={() => setIsAddDialogOpen(false)} />
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

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[10rem] max-w-[14rem]">{tCommon('name')}</TableHead>
              <TableHead className="hidden md:table-cell max-w-[14rem]">{tCommon('email')}</TableHead>
              <TableHead className="hidden lg:table-cell w-[9rem]">{tCommon('phone')}</TableHead>
              <TableHead className="w-[7rem]">{t('currentUnit')}</TableHead>
              <TableHead>{t('leaseStatus')}</TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const name = locale === 'ar' ? row.nameAr : row.nameEn
              const lease = leaseBadge[row.leaseStatus]

              return (
                <TableRow key={row.id}>
                  <TableCell className="min-w-0 max-w-[14rem]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-0 max-w-[14rem]">
                    <span className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{row.email}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{row.phone}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-sm tabular-nums">{row.unitNumber}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lease.variant} className="text-xs whitespace-nowrap">
                      {t(`lease.${row.leaseStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-12 text-end">
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
          <div className="flex flex-col items-center justify-center border-t py-12 text-center">
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
