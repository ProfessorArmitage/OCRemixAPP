import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, SlidersHorizontal, X, Dice6 } from 'lucide-react'
import { useCatalogStore } from '../stores/catalogStore'
import { usePlayerStore } from '../stores/playerStore'
import { getDistinctGames, getDistinctSystems } from '../services/database'
import RemixCard from '../components/RemixCard'
import type { CatalogFilters } from '../types'

export default function Catalog() {
  const { remixes, filters, setFilters, clearFilters, loadNextPage, hasMore, totalCount, status, refresh } =
    useCatalogStore()
  const { spinRoulette, setRouletteFilters } = usePlayerStore()

  const [search, setSearch]       = useState(filters.searchText ?? '')
  const [showPanel, setShowPanel] = useState(false)
  const [games, setGames]         = useState<string[]>([])
  const [systems, setSystems]     = useState<string[]>([])
  const loaderRef = useRef<HTMLDivElement>(null)

  // Load filter options once
  useEffect(() => {
    getDistinctGames().then(setGames)
    getDistinctSystems().then(setSystems)
    refresh()
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setFilters({ ...filters, searchText: search || undefined }), 300)
    return () => clearTimeout(t)
  }, [search])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadNextPage() }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadNextPage])

  const activeCount = Object.values(filters).filter(Boolean).length
  const isFiltered  = activeCount > 0

  const handleFilteredRoulette = () => {
    setRouletteFilters(filters)
    spinRoulette(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32 animate-fade-in">
      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5
                        focus-within:border-primary/50 transition-colors">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search remixes, games, artists…"
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} className="text-text-muted hover:text-text-primary" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowPanel(true)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
            ${isFiltered
              ? 'bg-primary-dim border-primary/40 text-primary-light'
              : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-light'
            }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:block">Filters</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {isFiltered && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.game     && <Chip label={`🎮 ${filters.game}`}     onRemove={() => setFilters({ ...filters, game: undefined })} />}
          {filters.system   && <Chip label={`🕹️ ${filters.system}`}   onRemove={() => setFilters({ ...filters, system: undefined })} />}
          {filters.composer && <Chip label={`🎼 ${filters.composer}`} onRemove={() => setFilters({ ...filters, composer: undefined })} />}
          {filters.remixer  && <Chip label={`🎹 ${filters.remixer}`}  onRemove={() => setFilters({ ...filters, remixer: undefined })} />}
          {filters.genre    && <Chip label={`🎵 ${filters.genre}`}    onRemove={() => setFilters({ ...filters, genre: undefined })} />}
          <button onClick={clearFilters} className="text-error text-xs px-3 py-1 rounded-full border border-error/30 hover:bg-error/10 transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* Stats + roulette */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-muted text-sm font-mono">
          {totalCount.toLocaleString()} remixes
        </p>
        <button
          onClick={handleFilteredRoulette}
          className="flex items-center gap-1.5 text-xs text-primary-light hover:text-primary
                     bg-primary-dim border border-primary/30 rounded-full px-3 py-1.5 transition-colors"
        >
          <Dice6 size={13} />
          {isFiltered ? 'Random (filtered)' : 'Random'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {remixes.map(remix => (
          <RemixCard key={remix.id} remix={remix} queue={remixes} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="py-6 flex justify-center">
        {hasMore && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Filter Panel */}
      {showPanel && (
        <FilterPanel
          filters={filters}
          games={games}
          systems={systems}
          onApply={setFilters}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}

// ─── Chip ──────────────────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 text-xs text-primary-light bg-primary-dim border border-primary/30 rounded-full px-3 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-primary transition-colors"><X size={11} /></button>
    </span>
  )
}

// ─── Filter Panel (slide-over) ────────────────────────────────────────────────

interface FilterPanelProps {
  filters:  CatalogFilters
  games:    string[]
  systems:  string[]
  onApply:  (f: CatalogFilters) => void
  onClose:  () => void
}

type Tab = 'game' | 'system' | 'other'

function FilterPanel({ filters, games, systems, onApply, onClose }: FilterPanelProps) {
  const [local, setLocal] = useState<CatalogFilters>(filters)
  const [tab, setTab]     = useState<Tab>('game')

  const list = tab === 'game' ? games : tab === 'system' ? systems : []

  const apply = () => { onApply(local); onClose() }
  const reset = () => { onApply({}); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="w-full max-w-sm h-full bg-surface border-l border-border flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-sm font-bold tracking-widest text-text-primary uppercase">Filters</h2>
          <button onClick={onClose}><X size={20} className="text-text-muted hover:text-text-primary" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 py-3 border-b border-border">
          {(['game','system','other'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize
                ${tab === t
                  ? 'bg-primary text-white shadow-glow-sm'
                  : 'bg-elevated text-text-muted hover:text-text-primary'
                }`}
            >
              {t === 'game' ? '🎮 Game' : t === 'system' ? '🕹️ System' : '✨ Other'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {tab === 'other' ? (
            <div className="px-4 space-y-3 py-2">
              {[
                { key: 'composer', label: 'Composer', placeholder: 'e.g. Nobuo Uematsu' },
                { key: 'remixer',  label: 'Remixer',  placeholder: 'e.g. djpretzel' },
                { key: 'genre',    label: 'Genre',    placeholder: 'e.g. Jazz, Orchestral' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-text-muted mb-1.5 font-mono uppercase tracking-wide">{label}</label>
                  <input
                    value={(local as Record<string,string>)[key] ?? ''}
                    onChange={e => setLocal(l => ({ ...l, [key]: e.target.value || undefined }))}
                    placeholder={placeholder}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary
                               placeholder:text-text-muted outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              ))}
            </div>
          ) : (
            list.map(item => {
              const isSelected = tab === 'game' ? local.game === item : local.system === item
              return (
                <button
                  key={item}
                  onClick={() => {
                    if (tab === 'game')   setLocal(l => ({ ...l, game:   isSelected ? undefined : item }))
                    if (tab === 'system') setLocal(l => ({ ...l, system: isSelected ? undefined : item }))
                  }}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm text-left
                    border-b border-border/50 transition-colors
                    ${isSelected ? 'text-primary-light bg-primary-dim' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'}`}
                >
                  <span>{item}</span>
                  {isSelected && <span className="text-primary text-xs">✓</span>}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-4 border-t border-border">
          <button onClick={reset} className="flex-1 py-3 rounded-xl border border-border text-text-muted text-sm hover:border-border-light transition-colors">
            Clear
          </button>
          <button onClick={apply} className="flex-2 flex-grow-[2] py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-glow-sm transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
