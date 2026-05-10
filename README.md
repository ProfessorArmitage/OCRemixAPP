# OC ReMix Player — PWA

Stream and discover 5,000+ video game music remixes from [OC ReMix](https://ocremix.org).

## Quick Start

```bash
npm install
npm run dev
# → open http://localhost:5173
```

## Build for Production

```bash
npm run build
npm run preview
```

## Deploy

Drop the `dist/` folder on any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

## Stack

| Layer        | Tech                          |
|---|---|
| Framework    | Vite + React 18 + TypeScript  |
| Audio        | Howler.js + MediaSession API  |
| Storage      | Dexie.js (IndexedDB)          |
| Styling      | Tailwind CSS                  |
| State        | Zustand                       |
| Routing      | React Router v6               |
| PWA          | vite-plugin-pwa (Workbox)     |
| Data         | OCRemix RSS + HTML scraping   |
| CORS proxy   | corsproxy.io (for HTML pages) |

## Architecture

```
src/
├── api/ocremix.ts       # RSS + page scraper (CORS proxy for browser)
├── services/
│   ├── database.ts      # Dexie IndexedDB (catalog, favorites, history)
│   ├── audioPlayer.ts   # Howler.js singleton + MediaSession
│   └── catalogSync.ts   # Incremental catalog sync with checkpointing
├── stores/
│   ├── playerStore.ts   # Zustand — playback state + actions
│   └── catalogStore.ts  # Zustand — catalog + filter state
├── hooks/useAudio.ts    # rAF-based position polling
├── components/
│   ├── Layout.tsx       # Sidebar nav + mini player shell
│   ├── RemixCard.tsx    # Single remix row with EQ animation
│   └── MiniPlayer.tsx   # Bottom player bar
└── pages/
    ├── Home.tsx         # Latest remixes + roulette
    ├── Catalog.tsx      # Full catalog + filters + infinite scroll
    ├── Library.tsx      # Favorites / downloads / history
    ├── Player.tsx       # Full-screen now-playing
    └── Profile.tsx      # Settings + full catalog sync
```

## Data Flow

1. **App open** → RSS feed → latest 10 remixes upserted to IndexedDB
2. **Catalog** → Dexie query with JS-side filtering + pagination
3. **Play** → Howler.js streams MP3 directly from ocremix.org
4. **Full sync** → scrapes ~5000 OCR pages (rate-limited, resumable)

## Notes

- Full catalog sync uses `corsproxy.io` to bypass CORS on OCRemix HTML pages
- For production, replace with your own proxy (Cloudflare Worker recommended)
- All music is copyright OC ReMix / respective composers — this app only links to their servers
