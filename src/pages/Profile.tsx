import { User, Github, ExternalLink, Database, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useCatalogStore } from '../stores/catalogStore'
import { fullCatalogSync } from '../services/catalogSync'
import { getTotalCount } from '../services/database'

export default function Profile() {
  const { setSyncStatus } = useCatalogStore()
  const [syncing, setSyncing]   = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [total, setTotal]       = useState(0)

  useState(() => { getTotalCount().then(setTotal) })

  const startFullSync = async () => {
    setSyncing(true)
    await fullCatalogSync((status, done, total) => {
      setProgress({ done, total })
      setSyncStatus(status, done, total)
    })
    setSyncing(false)
    getTotalCount().then(setTotal)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-32 animate-fade-in">
      <h1 className="font-display text-sm font-bold text-text-primary tracking-widest uppercase mb-8">
        Settings & Info
      </h1>

      {/* Account */}
      <Section title="OC ReMix Account">
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border">
          <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center">
            <User size={20} className="text-text-muted" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm">Not logged in</p>
            <p className="text-text-muted text-xs">OCRemix account sync coming soon</p>
          </div>
        </div>
      </Section>

      {/* Catalog */}
      <Section title="Catalog">
        <div className="p-4 bg-surface rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-primary-light" />
              <span className="text-text-secondary text-sm">{total.toLocaleString()} remixes cached</span>
            </div>
          </div>

          {syncing ? (
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>Syncing catalog…</span>
                <span>{progress.done} / {progress.total}</span>
              </div>
              <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-text-muted text-xs mt-2">
                ⚠️ This scrapes ~5000 pages from ocremix.org. May take 20–30 min. Rate-limited to be respectful.
              </p>
            </div>
          ) : (
            <button
              onClick={startFullSync}
              className="flex items-center gap-2 text-sm text-primary-light hover:text-primary transition-colors"
            >
              <RefreshCw size={14} />
              Sync full catalog (5000+ remixes)
            </button>
          )}
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
          <p className="text-text-secondary text-sm">
            OC ReMix Player is an open-source, fan-made app for enjoying the OC ReMix catalog.
            All music is hosted and owned by <strong className="text-text-primary">ocremix.org</strong>.
          </p>
          <div className="flex gap-3">
            <a href="https://ocremix.org" target="_blank" rel="noopener"
               className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors">
              <ExternalLink size={12} /> ocremix.org
            </a>
            <a href="https://github.com" target="_blank" rel="noopener"
               className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
              <Github size={12} /> Source code
            </a>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}
