import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, Heart, Download, Play, Pause,
  SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Dice6, Music2
} from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'
import { setFavorite } from '../services/database'
import { seek } from '../services/audioPlayer'
import { useAudioProgress, formatTime } from '../hooks/useAudio'
import type { RepeatMode } from '../types'

export default function Player() {
  const navigate = useNavigate()
  const {
    currentRemix, isPlaying, resume, pause, skipToNext, skipToPrevious,
    repeatMode, setRepeatMode, shuffleMode, setShuffleMode, spinRoulette,
    queue, queueIndex,
  } = usePlayerStore()
  const { position, duration, percent } = useAudioProgress()

  if (!currentRemix) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted animate-fade-in">
        <Music2 size={56} className="opacity-20" />
        <p className="font-display text-sm tracking-widest uppercase">Nothing Playing</p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold shadow-glow-sm hover:bg-primary-dark transition-colors"
        >
          Browse Catalog
        </button>
      </div>
    )
  }

  const cycleRepeat = () => {
    const next: RepeatMode = repeatMode === 'off' ? 'queue' : repeatMode === 'queue' ? 'track' : 'off'
    setRepeatMode(next)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek((parseFloat(e.target.value) / 100) * duration)
  }

  const handleFavorite = async () => {
    await setFavorite(currentRemix.id, !currentRemix.isFavorite)
  }

  return (
    <div className="min-h-full flex flex-col bg-bg bg-scanlines">
      <div className="max-w-lg mx-auto w-full px-6 py-6 flex flex-col gap-6 animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          <ChevronDown size={18} /> Now Playing
        </button>

        {/* Artwork */}
        <div className="aspect-square max-w-xs mx-auto w-full rounded-2xl overflow-hidden bg-surface shadow-card relative group">
          {currentRemix.imageUrl
            ? <img src={currentRemix.imageUrl} alt={currentRemix.game} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Music2 size={80} className="text-primary/20" />
              </div>
          }
          {/* OCR ID badge */}
          <span className="absolute top-3 left-3 font-mono text-xs bg-black/60 text-primary-light px-2 py-1 rounded backdrop-blur-sm">
            {currentRemix.id}
          </span>
        </div>

        {/* Title + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-text-primary text-lg font-semibold leading-tight mb-1 truncate">
              {currentRemix.title}
            </h2>
            <p className="text-primary-light text-sm truncate">{currentRemix.game}</p>
            <p className="text-text-muted text-xs mt-0.5 truncate">
              {currentRemix.remixers.join(', ') || 'OC ReMix'}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleFavorite} className="p-2 rounded-lg hover:bg-elevated transition-colors">
              <Heart size={20} className={currentRemix.isFavorite ? 'text-error fill-error' : 'text-text-muted'} />
            </button>
            <button
              onClick={() => window.open(currentRemix.mp3Url)}
              className="p-2 rounded-lg hover:bg-elevated transition-colors"
              title="Download MP3"
            >
              <Download size={20} className="text-text-muted hover:text-success transition-colors" />
            </button>
          </div>
        </div>

        {/* Genres */}
        {currentRemix.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentRemix.genres.map(g => (
              <span key={g} className="font-mono text-xs text-primary-light bg-primary-dim border border-primary/20 px-2.5 py-0.5 rounded-full">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Progress */}
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={percent}
            onChange={handleSeek}
            className="w-full h-1.5 appearance-none rounded-full cursor-pointer
                       bg-elevated accent-primary"
            style={{
              background: `linear-gradient(to right, #7c3aed ${percent}%, #16162a ${percent}%)`
            }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-xs text-text-muted">{formatTime(position)}</span>
            <span className="font-mono text-xs text-text-muted">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={() => skipToPrevious()} className="text-text-secondary hover:text-text-primary transition-colors active:scale-90">
            <SkipBack size={30} />
          </button>

          <button
            onClick={isPlaying ? pause : resume}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center
                       shadow-glow hover:bg-primary-dark transition-all active:scale-95 animate-pulse-glow"
          >
            {isPlaying
              ? <Pause size={28} className="text-white" />
              : <Play  size={28} className="text-white ml-1" />
            }
          </button>

          <button onClick={() => skipToNext()} className="text-text-secondary hover:text-text-primary transition-colors active:scale-90">
            <SkipForward size={30} />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center justify-around py-2">
          {/* Shuffle */}
          <button
            onClick={() => setShuffleMode(shuffleMode === 'off' ? 'on' : 'off')}
            className={`p-2 rounded-lg transition-colors ${shuffleMode !== 'off' ? 'text-primary-light' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <Shuffle size={20} />
          </button>

          {/* Roulette */}
          <button
            onClick={() => spinRoulette(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-dim border border-accent/30
                       text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            <Dice6 size={16} />
            Roulette
          </button>

          {/* Repeat */}
          <button onClick={cycleRepeat} className={`p-2 rounded-lg transition-colors ${repeatMode !== 'off' ? 'text-primary-light' : 'text-text-muted hover:text-text-secondary'}`}>
            {repeatMode === 'track' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Metadata footer */}
        <div className="grid grid-cols-3 gap-3 bg-surface border border-border rounded-xl p-4">
          {[
            { label: 'Composer', value: currentRemix.composer || '—' },
            { label: 'System',   value: currentRemix.system   || '—' },
            { label: 'Song',     value: currentRemix.songTitle || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="text-text-secondary text-xs truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Queue context */}
        {queue.length > 1 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-3">
              Queue — {queueIndex + 1} / {queue.length}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {queue.slice(Math.max(0, queueIndex - 1), queueIndex + 4).map((r, i) => {
                const isNow = r.id === currentRemix.id
                return (
                  <div key={r.id} className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${isNow ? 'text-primary-light' : 'text-text-muted'}`}>
                    <span className="font-mono w-3">{isNow ? '▶' : ''}</span>
                    <span className="truncate">{r.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
