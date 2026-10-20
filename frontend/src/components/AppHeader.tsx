import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { isBirthdayToday } from '../lib/birthday'
import { initials } from '../lib/initials'
import { Logo } from './Logo'

type NavKey =
  | 'dashboard'
  | 'discover'
  | 'settings'
  | 'resumes'
  | 'contacts'
  | 'history'
  | 'analytics'
  | 'interviews'
  | 'assistant'

const NAV_ITEMS: { key: NavKey; label: string; to: string }[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { key: 'discover', label: 'Discover', to: '/discover' },
  { key: 'history', label: 'History', to: '/history' },
  { key: 'resumes', label: 'Resumes', to: '/resumes' },
  { key: 'contacts', label: 'Contacts', to: '/contacts' },
  { key: 'interviews', label: 'Interviews', to: '/interviews' },
  { key: 'assistant', label: 'Assistant', to: '/assistant' },
  { key: 'analytics', label: 'Analytics', to: '/analytics' },
]

export function AppHeader({ active }: { active: NavKey }) {
  const { user, logout } = useAuth()
  const celebrateBirthday = isBirthdayToday(user?.birthday)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Logo to="/dashboard" />

          <nav aria-label="Primary" className="hidden items-center lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.key} item={item} isActive={item.key === active} />
            ))}
          </nav>
        </div>

        {user && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200"
                aria-hidden="true"
              >
                {initials(user.full_name, user.email)}
              </span>
              <span className="hidden max-w-36 truncate text-sm font-medium text-ink-soft xl:inline">
                {user.full_name ?? user.email}
                {celebrateBirthday && (
                  <span className="ml-1.5" title="Happy birthday!" aria-label="Happy birthday">
                    🎂
                  </span>
                )}
              </span>
            </div>
            <Link
              to="/settings"
              aria-label="Settings"
              aria-current={active === 'settings' ? 'page' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                active === 'settings' ? 'bg-subtle text-ink' : 'text-muted hover:bg-subtle hover:text-ink'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.3 3.6c.4-1.5 2.6-1.5 3 0a1.6 1.6 0 0 0 2.4 1c1.3-.8 2.9.7 2.1 2.1a1.6 1.6 0 0 0 1 2.4c1.5.4 1.5 2.6 0 3a1.6 1.6 0 0 0-1 2.4c.8 1.3-.7 2.9-2.1 2.1a1.6 1.6 0 0 0-2.4 1c-.4 1.5-2.6 1.5-3 0a1.6 1.6 0 0 0-2.4-1c-1.3.8-2.9-.7-2.1-2.1a1.6 1.6 0 0 0-1-2.4c-1.5-.4-1.5-2.6 0-3a1.6 1.6 0 0 0 1-2.4c-.8-1.3.7-2.9 2.1-2.1a1.6 1.6 0 0 0 2.4-1Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
            <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            <button onClick={() => logout()} className="btn btn-ghost btn-sm">
              Log out
            </button>
          </div>
        )}
      </div>

      <nav
        aria-label="Primary"
        className="flex gap-0.5 overflow-x-auto border-t border-line px-3 py-1.5 lg:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} isActive={item.key === active} />
        ))}
      </nav>
    </header>
  )
}

function NavLink({ item, isActive }: { item: (typeof NAV_ITEMS)[number]; isActive: boolean }) {
  return (
    <Link
      to={item.to}
      aria-current={isActive ? 'page' : undefined}
      className={`relative shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
        isActive ? 'text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="nav-pill"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          className="absolute inset-0 rounded-md bg-subtle ring-1 ring-inset ring-line"
        />
      )}
      <span className="relative">{item.label}</span>
    </Link>
  )
}
