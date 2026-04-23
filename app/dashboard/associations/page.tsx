'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Building, Users, DollarSign, MoreHorizontal, Pencil, Trash2, Eye, Mail, Phone } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { AssociationForm } from '@/components/associations/association-form'
import { formatOMR } from '@/lib/types'

const demoAssociations: Array<{
  id: string
  nameEn: string
  nameAr: string
  propertyCount: number
  memberCount: number
  annualBudget: number
  chairpersonNameEn: string
  chairpersonNameAr: string
  contactEmail: string
  contactPhone: string
}> = []

export default function AssociationsPage() {
  const t = useTranslations('associations')
  const tCommon = useTranslations('common')
  const { locale } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredAssociations = demoAssociations.filter((association) => {
    const name = locale === 'ar' ? association.nameAr : association.nameEn
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {demoAssociations.length} associations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addAssociation')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addAssociation')}</DialogTitle>
              <DialogDescription>
                Create a new owner&apos;s association
              </DialogDescription>
            </DialogHeader>
            <AssociationForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tCommon('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Associations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssociations.map((association) => {
          const name = locale === 'ar' ? association.nameAr : association.nameEn
          const chairperson = locale === 'ar' ? association.chairpersonNameAr : association.chairpersonNameEn
          const initials = chairperson.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

          return (
            <Card key={association.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{name}</CardTitle>
                      <CardDescription className="text-xs">
                        {association.propertyCount} properties
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
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
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chairperson */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{chairperson}</p>
                    <p className="text-xs text-muted-foreground">{t('chairperson')}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{association.memberCount}</p>
                      <p className="text-xs text-muted-foreground">{t('members')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatOMR(association.annualBudget)}</p>
                      <p className="text-xs text-muted-foreground">{t('annualBudget')}</p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Mail className="me-1 h-3 w-3" />
                    {association.contactEmail}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Phone className="me-1 h-3 w-3" />
                    {association.contactPhone}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAssociations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No associations found</h3>
          <p className="text-muted-foreground">Try adjusting your search</p>
        </div>
      )}
    </div>
  )
}
