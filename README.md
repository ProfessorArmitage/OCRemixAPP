# OC ReMix Player — PWA

Stream and discover 5,000+ video game music remixes from [OC ReMix](https://ocremix.org).  
Fan-made, open source, personal use. All music is hosted and owned by ocremix.org.

---

## Quick Start

```bash
git clone https://github.com/professorarmitage/ocremixapp.git
cd ocremixapp
git checkout claude/create-music-app-01Vi8
npm install
npm run dev
# → http://localhost:5173
```

## Deploy (Vercel)

1. Import the repo on [vercel.com](https://vercel.com) — Vite is auto-detected
2. Set branch to `claude/create-music-app-01Vi8`
3. Deploy — CORS proxy is handled via `vercel.json` rewrites (no extra service needed)

```bash
npm run build   # → dist/
npm run preview # local preview of production build
```

---

## Stack

| Layer       | Tech                         |
|---|---|
| Framework   | Vite + React 18 + TypeScript |
| Audio       | Howler.js + MediaSession API |
| Storage     | Dexie.js (IndexedDB)         |
| Styling     | Tailwind CSS                 |
| State       | Zustand                      |
| Routing     | React Router v6              |
| PWA         | vite-plugin-pwa (Workbox)    |
| Data        | OCRemix JS feed + HTML scraping |
| CORS proxy  | Vite proxy (dev) / Vercel rewrites (prod) |

---

## Architecture

```
src/
├── api/
│   └── ocremix.ts        # JS feed + page scraper; MP3 URL extraction (4 regex patterns)
├── services/
│   ├── database.ts       # Dexie IndexedDB — remixes, history, favorites, browse stats
│   ├── audioPlayer.ts    # Howler.js singleton + MediaSession API
│   └── catalogSync.ts    # quickRefresh (on open) + fullCatalogSync (on demand, resumable)
├── stores/
│   ├── playerStore.ts    # Zustand — queue, roulette, race-condition guard (_playToken)
│   └── catalogStore.ts   # Zustand — catalog, filters, pagination
├── hooks/
│   └── useAudio.ts       # rAF polling for smooth progress bar
├── components/
│   ├── Layout.tsx        # Sidebar (desktop) + bottom nav (mobile) + MiniPlayer shell
│   ├── RemixCard.tsx     # Remix row — EQ animation, ⓘ detail button
│   └── MiniPlayer.tsx    # Persistent bottom player bar
└── pages/
    ├── Home.tsx          # Latest remixes + Russian Roulette
    ├── Catalog.tsx       # Full list + search + filter panel + infinite scroll
    ├── Browse.tsx        # Games grid + Systems list with search & sort
    ├── Library.tsx       # Favorites / Downloads / History tabs
    ├── Player.tsx        # Full-screen player + metadata + queue preview
    ├── RemixDetail.tsx   # Remix detail — cascade load (DB → API), genres, play, favorite
    └── Profile.tsx       # Settings + full catalog sync trigger
```

---

## Data Flow

```
App open
  → catalogSync.quickRefresh()
    → fetchLatestRemixes()  (JS feed → homepage scrape → known IDs fallback)
    → IndexedDB upsert → UI

User plays remix
  → playerStore.playRemix()
    → resolveRemixDetail()  (if placeholder URL → scrape page → persist)
    → Howler.js html5 stream → CDN
    → MediaSession.update()  (lock screen controls)

/browse
  → getGamesWithStats() / getSystemsWithStats()  (IndexedDB group-by)
  → click → setFilters({ game/system }) → navigate('/catalog')

/remix/:id
  → getRemixById()  (IndexedDB)
  → if missing or placeholder → fetchRemixDetail()  (scrape + persist)
  → genres/game clickable → setFilters() → navigate('/catalog')
```

---

## CORS Proxy

| Environment | How |
|---|---|
| Dev (`npm run dev`) | Vite proxy: `/ocr/*` → `https://ocremix.org/*` |
| Prod (Vercel) | `vercel.json` rewrite: `/ocr/*` → `https://ocremix.org/*` |

Audio streams go **directly** from the browser to OCRemix CDN — `html5: true` in Howler uses `<audio>` which has no CORS restrictions.

---

## What Works Now ✅

| Feature | Notes |
|---|---|
| Streaming audio | Howler.js html5 — no full download |
| MP3 URL resolution | 4 regex patterns from detail page scrape |
| Background playback + lock screen | MediaSession API |
| Queue / Next / Previous | With shuffle + repeat modes |
| Russian Roulette | Global and filtered (within active filters) |
| Race condition guard | `_playToken` — rapid clicks handled cleanly |
| Full-text search | Title, game, remixers |
| Filters | Game, system, composer, remixer, genre |
| Infinite scroll | IntersectionObserver, 40 items/page |
| Browse — Games grid | Cover art, remix count, search, sort |
| Browse — Systems list | Remix count, search |
| Remix Detail page | Cascade load, genres clickable, favorite, play |
| ⓘ button on cards | Navigate to detail without interrupting playback |
| Favorites | Toggle from Player or detail page |
| History | Last 500 plays, stored in IndexedDB |
| Full catalog sync | Scrapes ~5000 OCR pages, rate-limited, resumable |
| PWA installable | Works on Android (Chrome) and iOS (Safari) |
| Deploy | Vercel — CORS proxy via rewrites, no extra service |

---

## Pending 🔲

### Phase 2 — Core features
- [ ] **Offline downloads** — `downloads.ts` with Fetch + IndexedDB blob storage; download button on card + detail; tab Downloads in Library with size shown
- [ ] **PWA icons** — generate `public/icons/icon-192.png` and `icon-512.png` (needed for install prompt on all browsers)
- [ ] **Catalog sync testing** — run `fullCatalogSync()` against production; handle 404s; show time estimate

### Phase 3 — Account
- [ ] **OCRemix login** — investigate `/api/auth` endpoint; sync favorites server-side
- [ ] **Cross-device history** — if auth available

### Phase 4 — Polish
- [ ] **List virtualization** — `@tanstack/react-virtual` for 5000+ item lists
- [ ] **Detail page cache** — skip re-scrape if recently fetched
- [ ] **Share URL** — `/remix/:id` already shareable; add OG meta tags
- [ ] **Remix Detail — Play All** — play all remixes from same game/remixer as queue

### Phase 5 — Android native
- Port to React Native (Expo bare workflow)
- Stores and API layer reuse as-is; swap Dexie → expo-sqlite, Howler → react-native-track-player

---

## Known Issues / Workarounds

| Issue | Workaround |
|---|---|
| RSS `/feeds/ten/` → 404 | JS feed + homepage scraping |
| MP3 URL may be dynamic (JS-rendered) | 4 regex patterns; warns if all fail |
| `iterations.org` CDN slow | 60s proxy timeout in dev |
| Cover art sparse until full sync | Populated as tracks are played (detail scrape persists imageUrl) |
