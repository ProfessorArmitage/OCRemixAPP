import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, r) {
      // Poll for updates every 60 s while the app is open
      r && setInterval(() => r.update(), 60_000)
    },
  })

  // Auto-apply after 8 s; user can click to apply immediately
  useEffect(() => {
    if (!needRefresh) return
    const t = setTimeout(() => updateServiceWorker(true), 8_000)
    return () => clearTimeout(t)
  }, [needRefresh, updateServiceWorker])

  if (!needRefresh) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface border border-primary/40 rounded-xl px-4 py-2.5 text-sm shadow-xl flex items-center gap-3 whitespace-nowrap">
      <span className="text-text-primary">Nueva versión disponible</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="text-primary-light font-semibold hover:underline"
      >
        Actualizar ahora
      </button>
    </div>
  )
}
