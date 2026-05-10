import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Music2, ExternalLink, Heart, Play, Loader2, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { getRemixById, setFavorite, upsertRemixes } from '../services/database'
import { fetchRemixDetail } from '../api/ocremix'
import { useCatalogStore } from '../stores/catalogStore'
import { usePlayerStore } from '../stores/playerStore'
import type { Remix } from '../types'

const isPlaceholder = (url?: string) => !!url?.match(/\/OCR\d{5}\.mp3$/)

export default function RemixDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const { setFilters }  = useCatalogStore()
  const { playRemix }   = usePlayerStore()

  const [remix,      setRemix]      = useState<Remix | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [fetching,   setFetching]   = useState(false)
  const [error,      setError]      = useState(false)
  const [isFav,      setIsFav]      = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      const cached = await getRemixById(id)
      if (cached) {
        setRemix(cached)
        setIsFav(!!cached.isFavorite)
      }

      // Fetch fresh detail if not cached OR if mp3Url is placeholder (enriches data)
      if (!cached || isPlaceholder(cached.mp3Url)) {
        setFetching(true)
        try {
          const detail   = await fetchRemixDetail(id)
          const enriched = { ...(cached ?? {}), ...detail } as Remix
          await upsertRemixes([enriched])
          setRemix(enriched)
          setIsFav(!!enriched.isFavorite)
        } catch (err) {
          if (!cached) setError(true)
        } finally {
          setFetching(false)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleFavorite = async () => {
    if (!remix) return
    const next = !isFav
    await setFavorite(remix.id, next)
    setIsFav(next)
  }

  const handleGenre = (genre: string) => {
    setFilters({ genre })
    navigate('/catalog')
  }

  const handleGame = () => {
    if (!remix?.game) return
    setFilters({ game: remix.game })
    navigate('/catalog')
  }

  const handlePlay = () => {
    if (remix) playRemix(remix)
  }

  if (loading) return <DetailSkeleton />

  if (error || !remix) {
    return (
      <div className="max-w-lg mx-auto px-6 py-12 flex flex-col items-center gap-6 animate-fade-in">
        <AlertTriangle size={48} className="text-error/60" />
        <div className="text-center">
          <p className="font-display text-sm tracking-widest uppercase text-text-primary mb-2">
            Remix not found
          </p>
          <p className="text-text-muted text-sm">{id} could not be loaded.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:border-border-light transition-colors"
          >
            Go back
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-glow-sm hover:bg-primary-dark transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-text-muted hover:text-text-primary text-sm transition-colors mb-6"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      {/* Main layout: stack on mobile, side-by-side on md+ */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Artwork */}
        <div className="shrink-0 mx-auto md:mx-0">
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-surface shadow-card">
            {remix.imageUrl
              ? <img src={remix.imageUrl} alt={remix.game} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={56} className="text-primary/20" />
                </div>
            }
            {/* OCR ID badge */}
            <span className="absolute top-2.5 left-2.5 font-mono text-[10px] bg-black/60 text-primary-light px-2 py-0.5 rounded backdrop-blur-sm">
              {remix.id}
            </span>
            {fetching && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={24} className="text-primary-light animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Title */}
          <div>
            <h1 className="text-text-primary text-xl font-semibold leading-tight mb-1">
              {remix.title}
            </h1>
            <button
              onClick={handleGame}
              className="text-primary-light text-sm hover:text-primary transition-colors text-left"
            >
              {remix.game}
            </button>
            {remix.remixers.length > 0 && (
              <p className="text-text-muted text-xs mt-0.5">
                by {remix.remixers.join(', ')}
              </p>
            )}
          </div>

          {/* Genres */}
          {remix.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {remix.genres.map(g => (
                <button
                  key={g}
                  onClick={() => handleGenre(g)}
                  className="font-mono text-xs text-primary-light bg-primary-dim border border-primary/20
                             px-2.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark
                         text-white text-sm font-semibold shadow-glow-sm transition-colors"
            >
              <Play size={16} className="fill-white" />
              Play
            </button>
            <button
              onClick={handleFavorite}
              className={`p-2.5 rounded-xl border transition-colors ${
                isFav
                  ? 'bg-error/10 border-error/30 text-error'
                  : 'bg-surface border-border text-text-muted hover:border-border-light hover:text-text-primary'
              }`}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={18} className={isFav ? 'fill-error' : ''} />
            </button>
            <a
              href={`https://ocremix.org/remix/${remix.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-border bg-surface text-text-muted
                         hover:border-border-light hover:text-text-primary transition-colors"
              title="Open on ocremix.org"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Original Song', value: remix.songTitle  || '—' },
          { label: 'Composer',      value: remix.composer   || '—' },
          { label: 'System',        value: remix.system     || '—' },
          { label: 'Posted',        value: remix.posted     || '—' },
          { label: 'Remixers',      value: remix.remixers.join(', ') || '—' },
          { label: 'ID',            value: remix.id },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-3">
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1">{label}</p>
            <p className="text-text-secondary text-xs leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {fetching && (
        <p className="text-center text-text-muted text-xs font-mono animate-pulse">
          Fetching full details from ocremix.org…
        </p>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 animate-pulse">
      <div className="h-5 w-16 bg-surface rounded mb-6" />
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-surface shrink-0 mx-auto md:mx-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-6 bg-surface rounded w-3/4" />
          <div className="h-4 bg-surface rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-surface rounded-full w-16" />
            <div className="h-6 bg-surface rounded-full w-20" />
            <div className="h-6 bg-surface rounded-full w-14" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-10 bg-surface rounded-xl w-24" />
            <div className="h-10 w-10 bg-surface rounded-xl" />
            <div className="h-10 w-10 bg-surface rounded-xl" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  )
}
