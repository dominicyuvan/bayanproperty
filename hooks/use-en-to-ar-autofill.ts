'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldPath, FieldValues, UseFormSetValue, UseFormWatch } from 'react-hook-form'

type Options = {
  debounceMs?: number
  minSourceChars?: number
  enabled?: boolean
}

/**
 * When the Arabic field is empty, fills it from a debounced EN→AR translation of the English field.
 * Stops overriding once the user types anything in the Arabic field (until they clear it).
 */
export function useEnToArAutofill<T extends FieldValues>({
  watch,
  setValue,
  enPath,
  arPath,
  options,
}: {
  watch: UseFormWatch<T>
  enPath: FieldPath<T>
  arPath: FieldPath<T>
  setValue: UseFormSetValue<T>
  options?: Options
}) {
  const { debounceMs = 600, minSourceChars = 2, enabled = true } = options ?? {}
  const [translating, setTranslating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  const en = (watch(enPath) as string) ?? ''
  const ar = (watch(arPath) as string) ?? ''

  const setAr = useCallback(
    (value: string) => {
      setValue(arPath, value as never, { shouldValidate: true, shouldDirty: true })
    },
    [arPath, setValue]
  )

  useEffect(() => {
    if (!enabled) return
    const arTrim = ar.trim()
    const enTrim = en.trim()
    if (arTrim.length > 0) return
    if (enTrim.length < minSourceChars) return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      inFlight.current?.abort()
      const c = new AbortController()
      inFlight.current = c
      setTranslating(true)
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: enTrim, to: 'ar' }),
          signal: c.signal,
        })
        const data = (await res.json()) as { translated?: string }
        if (c.signal.aborted) return
        if (res.ok && data.translated?.trim()) {
          setAr(data.translated.trim())
        }
      } catch {
        // network / abort: leave field empty; user can type or retry by editing English
      } finally {
        if (!c.signal.aborted) setTranslating(false)
      }
    }, debounceMs)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [en, ar, enabled, minSourceChars, debounceMs, setAr])

  return { translating, arFieldEmpty: ar.trim().length === 0 }
}
