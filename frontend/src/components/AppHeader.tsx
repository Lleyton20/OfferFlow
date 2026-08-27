import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isBirthdayToday } from '../lib/birthday'

type NavKey =
  | 'dashboard'
  | 'resumes'
  | 'contacts'
  | 'history'
  | 'analytics'
  | 'interviews'
  | 'assistant'

const NAV_ITEMS: { key: NavKey; label: string; to: string }[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { key: 'history', label: 'History', to: '/history' },
  { key: 'resumes', label: 'Resumes', to: '/resumes' },
  { key: 'contacts', label: 'Contacts', to: '/contacts' },
  { key: 'interviews', label: 'Interviews', to: '/interviews' },
  { key: 'assistant', label: 'Assistant', to: '/assistant' },
  { key: 'analytics', label: 'Analytics', to: '/analytics' },
]

interface AppHeaderProps {
  active: NavKey
  subtitle?: string
  actions?: ReactNode
}

export function AppHeader({ active, subtitle, actions }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const celebrateBirthday = isBirthdayToday(user?.birthday)
  const firstName = user?.full_name?.split(' ')[0]

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="group flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-xl font-bold text-transparent transition group-hover:opacity-80">
              OfferFlow
            </span>
            {subtitle && <span className="hidden text-sm text-slate-500 sm:inline">{subtitle}</span>}
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/40"
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {actions}
          {user && (
            <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
              {celebrateBirthday && <span title="Happy birthday!">🎂</span>}
              <span>{firstName ?? user.email}</span>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="text-sm text-slate-500 transition hover:text-slate-300"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
