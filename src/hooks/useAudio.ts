import { useState, useEffect, useRef } from 'react'
import { getPosition, getDuration, isPlaying as audioIsPlaying } from '../services/audioPlayer'

interface AudioProgress {
  position: number
  duration: number
  percent:  number
}

/**
 * Polls the Howler singleton every 250ms for position/duration.
 * Only runs the interval when audio is actually playing.
 */
export function useAudioProgress(): AudioProgress {
  const [progress, setProgress] = useState<AudioProgress>({ position: 0, duration: 0, percent: 0 })
  const rafRef = useRef<number>()

  useEffect(() => {
    function tick() {
      const position = getPosition()
      const duration = getDuration()
      const percent  = duration > 0 ? (position / duration) * 100 : 0
      setProgress({ position, duration, percent })
      rafRef.current = requestAnimationFrame(tick)
    }

    // Use RAF for smooth progress bar
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return progress
}

/** Format seconds → M:SS */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
