import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disc3, Heart, CloudDownload, History, Dice6, ChevronRight } from 'lucide-react'
import { useCatalogStore } from '../stores/catalogStore'
import { usePlayerStore } from '../stores/playerStore'
import RemixCard from '../components/RemixCard'

export default function Home() {
  const { remixes, refresh, status, totalCount } = useCatalogStore()
  const { spinRoulette } = usePlayerStore()
  const navigate = useNavigate()
  const latest = remixes.slice(0, 8)

  useEffect(() => { refresh() }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-black text-text-primary tracking-wider mb-1">
          OC<span className="text-primary">R</span>eMix
        </h1>
        <p className="text-text-muted text-sm font-mono">
          {totalCount > 0
            ? `▶ ${totalCount.toLocaleString()} remixes in catalog`
            : '▶ Loading catalog…'
          }
        </p>
      </div>

      {/* Roulette buttons */}
      <div className="flex gap-3 mb-10">
        <button
          onClick={() => spinRoulette(false)}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                     bg-primary hover:bg-primary-dark text-white font-display font-semibold
                     tracking-wide shadow-glow transition-all hover:shadow-glow active:scale-95"
        >
          <Dice6 size={20} />
          RUSSIAN ROULETTE
        </button>
        <button
          onClick={() => { navigate('/catalog'); }}
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl
                     bg-surface border border-border hover:border-primary/40
                     text-text-secondary hover:text-primary-light transition-all"
        >
          <Disc3 size={18} />
          <span className="text-sm font-medium hidden sm:block">Browse All</span>
        </button>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { icon: Disc3,         label: 'All Remixes', sub: `${totalCount.toLocaleString()} tracks`, to: '/catalog',         color: 'text-primary-light' },
          { icon: Heart,         label: 'Favorites',   sub: 'Your saved picks',                      to: '/library?tab=fav', color: 'text-error' },
          { icon: CloudDownload, label: 'Downloads',   sub: 'Offline tracks',                        to: '/library?tab=dl',  color: 'text-success' },
          { icon: History,       label: 'History',     sub: 'Recently played',                       to: '/library?tab=his', color: 'text-accent' },
        ].map(({ icon: Icon, label, sub, to, color }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex flex-col items-start gap-2 p-4 rounded-xl bg-surface border border-border
                       hover:border-border-light hover:bg-elevated text-left transition-all group"
          >
            <Icon size={22} className={`${color} group-hover:scale-110 transition-transform`} />
            <div>
              <p className="text-text-primary text-sm font-medium">{label}</p>
              <p className="text-text-muted text-xs">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Latest remixes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-bold text-text-primary tracking-widest uppercase">
            Latest Remixes
          </h2>
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1 text-primary-light text-xs hover:text-primary transition-colors"
          >
            See all <ChevronRight size={14} />
          </button>
        </div>

        {status === 'loading-rss' && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        )}

        <div className="space-y-2">
          {latest.map(remix => (
            <RemixCard key={remix.id} remix={remix} queue={latest} />
          ))}
        </div>

        {latest.length === 0 && status !== 'loading-rss' && (
          <div className="text-center py-12 text-text-muted">
            <Disc3 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No remixes yet. Pull to refresh.</p>
          </div>
        )}
      </div>
    </div>
  )
}
