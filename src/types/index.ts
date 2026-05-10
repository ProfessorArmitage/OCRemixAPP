export interface Remix {
  id: string
  numericId: number
  title: string
  game: string
  gameId?: number
  system: string
  composer: string
  remixers: string[]
  genres: string[]
  songTitle: string
  mp3Url: string
  imageUrl?: string
  posted: string
  duration?: number
  isDownloaded?: boolean
  localPath?: string
  isFavorite?: boolean
}

export interface CatalogFilters {
  game?: string
  system?: string
  composer?: string
  remixer?: string
  genre?: string
  searchText?: string
}

export type RepeatMode   = 'off' | 'track' | 'queue'
export type ShuffleMode  = 'off' | 'on' | 'roulette' | 'filtered-roulette'
export type CatalogStatus = 'idle' | 'loading-rss' | 'loading-catalog' | 'ready' | 'error'

export interface DownloadTask {
  remixId: string
  progress: number
  status: 'queued' | 'downloading' | 'done' | 'error'
  error?: string
}
