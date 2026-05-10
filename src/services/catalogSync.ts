import { fetchLatestRemixes, fetchRemixBatch, getLatestRemixId } from '../api/ocremix'
import { upsertRemixes, getTotalCount, getMeta, setMeta } from './database'
import type { CatalogStatus } from '../types'

type Progress = (status: CatalogStatus, done: number, total: number) => void

// ─── Quick RSS refresh (fast, every app open) ─────────────────────────────────

export async function quickRefresh(): Promise<void> {
  const items = await fetchLatestRemixes()
  if (items.length) {
    await upsertRemixes(items)
    await setMeta('lastRssRefresh', new Date().toISOString())
  }
}

// ─── Full catalog sync (slow, run once / on demand) ───────────────────────────

export async function fullCatalogSync(onProgress: Progress): Promise<void> {
  onProgress('loading-catalog', 0, 0)

  const syncedUpTo = parseInt((await getMeta('syncedUpToId')) ?? '0', 10)

  let latestId: number
  try {
    latestId = await getLatestRemixId()
    await setMeta('latestKnownId', String(latestId))
  } catch {
    latestId = parseInt((await getMeta('latestKnownId')) ?? '4500', 10)
  }

  if (syncedUpTo >= latestId) { onProgress('ready', latestId, latestId); return }

  const ids: string[] = []
  for (let i = syncedUpTo + 1; i <= latestId; i++) {
    ids.push(`OCR${String(i).padStart(5, '0')}`)
  }

  let done = 0
  const BATCH = 15

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch   = ids.slice(i, i + BATCH)
    const results = await fetchRemixBatch(batch, (bd) => onProgress('loading-catalog', done + bd, ids.length))
    await upsertRemixes(results)
    done += batch.length
    const lastId = parseInt(batch.at(-1)!.replace(/\D/g, ''), 10)
    await setMeta('syncedUpToId', String(lastId))
    onProgress('loading-catalog', done, ids.length)
  }

  await setMeta('lastFullSync', new Date().toISOString())
  onProgress('ready', ids.length, ids.length)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function isCatalogEmpty(): Promise<boolean> {
  return (await getTotalCount()) === 0
}

export async function getSyncInfo() {
  const [lastRss, lastFull, syncedTo, latestKnown] = await Promise.all([
    getMeta('lastRssRefresh'),
    getMeta('lastFullSync'),
    getMeta('syncedUpToId'),
    getMeta('latestKnownId'),
  ])
  return {
    lastRss,
    lastFull,
    totalTracks: await getTotalCount(),
    latestId: parseInt(latestKnown ?? syncedTo ?? '0', 10),
  }
}
