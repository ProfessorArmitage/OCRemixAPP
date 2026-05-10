import Dexie, { type Table } from 'dexie'
import type { Remix, CatalogFilters } from '../types'

// ─── Schema ──────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id?:       number
  remixId:   string
  playedAt:  string
}

interface CatalogMeta {
  key:   string
  value: string
}

class OCRemixDatabase extends Dexie {
  remixes!:      Table<Remix,        string>
  history!:      Table<HistoryEntry, number>
  catalog_meta!: Table<CatalogMeta,  string>

  constructor() {
    super('ocremix_v1')
    this.version(1).stores({
      remixes:      'id, numericId, game, system, composer, posted, isFavorite, isDownloaded',
      history:      '++id, remixId, playedAt',
      catalog_meta: 'key',
    })
  }
}

export const db = new OCRemixDatabase()

// ─── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertRemixes(remixes: Partial<Remix>[]): Promise<void> {
  const valid = remixes.filter(r => r.id) as Remix[]
  await db.remixes.bulkPut(
    valid.map(r => ({
      isFavorite:   false,
      isDownloaded: false,
      ...r,
    }))
  )
}

// ─── Query ───────────────────────────────────────────────────────────────────

export async function queryRemixes(
  filters: CatalogFilters = {},
  page = 0,
  pageSize = 40
): Promise<Remix[]> {
  let collection = db.remixes.orderBy('numericId').reverse()

  // Dexie doesn't support compound WHERE efficiently; filter in JS after index lookup
  const all = await collection.toArray()

  const filtered = all.filter(r => {
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase()
      if (
        !r.title.toLowerCase().includes(q) &&
        !r.game.toLowerCase().includes(q) &&
        !r.remixers.some(a => a.toLowerCase().includes(q))
      ) return false
    }
    if (filters.game     && r.game !== filters.game) return false
    if (filters.system   && r.system !== filters.system) return false
    if (filters.composer && !r.composer.toLowerCase().includes(filters.composer.toLowerCase())) return false
    if (filters.remixer  && !r.remixers.some(a => a.toLowerCase().includes((filters.remixer ?? '').toLowerCase()))) return false
    if (filters.genre    && !r.genres.some(g => g.toLowerCase().includes((filters.genre ?? '').toLowerCase()))) return false
    return true
  })

  return filtered.slice(page * pageSize, (page + 1) * pageSize)
}

export async function getRemixById(id: string): Promise<Remix | undefined> {
  return db.remixes.get(id)
}

export async function getRandomRemix(filters?: CatalogFilters): Promise<Remix | null> {
  const pool = await queryRemixes(filters ?? {}, 0, 9999)
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function getTotalCount(): Promise<number> {
  return db.remixes.count()
}

export async function getDistinctGames(): Promise<string[]> {
  const all = await db.remixes.orderBy('game').uniqueKeys()
  return all.filter(Boolean) as string[]
}

export async function getDistinctSystems(): Promise<string[]> {
  const all = await db.remixes.orderBy('system').uniqueKeys()
  return (all as string[]).filter(Boolean)
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function setFavorite(id: string, value: boolean): Promise<void> {
  await db.remixes.update(id, { isFavorite: value })
}

export async function getFavorites(): Promise<Remix[]> {
  return db.remixes.filter(r => r.isFavorite === true).toArray()
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function addToHistory(remixId: string): Promise<void> {
  await db.history.add({ remixId, playedAt: new Date().toISOString() })
  const count = await db.history.count()
  if (count > 500) {
    const oldest = await db.history.orderBy('playedAt').limit(count - 500).primaryKeys()
    await db.history.bulkDelete(oldest as number[])
  }
}

export async function getHistory(limit = 60): Promise<Remix[]> {
  const entries = await db.history.orderBy('playedAt').reverse().limit(limit).toArray()
  const ids     = [...new Set(entries.map(e => e.remixId))]
  const remixes = await db.remixes.bulkGet(ids)
  return remixes.filter(Boolean) as Remix[]
}

// ─── Catalog meta ─────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
  return (await db.catalog_meta.get(key))?.value ?? null
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.catalog_meta.put({ key, value })
}

// ─── Browse stats ─────────────────────────────────────────────────────────────

export interface GameStat   { name: string; count: number; imageUrl?: string }
export interface SystemStat { name: string; count: number }

export async function getGamesWithStats(): Promise<GameStat[]> {
  const all = await db.remixes.orderBy('game').toArray()
  const map = new Map<string, GameStat>()
  for (const r of all) {
    if (!r.game || r.game === 'Unknown') continue
    const e = map.get(r.game)
    if (e) { e.count++; if (!e.imageUrl && r.imageUrl) e.imageUrl = r.imageUrl }
    else     map.set(r.game, { name: r.game, count: 1, imageUrl: r.imageUrl })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSystemsWithStats(): Promise<SystemStat[]> {
  const all = await db.remixes.orderBy('system').toArray()
  const map = new Map<string, SystemStat>()
  for (const r of all) {
    if (!r.system) continue
    const e = map.get(r.system)
    if (e) e.count++
    else    map.set(r.system, { name: r.system, count: 1 })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}
