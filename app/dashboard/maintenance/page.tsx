'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Wrench, MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'
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
import { MaintenanceForm } from '@/components/maintenance/maintenance-form'
import { type MaintenancePriority, type MaintenanceStatus } from '@/lib/types'

const demoRequests: Array<{
  id: string
  unitNumber: string
  tenantNameEn: string
  tenantNameAr: string
  title: string
  titleAr: string
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  createdAt: Date
  assignedTo?: string
  resolvedAt?: Date
}> = []

const priorityStyles: Record<MaintenancePriority, { className: string }> = {
  low: { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  medium: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  high: { className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  urgent: { className: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

const statusStyles: Record<MaintenanceStatus, { icon: React.ComponentType<{ className?: string }>, className: string }> = {
  open: { icon: Clock, className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  in_progress: { icon: Wrench, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  resolved: { icon: CheckCircle2, className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  cancelled: { icon: XCircle, className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
}

export default function MaintenancePage() {
  const t = useTranslations('maintenance')
  const tCommon = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredRequests = demoRequests.filter((request) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      request.title.toLowerCase().includes(q) ||
      request.titleAr.toLowerCase().includes(q) ||
      request.unitNumber.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Stats
  const stats = {
    open: demoRequests.filter(r => r.status === 'open').length,
    inProgress: demoRequests.filter(r => r.status === 'in_progress').length,
    resolved: demoRequests.filter(r => r.status === 'resolved').length,
    urgent: demoRequests.filter(r => r.priority === 'urgent' && r.status !== 'resolved').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {demoRequests.length} requests
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addRequest')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('addRequest')}</DialogTitle>
              <DialogDescription>
                Submit a new maintenance request
              </DialogDescription>
            </DialogHeader>
            <MaintenanceForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-600">
              <Clock className="h-4 w-4" />
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <Wrench className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.urgent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`${tCommon('search')}...`}
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
            <SelectItem value="open">{t('status.open')}</SelectItem>
            <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
            <SelectItem value="resolved">{t('status.resolved')}</SelectItem>
            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="low">{t('priority.low')}</SelectItem>
            <SelectItem value="medium">{t('priority.medium')}</SelectItem>
            <SelectItem value="high">{t('priority.high')}</SelectItem>
            <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredRequests.map((request) => {
          const title = request.title
          const tenantName = request.tenantNameEn
          const priorityStyle = priorityStyles[request.priority]
          const statusStyle = statusStyles[request.status]
          const StatusIcon = statusStyle.icon

          return (
            <Card key={request.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight">{title}</CardTitle>
                    <CardDescription>
                      {request.unitNumber} - {tenantName}
                    </CardDescription>
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
                  {request.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={priorityStyle.className}>
                    {t(`priority.${request.priority}`)}
                  </Badge>
                  <Badge variant="outline" className={statusStyle.className}>
                    <StatusIcon className="me-1 h-3 w-3" />
                    {t(`status.${request.status}`)}
                  </Badge>
                </div>

                {request.assignedTo && (
                  <p className="text-xs text-muted-foreground">
                    {t('assignedTo')}: {request.assignedTo}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Created: {request.createdAt.toLocaleDateString('en-OM')}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No requests found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
