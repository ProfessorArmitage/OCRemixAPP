import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      // ── OCRemix pages + metadata ────────────────────────────────────────────
      '/ocr': {
        target:      'https://ocremix.org',
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/ocr/, ''),
        secure:      true,
        // Give remix detail pages enough time (some are slow)
        proxyTimeout: 30_000,
        timeout:      30_000,
      },

      // ── Audio CDN: iterations.org (current OCRemix file host) ───────────────
      '/cdn/iterations': {
        target:      'https://iterations.org',
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/cdn\/iterations/, ''),
        secure:      true,
        proxyTimeout: 60_000,
        timeout:      60_000,
      },

      // ── Audio CDN: djpretzel.web.aplus.net (legacy OCRemix host) ────────────
      '/cdn/djpretzel': {
        target:      'http://djpretzel.web.aplus.net',
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/cdn\/djpretzel/, ''),
        secure:      false,
        proxyTimeout: 60_000,
        timeout:      60_000,
      },

      // ── Fallback: any other ocremix.org audio file (placeholder redirects) ──
      '/cdn/ocremix': {
        target:      'https://ocremix.org',
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/cdn\/ocremix/, ''),
        secure:      true,
        proxyTimeout: 30_000,
        timeout:      30_000,
      },
    },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg'],
      manifest: {
        name:             'OC ReMix Player',
        short_name:       'OCReMix',
        description:      'Stream & discover 5000+ video game music remixes',
        theme_color:      '#07070f',
        background_color: '#07070f',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // OCRemix API/scraping: always fresh, never cached
          {
            urlPattern: /\/ocr\//,
            handler:    'NetworkOnly',
          },
          // Audio CDN: cache aggressively (streams are large)
          {
            urlPattern: /\/cdn\//,
            handler:    'CacheFirst',
            options: {
              cacheName: 'ocremix-audio',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: { '@': '/src' },
  },
})
