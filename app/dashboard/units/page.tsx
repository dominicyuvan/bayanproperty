'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Home, MoreHorizontal, Pencil, Trash2, Eye, User, Bed, Bath, Square, Layers } from 'lucide-react'
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
import { UnitForm } from '@/components/units/unit-form'
import { useOpenAddDialogFromQuery } from '@/hooks/use-open-add-dialog-from-query'
import { formatOMR, type UnitStatus, type UnitType } from '@/lib/types'

const demoUnits: Array<{
  id: string
  propertyId: string
  propertyNameEn: string
  propertyNameAr: string
  unitNumber: string
  type: UnitType
  floor: number
  bedrooms: number
  bathrooms: number
  areaSquareMeters: number
  monthlyRent: number
  status: UnitStatus
  tenantNameEn?: string
  tenantNameAr?: string
}> = []

const statusStyles: Record<UnitStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
  vacant: { variant: 'secondary', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  occupied: { variant: 'default', className: '' },
  maintenance: { variant: 'outline', className: 'border-yellow-500 text-yellow-700' },
  reserved: { variant: 'outline', className: 'border-blue-500 text-blue-700' },
}

export default function UnitsPage() {
  const t = useTranslations('units')
  const tCommon = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  useOpenAddDialogFromQuery(setIsAddDialogOpen)

  const filteredUnits = demoUnits.filter((unit) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      unit.unitNumber.toLowerCase().includes(q) || String(unit.floor).includes(q)
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
    const matchesType = typeFilter === 'all' || unit.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {demoUnits.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addUnit')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addUnit')}</DialogTitle>
              <DialogDescription>
                Add a new unit to a property
              </DialogDescription>
            </DialogHeader>
            <UnitForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`${tCommon('search')} ${t('unitNumber').toLowerCase()}...`}
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
            <SelectItem value="vacant">{t('status.vacant')}</SelectItem>
            <SelectItem value="occupied">{t('status.occupied')}</SelectItem>
            <SelectItem value="maintenance">{t('status.maintenance')}</SelectItem>
            <SelectItem value="reserved">{t('status.reserved')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('unitType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="apartment">{t('types.apartment')}</SelectItem>
            <SelectItem value="studio">{t('types.studio')}</SelectItem>
            <SelectItem value="penthouse">{t('types.penthouse')}</SelectItem>
            <SelectItem value="office">{t('types.office')}</SelectItem>
            <SelectItem value="shop">{t('types.shop')}</SelectItem>
            <SelectItem value="villa">{t('types.villa')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Units Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[7rem]">{t('unitNumber')}</TableHead>
              <TableHead className="hidden md:table-cell min-w-[8rem] max-w-[12rem]">
                {t('linkedProperty')}
              </TableHead>
              <TableHead>{t('unitType')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('specSummary')}</TableHead>
              <TableHead className="text-end">{t('monthlyRent')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[7rem] max-w-[11rem]">{t('tenant')}</TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.map((unit) => {
              const propertyName = unit.propertyNameEn
              const tenantName = unit.tenantNameEn
              const style = statusStyles[unit.status]

              return (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <Home className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate font-medium tabular-nums">{unit.unitNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-0 max-w-[12rem]">
                    <span className="block truncate text-muted-foreground">{propertyName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="max-w-full whitespace-normal text-xs font-normal">
                      {t(`types.${unit.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {t('floorShort', { floor: unit.floor })}
                      </span>
                      {unit.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {unit.bedrooms}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        {unit.bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Square className="h-3 w-3" />
                        {unit.areaSquareMeters}m²
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    <span className="font-medium">{formatOMR(unit.monthlyRent)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={style.variant} className={`whitespace-nowrap ${style.className}`}>
                      {t(`status.${unit.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell min-w-0 max-w-[11rem]">
                    {tenantName ? (
                      <div className="flex min-w-0 items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{tenantName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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

        {filteredUnits.length === 0 && (
          <div className="flex flex-col items-center justify-center border-t py-12 text-center">
            <Home className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No units found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
