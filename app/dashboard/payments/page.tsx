'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, CreditCard, MoreHorizontal, Pencil, Trash2, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PaymentForm } from '@/components/payments/payment-form'
import { useOpenAddDialogFromQuery } from '@/hooks/use-open-add-dialog-from-query'
import { formatOMR, type PaymentStatus, type PaymentType } from '@/lib/types'

const demoPayments: Array<{
  id: string
  unitNumber: string
  tenantNameEn: string
  tenantNameAr: string
  amount: number
  type: PaymentType
  status: PaymentStatus
  dueDate: Date
  paidDate?: Date
  method?: string
  reference?: string
}> = []

const statusStyles: Record<PaymentStatus, { icon: React.ComponentType<{ className?: string }>, variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
  pending: { icon: Clock, variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  paid: { icon: CheckCircle2, variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  overdue: { icon: AlertCircle, variant: 'destructive', className: '' },
  partial: { icon: Clock, variant: 'outline', className: 'border-blue-500 text-blue-700' },
}

export default function PaymentsPage() {
  const t = useTranslations('payments')
  const tCommon = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  useOpenAddDialogFromQuery(setIsAddDialogOpen)

  const filteredPayments = demoPayments.filter((payment) => {
    const name = payment.tenantNameEn
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      name.toLowerCase().includes(q) ||
      payment.tenantNameAr.toLowerCase().includes(q) ||
      payment.unitNumber.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesType = typeFilter === 'all' || payment.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate stats
  const stats = {
    total: demoPayments.reduce((sum, p) => sum + p.amount, 0),
    paid: demoPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pending: demoPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: demoPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {demoPayments.length} payment records
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addPayment')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('addPayment')}</DialogTitle>
              <DialogDescription>
                Record a new payment
              </DialogDescription>
            </DialogHeader>
            <PaymentForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatOMR(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatOMR(stats.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatOMR(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatOMR(stats.overdue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`${tCommon('search')} tenant or unit...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={tCommon('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="paid">{t('status.paid')}</SelectItem>
            <SelectItem value="overdue">{t('status.overdue')}</SelectItem>
            <SelectItem value="partial">{t('status.partial')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={tCommon('type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="rent">{t('types.rent')}</SelectItem>
            <SelectItem value="service_charge">{t('types.service_charge')}</SelectItem>
            <SelectItem value="deposit">{t('types.deposit')}</SelectItem>
            <SelectItem value="utility">{t('types.utility')}</SelectItem>
            <SelectItem value="maintenance">{t('types.maintenance')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[7rem]">{t('unit')}</TableHead>
              <TableHead className="hidden md:table-cell min-w-[8rem] max-w-[12rem]">{t('tenant')}</TableHead>
              <TableHead>{tCommon('type')}</TableHead>
              <TableHead className="text-end">{tCommon('amount')}</TableHead>
              <TableHead className="whitespace-nowrap">{t('dueDate')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => {
              const tenantName = payment.tenantNameEn
              const style = statusStyles[payment.status]
              const StatusIcon = style.icon

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate font-medium tabular-nums">{payment.unitNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-0 max-w-[12rem]">
                    <span className="block truncate text-muted-foreground">{tenantName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="max-w-full whitespace-normal text-xs font-normal">
                      {t(`types.${payment.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    <span className="font-medium">{formatOMR(payment.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {payment.dueDate.toLocaleDateString('en-OM')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={style.variant} className={`whitespace-nowrap ${style.className}`}>
                      <StatusIcon className="me-1 h-3 w-3" />
                      {t(`status.${payment.status}`)}
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

        {filteredPayments.length === 0 && (
          <div className="flex flex-col items-center justify-center border-t py-12 text-center">
            <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No payments found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
