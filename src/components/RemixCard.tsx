import { useNavigate } from 'react-router-dom'
import { Music2, Heart, HardDrive, Info } from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'
import type { Remix } from '../types'

interface Props {
  remix:    Remix
  queue?:   Remix[]
  compact?: boolean
}

export default function RemixCard({ remix, queue, compact }: Props) {
  const { playRemix, currentRemix, isPlaying } = usePlayerStore()
  const navigate   = useNavigate()
  const isCurrent  = currentRemix?.id === remix.id

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => playRemix(remix, queue)}
      onKeyDown={e => e.key === 'Enter' && playRemix(remix, queue)}
      className={`w-full flex items-center gap-3 rounded-xl text-left transition-all cursor-pointer
        hover:bg-elevated group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${isCurrent
          ? 'bg-primary-dim border border-primary/30 shadow-glow-sm'
          : 'bg-surface border border-border hover:border-border-light'
        }
        ${compact ? 'p-2' : 'p-3'}
      `}
    >
      {/* Artwork */}
      <div className="relative shrink-0">
        <div className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-lg overflow-hidden bg-elevated`}>
          {remix.imageUrl
            ? <img src={remix.imageUrl} alt={remix.game} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Music2 size={compact ? 16 : 22} className="text-primary/50" />
              </div>
          }
        </div>
        {isCurrent && (
          <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
            <EqBars playing={isPlaying} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-text-primary truncate ${compact ? 'text-sm' : 'text-base'}`}>
          {remix.title}
        </p>
        <p className="text-primary-light text-sm truncate">{remix.game}</p>
        <p className="text-text-muted text-xs truncate">
          {remix.remixers.join(', ') || 'OC ReMix'}
        </p>
      </div>

      {/* Meta — stopPropagation prevents play when clicking ⓘ */}
      <div
        className="flex flex-col items-end gap-1 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        {remix.isFavorite   && <Heart     size={13} className="text-error fill-error" />}
        {remix.isDownloaded && <HardDrive size={13} className="text-success" />}
        {remix.system && (
          <span className="font-mono text-[10px] text-text-muted border border-border rounded px-1">
            {remix.system}
          </span>
        )}
        <button
          onClick={() => navigate(`/remix/${remix.id}`)}
          className="p-0.5 text-text-muted hover:text-primary-light transition-colors"
          title="View details"
          aria-label={`View details for ${remix.title}`}
        >
          <Info size={13} />
        </button>
      </div>
    </div>
  )
}

function EqBars({ playing }: { playing: boolean }) {
  if (!playing) return <div className="w-2 h-2 rounded-full bg-primary-light" />
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1,2,3,4].map(i => (
        <div
          key={i}
          className={`w-1 bg-primary-light rounded-full origin-bottom animate-eq-${i}`}
          style={{ height: '100%' }}
        />
      ))}
    </div>
  )
}
