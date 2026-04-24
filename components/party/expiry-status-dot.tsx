'use client'

import { cn } from '@/lib/utils'
import type { ExpiryUrgency } from '@/lib/expiry-urgency'

export function ExpiryStatusDot({
  urgency,
  className,
  title,
}: {
  urgency: ExpiryUrgency
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-block size-2.5 shrink-0 rounded-full',
        urgency === 'expired' && 'bg-red-500',
        urgency === 'warning' && 'bg-amber-400',
        urgency === 'ok' && 'bg-emerald-500',
        urgency === 'none' && 'bg-muted-foreground/35',
        className,
      )}
    />
  )
}
