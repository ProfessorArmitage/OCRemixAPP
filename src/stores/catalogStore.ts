import { create } from 'zustand'
import { queryRemixes, getTotalCount } from '../services/database'
import { quickRefresh } from '../services/catalogSync'
import type { Remix, CatalogFilters, CatalogStatus } from '../types'

interface CatalogStore {
  remixes:      Remix[]
  totalCount:   number
  page:         number
  filters:      CatalogFilters
  status:       CatalogStatus
  hasMore:      boolean
  syncProgress: { done: number; total: number }

  setFilters:     (f: CatalogFilters) => void
  clearFilters:   () => void
  loadPage:       (reset?: boolean) => Promise<void>
  loadNextPage:   () => Promise<void>
  refresh:        () => Promise<void>
  setSyncStatus:  (s: CatalogStatus, done?: number, total?: number) => void
}

const PAGE = 40

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  remixes:      [],
  totalCount:   0,
  page:         0,
  filters:      {},
  status:       'idle',
  hasMore:      true,
  syncProgress: { done: 0, total: 0 },

  setFilters: (filters) => {
    set({ filters, page: 0, remixes: [] })
    get().loadPage(true)
  },

  clearFilters: () => {
    set({ filters: {}, page: 0, remixes: [] })
    get().loadPage(true)
  },

  loadPage: async (reset = false) => {
    const { filters, page } = get()
    const targetPage = reset ? 0 : page
    const rows  = await queryRemixes(filters, targetPage, PAGE)
    const total = await getTotalCount()
    set(s => ({
      remixes:    reset ? rows : [...s.remixes, ...rows],
      page:       targetPage + 1,
      totalCount: total,
      hasMore:    rows.length === PAGE,
    }))
  },

  loadNextPage: async () => {
    if (!get().hasMore) return
    await get().loadPage(false)
  },

  refresh: async () => {
    set({ status: 'loading-rss' })
    try {
      await quickRefresh()
      await get().loadPage(true)
      set({ status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },

  setSyncStatus: (status, done = 0, total = 0) =>
    set({ status, syncProgress: { done, total } }),
}))
