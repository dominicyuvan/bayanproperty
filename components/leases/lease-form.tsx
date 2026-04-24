'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { subscribeTenantRecords } from '@/lib/tenants-db'
import { getPartyIdSubtitle } from '@/lib/party-display'
import type { TenantRecord } from '@/lib/types'

/**
 * UI for choosing a tenant in a lease context (no persistence to a `leases` collection).
 */
export function LeaseForm() {
  const t = useTranslations('party')
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [tenantId, setTenantId] = useState<string>('')

  useEffect(() => {
    const unsub = subscribeTenantRecords((rows) => setTenants(rows))
    return () => unsub()
  }, [])

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="lease-tenant">{t('selectTenant')}</FieldLabel>
        <Select value={tenantId || undefined} onValueChange={setTenantId}>
          <SelectTrigger id="lease-tenant" className="w-full max-w-lg">
            <SelectValue placeholder={t('selectTenantPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((row) => (
              <SelectItem key={row.id} value={row.id} textValue={row.nameEn}>
                <div className="flex flex-col gap-0.5 py-0.5 text-start">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wide">
                      {row.partyType === 'company' ? t('company') : t('individual')}
                    </Badge>
                    <span className="font-medium">{row.nameEn}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{getPartyIdSubtitle(row)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
