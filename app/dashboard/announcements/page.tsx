'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Megaphone, MoreHorizontal, Pencil, Trash2, Eye, Bell, Mail, MessageSquare, AlertTriangle, Info, Calendar } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AnnouncementForm } from '@/components/announcements/announcement-form'
import { type AnnouncementType, type AnnouncementPriority, type AnnouncementTarget } from '@/lib/types'

const demoAnnouncements: Array<{
  id: string
  title: string
  titleAr: string
  content: string
  contentAr: string
  type: AnnouncementType
  targetAudience: AnnouncementTarget
  priority: AnnouncementPriority
  publishedAt: Date
  expiresAt?: Date
  createdBy: string
  notificationsSent: { email: boolean; sms: boolean }
}> = []

const typeIcons: Record<AnnouncementType, React.ComponentType<{ className?: string }>> = {
  general: Info,
  urgent: AlertTriangle,
  maintenance: Megaphone,
  payment_reminder: Bell,
  association: MessageSquare,
}

const priorityStyles: Record<AnnouncementPriority, { className: string }> = {
  normal: { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  high: { className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  urgent: { className: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

export default function AnnouncementsPage() {
  const t = useTranslations('announcements')
  const tCommon = useTranslations('common')
  const { locale } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredAnnouncements = demoAnnouncements.filter((announcement) => {
    const title = locale === 'ar' ? announcement.titleAr : announcement.title
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {demoAnnouncements.length} announcements
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addAnnouncement')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addAnnouncement')}</DialogTitle>
              <DialogDescription>
                Create a new announcement for your tenants and owners
              </DialogDescription>
            </DialogHeader>
            <AnnouncementForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={tCommon('type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="general">{t('types.general')}</SelectItem>
            <SelectItem value="urgent">{t('types.urgent')}</SelectItem>
            <SelectItem value="maintenance">{t('types.maintenance')}</SelectItem>
            <SelectItem value="payment_reminder">{t('types.payment_reminder')}</SelectItem>
            <SelectItem value="association">{t('types.association')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => {
          const title = locale === 'ar' ? announcement.titleAr : announcement.title
          const content = locale === 'ar' ? announcement.contentAr : announcement.content
          const TypeIcon = typeIcons[announcement.type]
          const priorityStyle = priorityStyles[announcement.priority]

          return (
            <Card key={announcement.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      announcement.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                      announcement.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base leading-tight">{title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <span>{announcement.createdBy}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {announcement.publishedAt.toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-OM')}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
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
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content}
                </p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {t(`types.${announcement.type}`)}
                  </Badge>
                  <Badge variant="outline" className={priorityStyle.className}>
                    {t(`priority.${announcement.priority}`)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t(`targets.${announcement.targetAudience}`)}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className={`h-3 w-3 ${announcement.notificationsSent.email ? 'text-green-600' : ''}`} />
                    Email {announcement.notificationsSent.email ? 'sent' : 'not sent'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className={`h-3 w-3 ${announcement.notificationsSent.sms ? 'text-green-600' : ''}`} />
                    SMS {announcement.notificationsSent.sms ? 'sent' : 'not sent'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No announcements found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
