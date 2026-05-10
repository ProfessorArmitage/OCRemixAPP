import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Gamepad2, Monitor, Search, X, ChevronRight, ArrowUpDown } from 'lucide-react'
import { getGamesWithStats, getSystemsWithStats } from '../services/database'
import { useCatalogStore } from '../stores/catalogStore'
import type { GameStat, SystemStat } from '../services/database'

type BrowseTab = 'games' | 'systems'
type GameSort  = 'alpha-asc' | 'alpha-desc' | 'count-desc' | 'count-asc'

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab]       = useState<BrowseTab>((searchParams.get('tab') as BrowseTab) ?? 'games')
  const [games, setGames]   = useState<GameStat[]>([])
  const [systems, setSystems] = useState<SystemStat[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<GameSort>('alpha-asc')

  useEffect(() => {
    setLoading(true)
    Promise.all([getGamesWithStats(), getSystemsWithStats()])
      .then(([g, s]) => { setGames(g); setSystems(s) })
      .finally(() => setLoading(false))
  }, [])

  const switchTab = (t: BrowseTab) => {
    setTab(t)
    setSearch('')
    setSearchParams({ tab: t })
  }

  const filteredGames = useMemo(() => {
    let list = search
      ? games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
      : games
    switch (sort) {
      case 'alpha-asc':   return [...list].sort((a, b) => a.name.localeCompare(b.name))
      case 'alpha-desc':  return [...list].sort((a, b) => b.name.localeCompare(a.name))
      case 'count-desc':  return [...list].sort((a, b) => b.count - a.count)
      case 'count-asc':   return [...list].sort((a, b) => a.count - b.count)
    }
  }, [games, search, sort])

  const filteredSystems = useMemo(() =>
    search
      ? systems.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      : systems
  , [systems, search])

  const tabs = [
    { key: 'games'   as BrowseTab, icon: Gamepad2, label: 'Games'   },
    { key: 'systems' as BrowseTab, icon: Monitor,  label: 'Systems' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-32 animate-fade-in">
      <h1 className="font-display text-sm font-bold text-text-primary tracking-widest uppercase mb-6">
        Browse
      </h1>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${tab === key
                ? 'bg-primary-dim border border-primary/40 text-primary-light shadow-glow-sm'
                : 'bg-surface border border-border text-text-muted hover:text-text-primary hover:border-border-light'
              }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5
                        focus-within:border-primary/50 transition-colors">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'games' ? 'Search games…' : 'Search systems…'}
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} className="text-text-muted hover:text-text-primary" />
            </button>
          )}
        </div>

        {tab === 'games' && (
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as GameSort)}
              className="appearance-none flex items-center gap-2 px-4 py-2.5 pr-8 rounded-xl border border-border
                         bg-surface text-text-secondary text-sm font-medium cursor-pointer
                         hover:border-border-light hover:text-text-primary transition-colors outline-none
                         focus:border-primary/50"
            >
              <option value="alpha-asc">A → Z</option>
              <option value="alpha-desc">Z → A</option>
              <option value="count-desc">Most remixes</option>
              <option value="count-asc">Least remixes</option>
            </select>
            <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        )}
      </div>

      {/* Count */}
      <p className="text-text-muted text-sm font-mono mb-4">
        {tab === 'games'
          ? `${filteredGames.length.toLocaleString()} games`
          : `${filteredSystems.length.toLocaleString()} systems`
        }
      </p>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-xl bg-surface animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : tab === 'games' ? (
        filteredGames.length > 0
          ? <GamesGrid games={filteredGames} />
          : <Empty icon={Gamepad2} text="No games found" />
      ) : (
        filteredSystems.length > 0
          ? <SystemsList systems={filteredSystems} />
          : <Empty icon={Monitor} text="No systems found" />
      )}
    </div>
  )
}

// ─── Games grid ───────────────────────────────────────────────────────────────

function GamesGrid({ games }: { games: GameStat[] }) {
  const { setFilters } = useCatalogStore()
  const navigate = useNavigate()

  const handleClick = (name: string) => {
    setFilters({ game: name })
    navigate('/catalog')
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {games.map(g => (
        <button
          key={g.name}
          onClick={() => handleClick(g.name)}
          className="flex flex-col rounded-xl bg-surface border border-border
                     hover:border-primary/40 hover:bg-elevated transition-all group text-left overflow-hidden"
        >
          {/* Cover art */}
          <div className="aspect-square w-full overflow-hidden bg-elevated">
            {g.imageUrl
              ? <img
                  src={g.imageUrl}
                  alt={g.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              : <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 size={36} className="text-primary/25" />
                </div>
            }
          </div>
          {/* Info */}
          <div className="p-2.5">
            <p className="text-text-primary text-xs font-medium leading-tight line-clamp-2 mb-1">
              {g.name}
            </p>
            <p className="text-text-muted text-[10px] font-mono">
              {g.count} {g.count === 1 ? 'remix' : 'remixes'}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Systems list ─────────────────────────────────────────────────────────────

function SystemsList({ systems }: { systems: SystemStat[] }) {
  const { setFilters } = useCatalogStore()
  const navigate = useNavigate()

  const handleClick = (name: string) => {
    setFilters({ system: name })
    navigate('/catalog')
  }

  return (
    <div className="space-y-1">
      {systems.map(s => (
        <button
          key={s.name}
          onClick={() => handleClick(s.name)}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-surface border border-border
                     hover:border-border-light hover:bg-elevated transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center shrink-0
                          group-hover:bg-primary-dim group-hover:border group-hover:border-primary/20 transition-all">
            <Monitor size={18} className="text-primary/50 group-hover:text-primary-light transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">{s.name}</p>
            <p className="text-text-muted text-xs font-mono">
              {s.count} {s.count === 1 ? 'remix' : 'remixes'}
            </p>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-primary-light transition-colors shrink-0" />
        </button>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
      <Icon size={48} className="opacity-20" />
      <p className="font-display text-sm tracking-widest uppercase">{text}</p>
      <p className="text-xs text-center max-w-xs">
        Sync the catalog from Profile to populate this view.
      </p>
    </div>
  )
}
