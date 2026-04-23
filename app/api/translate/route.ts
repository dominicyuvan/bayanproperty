import { NextRequest, NextResponse } from 'next/server'

const MAX_LEN = 4000

/**
 * EN→AR (or AR→EN) using MyMemory public API. Suitable for form labels/addresses; add a paid engine for high volume.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text : ''
    const to = body.to === 'en' ? 'en' : 'ar'
    const from = to === 'ar' ? 'en' : 'ar'

    if (!text.trim()) {
      return NextResponse.json({ translated: '' })
    }
    if (text.length > MAX_LEN) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }

    const pair = `${from}|${to}`
    const url = new URL('https://api.mymemory.translated.net/get')
    url.searchParams.set('q', text)
    url.searchParams.set('langpair', pair)

    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ translated: '', error: 'Translation service unavailable' }, { status: 502 })
    }

    const data = (await res.json()) as { responseData?: { translatedText?: string } }
    const translated = data.responseData?.translatedText?.trim() ?? ''
    return NextResponse.json({ translated })
  } catch {
    return NextResponse.json({ translated: '', error: 'Translation failed' }, { status: 500 })
  }
}
