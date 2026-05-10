import { Howl, Howler } from 'howler'
import type { Remix } from '../types'

// ─── State ───────────────────────────────────────────────────────────────────

let howl: Howl | null = null
let _currentRemix: Remix | null = null
let _queue: Remix[] = []
let _queueIndex = 0
let _onTrackEnd: (() => void) | null = null

// ─── Event emitter ────────────────────────────────────────────────────────────

type AudioEvent = 'play' | 'pause' | 'end' | 'load' | 'error' | 'stop'
const listeners = new Map<AudioEvent, Set<() => void>>()

function emit(event: AudioEvent) {
  listeners.get(event)?.forEach(fn => fn())
}

export function on(event: AudioEvent, fn: () => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(fn)
  return () => listeners.get(event)?.delete(fn)
}

// ─── Core playback ───────────────────────────────────────────────────────────

export function loadAndPlay(remix: Remix): Promise<void> {
  return new Promise((resolve, reject) => {
    if (howl) { howl.stop(); howl.unload() }

    _currentRemix = remix
    updateMediaSession(remix)

    howl = new Howl({
      src:   [remix.mp3Url],
      html5: true,          // stream without full download
      format: ['mp3'],
      onplay:  () => { emit('play');  resolve() },
      onpause: () =>   emit('pause'),
      onstop:  () =>   emit('stop'),
      onend:   () => { emit('end');   _onTrackEnd?.() },
      onloaderror: (_id, err) => { emit('error'); reject(err) },
    })
    howl.play()
  })
}

export const play  = () => { howl?.play();  updatePlaybackState('playing') }
export const pause = () => { howl?.pause(); updatePlaybackState('paused')  }
export const stop  = () => { howl?.stop() }
export const seek  = (s: number) => { howl?.seek(s) }

export const getPosition = (): number => (howl?.seek() as number) || 0
export const getDuration = (): number => howl?.duration() || 0
export const isPlaying   = (): boolean => howl?.playing() ?? false
export const isLoading   = (): boolean => howl != null && !howl.playing() && howl.duration() === 0

export function setVolume(v: number) { Howler.volume(Math.max(0, Math.min(1, v))) }
export function setOnTrackEnd(fn: () => void) { _onTrackEnd = fn }

// Queue helpers (used by store to tell the audio service about context)
export function setQueue(queue: Remix[], index: number) {
  _queue = queue
  _queueIndex = index
}

// ─── MediaSession API (lock screen / notification controls) ──────────────────

function updateMediaSession(remix: Remix) {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title:   remix.title,
    artist:  remix.remixers.join(', ') || 'OC ReMix',
    album:   remix.game,
    artwork: remix.imageUrl
      ? [{ src: remix.imageUrl, sizes: '512x512', type: 'image/jpeg' }]
      : [],
  })

  // Action handlers will be wired by the store after it sets skipToNext etc.
}

function updatePlaybackState(state: 'playing' | 'paused' | 'none') {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state
  }
}

export function wireMediaActions(actions: {
  play:   () => void
  pause:  () => void
  next:   () => void
  prev:   () => void
  seek:   (details: MediaSessionActionDetails) => void
}) {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play',          actions.play)
  navigator.mediaSession.setActionHandler('pause',         actions.pause)
  navigator.mediaSession.setActionHandler('nexttrack',     actions.next)
  navigator.mediaSession.setActionHandler('previoustrack', actions.prev)
  navigator.mediaSession.setActionHandler('seekto',        actions.seek)
}
