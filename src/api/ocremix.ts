import axios from 'axios'
import type { Remix } from '../types'

// ─── Routing ──────────────────────────────────────────────────────────────────
// DEV:  /ocr/* → Vite proxy → https://ocremix.org/* (server-side, no CORS)
// PROD: /ocr/* → Vercel rewrite → https://ocremix.org/* (same path, no CORS)
const BASE_PATH   = '/ocr'
const OCR_DIRECT  = 'https://ocremix.org'          // for MP3 URLs (html5 audio is permissive)

// ─── Axios ────────────────────────────────────────────────────────────────────
const http = axios.create({ timeout: 25_000 })

// ─── Latest remixes — homepage scraping ───────────────────────────────────────
//
// Strategy: fetch the OCRemix homepage (always at /) which shows the latest
// remixes. Extract OCR IDs + titles from the HTML. No RSS needed.
//
export async function fetchLatestRemixes(): Promise<Partial<Remix>[]> {
  // Strategy 1: OCRemix JavaScript feed — returns JS with latest remix links
  // Format: document.write('...href="/remix/OCRxxxxx"...title text...')
  try {
    const { data: js } = await http.get<string>(BASE_PATH + '/feeds/javascript/')
    const remixes = parseJsFeed(js)
    if (remixes.length > 0) {
      console.log(`[OCRemix] JS feed parsed — ${remixes.length} remixes`)
      return remixes
    }
  } catch { /* fall through */ }

  // Strategy 2: Homepage scraping
  try {
    const { data: html } = await http.get<string>(BASE_PATH + '/')
    const remixes = parseHomepageRemixes(html)
    if (remixes.length > 0) {
      console.log(`[OCRemix] Homepage parsed — ${remixes.length} remixes found`)
      return remixes
    }
  } catch (err) {
    console.warn('[OCRemix] Homepage fetch failed:', err)
  }

  // Strategy 3: Known recent IDs
  console.warn('[OCRemix] Falling back to known recent IDs…')
  return fetchRecentByIds()
}

function parseJsFeed(js: string): Partial<Remix>[] {
  // JS feed contains lines like:
  // document.write('...href="/remix/OCR05032"...Game 'Song' OC ReMix...')
  const seen = new Set<string>()
  const results: Partial<Remix>[] = []

  const idPattern = /href=\\"\/remix\/(OCR\d+)\\"|href="\/remix\/(OCR\d+)"/g
  const titlePattern = />(.*?OC ReMix)<\//g

  const ids = [...js.matchAll(/OCR(\d+)/g)].map(m => 'OCR' + m[1].padStart(5, '0'))
  const titles = [...js.matchAll(/([^<>"]+OC ReMix)/g)].map(m =>
    m[1].trim().replace(/\\'/g, "'").replace(/\'/g, "'")
  )

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    if (seen.has(id)) continue
    seen.add(id)

    const numericId = parseInt(id.replace(/\D/g, ''), 10)
    const raw = titles[i] ?? ''
    const titleMatch = raw.match(/^(.+?)\s+'(.+?)'\s+OC\s+ReMix$/i)

    results.push({
      id, numericId,
      title:     raw || id,
      game:      titleMatch?.[1]?.trim() ?? 'Unknown',
      songTitle: titleMatch?.[2]?.trim() ?? '',
      mp3Url:    buildMp3Url(id),
      remixers: [], genres: [],
      system: '', composer: '', posted: '',
    })
  }

  return results
    .sort((a, b) => (b.numericId ?? 0) - (a.numericId ?? 0))
    .slice(0, 10)
}

function parseHomepageRemixes(html: string): Partial<Remix>[] {
  const seen    = new Set<string>()
  const results: Partial<Remix>[] = []

  // Multiple patterns to handle OCRemix's HTML structure
  const patterns = [
    // Standard anchor: href="/remix/OCRxxxxx">Title</a>
    /href="\/remix\/(OCR\d+)"[^>]*>\s*([^<]{5,}?)\s*</g,
    // Anchor with title attribute
    /href="\/remix\/(OCR\d+)"[^>]*title="([^"]{5,})"/g,
  ]

  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const id    = m[1]
      const raw   = decodeHtmlEntities(m[2]?.trim() ?? '')
      if (seen.has(id) || !raw) continue
      seen.add(id)

      const numericId  = parseInt(id.replace(/\D/g, ''), 10)
      const titleMatch = raw.match(/^(.+?)\s+'(.+?)'\s+OC\s+ReMix$/i)

      results.push({
        id, numericId,
        title:     raw || id,
        game:      titleMatch?.[1]?.trim() ?? 'Unknown',
        songTitle: titleMatch?.[2]?.trim() ?? '',
        mp3Url:    buildMp3Url(id),
        remixers: [], genres: [],
        system: '', composer: '', posted: '',
      })
    }
  }

  // Also collect all OCR IDs that appear anywhere, in case anchor text is empty/parsed wrong
  const allIds = [...new Set([...html.matchAll(/\/remix\/(OCR\d+)/g)].map(m => m[1]))]
  for (const id of allIds) {
    if (!seen.has(id)) {
      seen.add(id)
      results.push({
        id,
        numericId:  parseInt(id.replace(/\D/g, ''), 10),
        title:      id,
        game:       'Unknown',
        songTitle:  '',
        mp3Url:     buildMp3Url(id),
        remixers: [], genres: [],
        system: '', composer: '', posted: '',
      })
    }
  }

  // Sort by numeric ID descending (newest first), take top 10
  return results
    .sort((a, b) => (b.numericId ?? 0) - (a.numericId ?? 0))
    .slice(0, 10)
}

// ─── Fallback: fetch recent IDs we know exist ─────────────────────────────────
async function fetchRecentByIds(): Promise<Partial<Remix>[]> {
  // OCRemix IDs are sequential; ~4000-5000 range as of 2024-2025
  // We try from a high ID downward; skip any that 404
  const candidates: string[] = []
  for (let i = 4100; i >= 4050; i--) {
    candidates.push('OCR' + String(i).padStart(5, '0'))
  }
  const results = await fetchRemixBatch(candidates.slice(0, 10))
  return results.filter(r => r.title && r.title !== r.id)
}

// ─── Per-remix page scraper ───────────────────────────────────────────────────
export async function fetchRemixDetail(id: string): Promise<Partial<Remix>> {
  const { data: html } = await http.get<string>(BASE_PATH + '/remix/' + id)
  return parseRemixPage(id, html)
}

function parseRemixPage(id: string, html: string): Partial<Remix> {
  const text = (re: RegExp) => re.exec(html)?.[1]?.trim() ?? ''
  // matchAll() requires the global flag — auto-add it if missing
  const many = (re: RegExp) => {
    const gr = re.global ? re : new RegExp(re.source, re.flags + 'g')
    return [...html.matchAll(gr)].map(m => m[1]?.trim() ?? '').filter(Boolean)
  }

  const game       = decodeHtmlEntities(text(/\/game\/\d+\/[^"]*"[^>]*>([^<]+)<\/a>/))
  const system     = text(/\/system\/[^"]*"[^>]*>([^<]+)<\/a>/)
  const composer   = many(/\/composer\/\d+\/[^"]*"[^>]*>([^<]+)<\/a>/).join(', ')
  const remixers   = many(/\/artist\/\d+\/[^"]*"[^>]*>([^<]+)<\/a>/)
  const genres     = many(/class="genre[^"]*"[^>]*>([^<]+)<\/(?:span|a)>/)
  const songTitle  = decodeHtmlEntities(text(/\/song\/\d+\/[^"]*"[^>]*>([^<]+)<\/a>/))
  const pageTitle  = decodeHtmlEntities(
    text(/<title>([^<]+)<\/title>/).replace(' | OverClocked ReMix', '')
  )

  // ── MP3 URL extraction (try patterns from most → least specific) ─────────────
  // OCRemix pages embed the audio URL in various ways depending on the era/template.
  // We try href/src attributes (absolute and relative), then any .mp3 URL in the page.
  const OCR_BASE = 'https://ocremix.org'

  const rawMp3 = (
    // 1. <a href="https://...mp3"> or <audio src="https://...mp3"> — double OR single quotes
    html.match(/(?:href|src)=["'](https?:\/\/[^"']+\.mp3)["']/i)?.[1] ??
    // 2. Relative path: href="/files/music/remixes/...mp3"
    (() => {
      const rel = html.match(/(?:href|src)=["'](\/files\/music\/remixes\/[^"']+\.mp3)["']/i)?.[1]
      return rel ? OCR_BASE + rel : undefined
    })() ??
    // 3. URL in any quoted context containing /remixes/
    html.match(/["'](https?:\/\/[^"'\s]+\/remixes\/[^"'\s]+\.mp3)["']/i)?.[1] ??
    // 4. Broadest: any absolute .mp3 URL anywhere in the page
    html.match(/(https?:\/\/[^"'<>\s]+\.mp3)/)?.[1] ??
    buildMp3Url(id)  // true placeholder — audio will fail, logged in playerStore
  )

  // In dev, route CDN audio through Vite proxy (avoids timeout/CORS on CDN servers)
  const mp3Url = proxyAudioUrl(rawMp3)

  console.log('[OCRemix] parseRemixPage', id,
    rawMp3 === buildMp3Url(id) ? '⚠ PLACEHOLDER (regex miss)' : '✓ ' + rawMp3
  )

  const imgMatch = html.match(/src="(\/files\/images\/games\/[^"]+)"/)
  const imageUrl = imgMatch ? OCR_DIRECT + imgMatch[1] : undefined
  const posted   = text(/posted[^>]*>([^<]*\d{4}[^<]*)<\/(?:span|time|p)/i)

  return {
    id,
    numericId: parseInt(id.replace(/\D/g, ''), 10),
    title:     pageTitle || id,
    game:      game || 'Unknown',
    system, composer, remixers, genres, songTitle,
    mp3Url, imageUrl, posted,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Proxy audio CDN URLs through Vite in development ────────────────────────
const CDN_PROXIES: [RegExp, string][] = [
  [/^https?:\/\/iterations\.org/,              '/cdn/iterations'],
  [/^https?:\/\/djpretzel\.web\.aplus\.net/, '/cdn/djpretzel'],
  // Proxy placeholder OCRemix URLs too — if they redirect to a CDN,
  // the server-side Vite proxy follows the redirect cleanly
  [/^https?:\/\/(?:www\.)?ocremix\.org\/files\/music/, '/cdn/ocremix/files/music'],
]

function proxyAudioUrl(url: string): string {
  if (!import.meta.env.DEV) return url
  for (const [re, proxy] of CDN_PROXIES) {
    if (re.test(url)) return url.replace(re, proxy)
  }
  return url
}

export function buildMp3Url(id: string) {
  return OCR_DIRECT + '/files/music/remixes/' + id + '.mp3'
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
}

// ─── Batch fetch with rate limiting ───────────────────────────────────────────
export async function fetchRemixBatch(
  ids: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Partial<Remix>[]> {
  const results: Partial<Remix>[] = []
  const CONCURRENCY = 3
  const DELAY_MS    = 400

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const chunk   = ids.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(chunk.map(fetchRemixDetail))
    settled.forEach(r => { if (r.status === 'fulfilled') results.push(r.value) })
    onProgress?.(Math.min(i + CONCURRENCY, ids.length), ids.length)
    if (i + CONCURRENCY < ids.length) await delay(DELAY_MS)
  }
  return results
}

export async function getLatestRemixId(): Promise<number> {
  let low = 4000, high = 5500
  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2)
    try {
      await http.head(BASE_PATH + '/remix/OCR' + String(mid).padStart(5, '0'))
      low = mid
    } catch {
      high = mid
    }
  }
  return low
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
