import { Play, Pause, SkipForward, Music2, Loader2 } from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'
import { useAudioProgress } from '../hooks/useAudio'

export default function MiniPlayer() {
  const { currentRemix, isPlaying, isLoadingDetail, resume, pause, skipToNext } = usePlayerStore()
  const { percent } = useAudioProgress()

  if (!currentRemix) return null

  const isLoading = isLoadingDetail

  return (
    <div className="relative bg-elevated border-t border-border shadow-player animate-slide-up">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-border">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Art */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface shrink-0">
          {currentRemix.imageUrl
            ? <img src={currentRemix.imageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Music2 size={16} className="text-primary/50" />
              </div>
          }
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 size={14} className="text-primary-light animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">{currentRemix.title}</p>
          <p className="text-text-muted text-xs truncate">
            {isLoading ? 'Loading track info…' : currentRemix.game}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={isPlaying ? pause : resume}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center
                       hover:bg-primary-dark transition-colors shadow-glow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <Loader2 size={16} className="text-white animate-spin" />
              : isPlaying
                ? <Pause size={16} className="text-white" />
                : <Play  size={16} className="text-white ml-0.5" />
            }
          </button>
          <button
            onClick={() => skipToNext()}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center text-text-secondary
                       hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
