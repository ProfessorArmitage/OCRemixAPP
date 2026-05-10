import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Disc3, Library, User, Dice6 } from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'
import MiniPlayer from './MiniPlayer'

const NAV = [
  { to: '/',        icon: Home,    label: 'Home'    },
  { to: '/catalog', icon: Disc3,   label: 'Catalog' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/profile', icon: User,    label: 'Profile' },
]

export default function Layout() {
  const { currentRemix } = usePlayerStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border">
          <h1 className="font-display text-lg font-bold text-text-primary tracking-wider">
            OC<span className="text-primary">R</span>eMix
          </h1>
          <p className="text-text-muted text-xs font-mono mt-0.5">PLAYER v1.0</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary-dim text-primary-light border border-primary/30 shadow-glow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Roulette shortcut */}
        <div className="px-3 py-4 border-t border-border">
          <RouletteBtn />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-grid">
          <Outlet />
        </main>

        {/* Mini player */}
        {currentRemix && (
          <div onClick={() => navigate('/player')} className="cursor-pointer">
            <MiniPlayer />
          </div>
        )}

        {/* ── Bottom nav (mobile) ── */}
        <nav className="md:hidden flex border-t border-border bg-surface">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors
                ${isActive ? 'text-primary-light' : 'text-text-muted'}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

function RouletteBtn() {
  const { spinRoulette } = usePlayerStore()
  return (
    <button
      onClick={() => spinRoulette(false)}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                 bg-primary/10 border border-primary/30 text-primary-light
                 text-sm font-medium hover:bg-primary/20 transition-colors group"
    >
      <Dice6 size={18} className="group-hover:rotate-12 transition-transform" />
      Russian Roulette
    </button>
  )
}
