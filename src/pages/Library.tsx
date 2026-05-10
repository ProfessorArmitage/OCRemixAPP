import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Heart, CloudDownload, History, Trash2 } from 'lucide-react'
import { getFavorites, getHistory } from '../services/database'
import RemixCard from '../components/RemixCard'
import type { Remix } from '../types'

type Tab = 'fav' | 'dl' | 'his'

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab]     = useState<Tab>((searchParams.get('tab') as Tab) ?? 'fav')
  const [remixes, setRemixes] = useState<Remix[]>([])
  const [loading, setLoading] = useState(false)

  const load = async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'fav') setRemixes(await getFavorites())
      else if (t === 'his') setRemixes(await getHistory(100))
      else setRemixes([]) // downloads: TODO with service worker caching
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(tab) }, [tab])

  const switchTab = (t: Tab) => {
    setTab(t)
    setSearchParams({ tab: t })
  }

  const tabs = [
    { key: 'fav' as Tab, icon: Heart,         label: 'Favorites' },
    { key: 'dl'  as Tab, icon: CloudDownload, label: 'Downloads' },
    { key: 'his' as Tab, icon: History,       label: 'History'   },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32 animate-fade-in">
      <h1 className="font-display text-sm font-bold text-text-primary tracking-widest uppercase mb-6">
        Library
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

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />)}
        </div>
      ) : remixes.length > 0 ? (
        <div className="space-y-2">
          {remixes.map(remix => <RemixCard key={remix.id} remix={remix} queue={remixes} />)}
        </div>
      ) : (
        <Empty tab={tab} />
      )}
    </div>
  )
}

function Empty({ tab }: { tab: Tab }) {
  const config = {
    fav: { icon: Heart,         title: 'No favorites yet',        sub: 'Tap the ♥ on any remix to save it' },
    dl:  { icon: CloudDownload, title: 'No downloaded tracks',    sub: 'Download button appears on each remix page' },
    his: { icon: History,       title: 'No history yet',          sub: 'Your recently played tracks appear here' },
  }
  const { icon: Icon, title, sub } = config[tab]
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
      <Icon size={48} className="opacity-20" />
      <p className="font-display text-sm tracking-widest uppercase">{title}</p>
      <p className="text-xs text-center max-w-xs">{sub}</p>
    </div>
  )
}
