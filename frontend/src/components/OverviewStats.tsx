import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { Application } from '../types/application'
import type { Contact } from '../types/contact'
import type { Resume } from '../types/resume'
import { AnimatedNumber } from './AnimatedNumber'

interface OverviewStatsProps {
  applications: Application[]
  resumes: Resume[]
  contacts: Contact[]
}

const CLOSED_STATUSES = new Set(['Offer', 'Rejected'])

export function OverviewStats({ applications, resumes, contacts }: OverviewStatsProps) {
  const active = applications.filter((a) => !CLOSED_STATUSES.has(a.status)).length
  const offers = applications.filter((a) => a.status === 'Offer').length

  const today = new Date().toISOString().slice(0, 10)
  const overdueFollowUps = contacts.filter((c) => c.follow_up_date && c.follow_up_date < today).length

  const latestResume = [...resumes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0]

  const tiles = [
    {
      key: 'active',
      label: 'Active applications',
      value: active,
      accent: 'from-teal-500/20 to-teal-500/5 ring-teal-500/30',
      to: '/dashboard',
      hint: `${applications.length} total tracked`,
    },
    {
      key: 'offers',
      label: 'Offers in hand',
      value: offers,
      accent: 'from-emerald-500/20 to-emerald-500/5 ring-emerald-500/30',
      to: '/dashboard',
      hint: offers > 0 ? 'Nice work 🎉' : 'Keep going',
    },
    {
      key: 'contacts',
      label: 'Follow-ups overdue',
      value: overdueFollowUps,
      accent:
        overdueFollowUps > 0
          ? 'from-amber-500/20 to-amber-500/5 ring-amber-500/30'
          : 'from-slate-700/30 to-slate-700/5 ring-slate-700/40',
      to: '/contacts',
      hint: `${contacts.length} contact${contacts.length === 1 ? '' : 's'} total`,
    },
    {
      key: 'resume',
      label: 'Latest resume score',
      value: latestResume ? latestResume.ats_score : 0,
      suffix: latestResume ? '/100' : '',
      accent: 'from-sky-500/20 to-sky-500/5 ring-sky-500/30',
      to: '/resumes',
      hint: latestResume ? latestResume.filename : 'Upload your first resume',
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile, i) => (
        <motion.div key={tile.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
          <Link
            to={tile.to}
            className={`block rounded-xl bg-gradient-to-br p-4 ring-1 ring-inset transition hover:brightness-110 ${tile.accent}`}
          >
            <p className="text-2xl font-semibold text-white">
              <AnimatedNumber value={tile.value} />
              {tile.suffix}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-300">{tile.label}</p>
            <p className="mt-1 truncate text-[11px] text-slate-500">{tile.hint}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
