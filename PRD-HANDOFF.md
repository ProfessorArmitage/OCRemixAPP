# OC ReMix Player — Product Requirements Document
## Handoff v1.0 · May 2025

---

## 1. Visión del Producto

App web progresiva (PWA) para explorar, reproducir y descargar el catálogo completo de **OC ReMix** (~5,000+ remixes de música de videojuegos). Gratuita, open source, uso personal. Roadmap: PWA funcional → Android nativo (React Native).

**Repositorio:** `ocremix-pwa/` (zip adjunto o GitHub personal)  
**Stack:** Vite + React 18 + TypeScript + Tailwind CSS + Howler.js + Dexie.js (IndexedDB) + Zustand

---

## 2. Estado Actual — Lo que YA funciona (Phase 1 ✅)

### 2.1 Catálogo
| Feature | Estado | Notas |
|---|---|---|
| Carga inicial de 10 últimos remixes | ✅ | Vía JS feed de OCRemix (`/feeds/javascript/`) con fallback a homepage scraping |
| Almacenamiento local en IndexedDB | ✅ | Dexie.js — persiste entre sesiones |
| Filtros: game, system, composer, remixer, genre | ✅ | UI implementada, query en JS-side sobre IndexedDB |
| Búsqueda de texto libre | ✅ | Filtra por title, game, remixers simultáneamente |
| Infinite scroll en catálogo | ✅ | IntersectionObserver, páginas de 40 items |
| Sync RSS / feed oficial | ⚠️ PARCIAL | URL `/feeds/ten/` devuelve 404. Se usa JS feed + homepage scraping como workaround |

### 2.2 Reproducción
| Feature | Estado | Notas |
|---|---|---|
| Streaming de audio | ✅ | Howler.js con `html5: true` — no descarga completo antes de reproducir |
| Resolución automática de URL de MP3 | ✅ | Scraping de página de detalle antes de reproducir (4 patrones regex) |
| Background playback + lock screen controls | ✅ | MediaSession API |
| Cola de reproducción | ✅ | Los 10 remixes visibles se cargan como queue |
| Play / Pause / Next / Previous | ✅ | En MiniPlayer y Player full-screen |
| Seek (scrubber de progreso) | ✅ | RAF polling para progreso suave |
| Repeat (off / queue / track) | ✅ | |
| Shuffle | ✅ | Aleatorio dentro de la cola activa |
| Russian Roulette (global) | ✅ | Remix aleatorio del catálogo completo |
| Russian Roulette (filtrada) | ✅ | Aleatorio dentro de los filtros activos |
| Manejo de race conditions | ✅ | Token único por request — clicks rápidos no interfieren |

### 2.3 UI / UX
| Feature | Estado | Notas |
|---|---|---|
| Dark theme gaming (Orbitron + DM Sans + JetBrains Mono) | ✅ | |
| Sidebar nav (desktop) + bottom nav (mobile) | ✅ | Responsive |
| MiniPlayer persistente | ✅ | Con progress bar y controles |
| Player full-screen | ✅ | Artwork, metadata, queue preview, géneros |
| Loading states (spinner en detail fetch) | ✅ | |
| Library: Favoritos | ✅ | Toggle desde Player |
| Library: Historial | ✅ | Últimas 500 reproducciones, guardadas en IndexedDB |
| Library: Downloads | ⚠️ PLACEHOLDER | Tab visible, lógica pendiente (ver Phase 2) |
| PWA instalable | ✅ | manifest.json + vite-plugin-pwa (Workbox) |

### 2.4 Sincronización completa de catálogo
| Feature | Estado | Notas |
|---|---|---|
| UI de sync en Profile page | ✅ | Barra de progreso, checkpoint/resume |
| Lógica de scraping por ID (OCR00001–OCR0xxxx) | ✅ | `catalogSync.ts` con rate limiting (3 concurrent, 400ms delay) |
| Ejecución real del sync completo | ⚠️ NO PROBADO | La lógica está completa pero no se ha ejecutado en producción |

---

## 3. Arquitectura Técnica

### 3.1 Estructura de archivos
```
ocremix-pwa/
├── vite.config.ts          # Dev server + 4 proxies CORS (ocr, iterations, djpretzel, ocremix)
├── tailwind.config.js      # Design tokens: colores, tipografía, animaciones, bg-grid
├── src/
│   ├── api/
│   │   └── ocremix.ts      # Data layer: JS feed, homepage scraping, page scraper, MP3 URL extraction
│   ├── services/
│   │   ├── database.ts     # Dexie IndexedDB: remixes, history, catalog_meta
│   │   ├── audioPlayer.ts  # Howler.js singleton + MediaSession API
│   │   └── catalogSync.ts  # Sync orchestrator: quickRefresh + fullCatalogSync
│   ├── stores/
│   │   ├── playerStore.ts  # Zustand: playback state, queue, roulette, race-condition tokens
│   │   └── catalogStore.ts # Zustand: catalog queries, filters, pagination
│   ├── hooks/
│   │   └── useAudio.ts     # rAF polling para position/duration
│   ├── components/
│   │   ├── Layout.tsx      # Sidebar + MiniPlayer shell + bottom nav
│   │   ├── RemixCard.tsx   # Card con EQ animation cuando está playing
│   │   └── MiniPlayer.tsx  # Bottom player bar con progress + loading state
│   └── pages/
│       ├── Home.tsx        # Latest remixes + Roulette buttons + quick access
│       ├── Catalog.tsx     # Full list + search + filter panel (slide-over)
│       ├── Player.tsx      # Full-screen player + metadata + queue
│       ├── Library.tsx     # Favorites / Downloads / History tabs
│       └── Profile.tsx     # Settings + full catalog sync trigger
```

### 3.2 Data flow crítico
```
App open
  → catalogStore.refresh()
    → catalogSync.quickRefresh()
      → ocremix.fetchLatestRemixes()
        → Strategy 1: GET /ocr/feeds/javascript/ → parseJsFeed()
        → Strategy 2: GET /ocr/ → parseHomepageRemixes()
        → Strategy 3: fetchRecentByIds() (fallback con IDs conocidos)
      → database.upsertRemixes() → IndexedDB
    → catalogStore.loadPage() → UI

User clicks remix (placeholder URL)
  → playerStore.playRemix()
    → resolveRemixDetail() [ASYNC, con race-condition token]
      → ocremix.fetchRemixDetail() → GET /ocr/remix/OCRxxxxx
        → parseRemixPage() → extrae mp3Url (4 patrones regex)
        → proxyAudioUrl() → reescribe CDN URL para pasar por Vite proxy
      → [si URL real encontrada] → database.upsertRemixes() → persiste
      → [si sigue siendo placeholder] → log warning, no persiste
    → audio.loadAndPlay(resolved) → Howler.html5 → stream CDN
    → MediaSession.update() → lock screen controls
```

### 3.3 CORS proxy setup (solo dev)
```
localhost:5173/ocr/*          → https://ocremix.org/*          (pages, metadata)
localhost:5173/cdn/iterations/* → https://iterations.org/*    (audio CDN actual)
localhost:5173/cdn/djpretzel/*  → http://djpretzel.web.aplus.net/* (audio CDN legacy)
localhost:5173/cdn/ocremix/*    → https://ocremix.org/files/* (placeholder redirects)
```
**⚠️ Para producción se necesita un proxy real** (Cloudflare Worker recomendado).

### 3.4 Decisiones de diseño importantes
- **`html5: true` en Howler** — permite streaming sin descargar el archivo completo; no requiere CORS headers para playback básico
- **`proxyAudioUrl()`** — en dev reescribe URLs de CDN para ir por Vite; en prod usa URLs directas
- **Placeholder URL** = `https://ocremix.org/files/music/remixes/OCRxxxxx.mp3` (sin nombre descriptivo) → se detecta con regex `/\/OCR\d{5}\.mp3$/` → trigger para fetch de detalle
- **Race condition token** (`_playToken`) — cada `playRemix()` incrementa el token; si llega una solicitud nueva antes de que resuelva la anterior, la anterior se abandona limpiamente

### 3.5 Issues conocidos / workarounds activos
| Issue | Workaround | Solución ideal |
|---|---|---|
| RSS `/feeds/ten/` → 404 | JS feed + homepage scraping | Encontrar URL correcta del RSS o contactar a OCRemix |
| MP3 URL en HTML puede ser dinámica (JS) | 4 patrones regex; si falla, log warning y no reproduce | Headless browser o encontrar API endpoint de OCRemix |
| CDN `iterations.org` lento | Proxy por Vite (60s timeout) | CDN más rápido o caché agresivo |
| Sin proxy en producción | Solo funciona en `npm run dev` | Cloudflare Worker como proxy ligero |

---

## 4. Cómo correr el proyecto

### Prerequisites
```
Node.js 18+
npm 10+
```

### Instalación
```bash
unzip ocremix-pwa.zip
cd ocremix-pwa
npm install
npm run dev
# → http://localhost:5173
```

### Build
```bash
npm run build    # genera /dist
npm run preview  # preview del build
```

---

## 5. Roadmap — Fases Pendientes

---

### Phase 2 — Completar funcionalidad core (Estimado: 2–3 sesiones)

#### 2.1 Descargas offline reales
- Implementar `downloads.ts` con Fetch API + IndexedDB blob storage
- Botón de descarga en `RemixCard` y `Player`
- Badge visual de "descargado" en las cards
- Tab Downloads en Library con lista y botón de eliminar
- Mostrar espacio usado (MB)
- Resolver URL antes de descargar (igual que playback)

#### 2.2 Remix Detail Page (`/remix/:id`)
- Ruta `/remix/OCRxxxxx` con vista completa
- Artwork grande, metadatos completos (composer, system, song, year)
- Géneros como chips clickeables (filtro rápido)
- Botón "Play All" por game/remixer
- Link a ocremix.org original

#### 2.3 Browse pages
- `/games` — Grid de juegos con cover art y conteo de remixes
- `/systems` — Agrupado por consola
- Clic en game/system → Catalog pre-filtrado

#### 2.4 Sync completo — testing y refinamiento
- Probar `fullCatalogSync()` de Profile page en producción
- Añadir feedback visual por batch (X/5000 scrapeados)
- Manejo de errores 404 (IDs que no existen)
- Estimación de tiempo restante

---

### Phase 3 — Cuenta OCRemix + Features sociales (Estimado: 1–2 sesiones)

#### 3.1 Login con cuenta OCRemix
- Investigar si `/api/auth` o `/login` de OCRemix expone endpoint usable
- Si existe: form de login, session token en localStorage
- Sincronizar favoritos del servidor con IndexedDB local
- Mostrar avatar y username en Profile

#### 3.2 Features de cuenta (si hay API)
- Historial sincronizado entre dispositivos
- Playlists guardadas en OCRemix
- "Tu colección" desde el perfil de OCRemix

---

### Phase 4 — Production Ready (Estimado: 1 sesión)

#### 4.1 Proxy para producción
- Implementar Cloudflare Worker como proxy ligero:
  ```javascript
  // worker.js (Cloudflare)
  export default {
    fetch(req) {
      const url = new URL(req.url)
      url.hostname = 'ocremix.org'
      return fetch(url.toString(), req)
    }
  }
  ```
- Actualizar `PROD_PROXY` en `ocremix.ts`
- Deploy en Cloudflare Pages (gratis)

#### 4.2 PWA icons
- Generar `public/icons/icon-192.png` y `icon-512.png`
- Icono con estética de la app (OCR + gaming vibe)

#### 4.3 Performance
- Virtualización de listas largas con `@tanstack/react-virtual`
- Lazy loading de imágenes de artwork
- Caché de detail pages en IndexedDB para no re-scrapeear

#### 4.4 SEO / Share
- Meta tags dinámicos por remix
- Share button → genera URL con remix ID
- OG image para sharing

---

### Phase 5 — Android App (Estimado: 3–4 sesiones)

**Estrategia:** Portar la PWA a React Native conservando stores, types y lógica de negocio.

#### Cambios de capa por archivo:
| Archivo PWA | Equivalente RN | Cambio |
|---|---|---|
| `src/api/ocremix.ts` | Idéntico | Sin cambios (axios funciona en RN) |
| `src/stores/*` | Idénticos | Sin cambios |
| `src/types/index.ts` | Idéntico | Sin cambios |
| `src/services/database.ts` | `expo-sqlite` | Reemplazar Dexie por expo-sqlite |
| `src/services/audioPlayer.ts` | `react-native-track-player` | Background audio nativo |
| `src/services/downloads.ts` | `expo-file-system` | Archivos locales en filesystem |
| `vite.config.ts` → proxy | No necesario | RN hace requests directos (sin CORS) |
| Componentes UI | StyleSheet + RN components | Portar Tailwind a StyleSheet |

#### Setup React Native (Expo bare workflow):
```bash
npx create-expo-app ocremix-native --template bare-minimum
# Copiar src/api/, src/stores/, src/types/, src/services/catalogSync.ts
# Adaptar services/ y components/
```

---

## 6. Design System

### Colores
```
bg:           #07070f   (fondo)
surface:      #0e0e1a   (cards)
elevated:     #16162a   (hover/elevated)
border:       #1e1e35
primary:      #7c3aed   (violeta OCRemix)
primary-light:#a78bfa
accent:       #f59e0b   (ámbar/dorado)
text-primary: #e2e8f0
text-muted:   #475569
```

### Tipografía
```
font-display: Orbitron (headers, OCR logo)
font-ui:      DM Sans (body text)
font-mono:    JetBrains Mono (IDs, tiempos, badges)
```

### Componentes clave
- `RemixCard` — card con EQ animation cuando está playing, badge de sistema, favorito/descargado
- `MiniPlayer` — bottom bar siempre visible cuando hay audio activo
- `RouletteButton` — botón principal de Home
- `FilterChip` — chips activos con botón X para remover
- `FilterPanel` — slide-over con tabs (Game / System / Other)

---

## 7. Dependencias clave y versiones

```json
{
  "react":               "^18.3.1",
  "react-router-dom":    "^6.28.0",
  "zustand":             "^5.0.3",
  "howler":              "^2.2.4",
  "dexie":               "^4.0.9",
  "axios":               "^1.7.9",
  "fast-xml-parser":     "^4.5.1",
  "lucide-react":        "^0.469.0",
  "tailwindcss":         "^3.4.17",
  "vite":                "^6.0.6",
  "vite-plugin-pwa":     "^0.21.1"
}
```

---

## 8. Contexto de desarrollo

Este proyecto fue construido iterativamente resolviendo problemas de CORS, scraping de OCRemix, y compatibilidad de CDN. Algunos puntos clave para quien continúe:

1. **OCRemix no tiene API pública documentada** — todo es scraping de HTML
2. **Los MP3s se hospedan en CDNs externos** (`iterations.org`, `djpretzel.web.aplus.net`) — no en `ocremix.org` directamente
3. **El Vite proxy es esencial en desarrollo** — sin él, todas las peticiones a OCRemix son bloqueadas por CORS
4. **`html5: true` en Howler es no negociable** — permite streaming; sin él Howler intenta descargar el archivo completo antes de reproducir
5. **Los OCR IDs son secuenciales** desde OCR00001 hasta ~OCR05000+ — esto permite iterar el catálogo completo
6. **La URL del RSS oficial (`/feeds/ten/`) está rota (404)** — usar JS feed en `/feeds/javascript/` como alternativa

---

*PRD generado en sesión de desarrollo activa. Código funcional y probado en localhost:5173.*
