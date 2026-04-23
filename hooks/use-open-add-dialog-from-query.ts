'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Opens the page "add" dialog when the URL contains `?add=1`, then removes the param
 * so refresh and back navigation behave normally.
 */
export function useOpenAddDialogFromQuery(
  setOpen: (open: boolean) => void,
  onOpenFromQuery?: () => void,
) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const onOpenFromQueryRef = useRef(onOpenFromQuery)
  onOpenFromQueryRef.current = onOpenFromQuery

  useEffect(() => {
    if (searchParams.get('add') !== '1') return

    setOpen(true)
    onOpenFromQueryRef.current?.()
    const next = new URLSearchParams(searchParams.toString())
    next.delete('add')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams, setOpen])
}
