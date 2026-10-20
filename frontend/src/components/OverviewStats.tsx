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
      to: '/history',
      hint: `${applications.length} tracked in total`,
    },
    {
      key: 'offers',
      label: 'Offers',
      value: offers,
      to: '/history',
      hint: offers > 0 ? 'Congratulations' : 'None yet — keep going',
      highlight: offers > 0,
    },
    {
      key: 'contacts',
      label: 'Overdue follow-ups',
      value: overdueFollowUps,
      to: '/contacts',
      hint: `${contacts.length} contact${contacts.length === 1 ? '' : 's'}`,
      warn: overdueFollowUps > 0,
    },
    {
      key: 'resume',
      label: 'Latest resume score',
      value: latestResume ? latestResume.ats_score : 0,
      suffix: latestResume ? '/100' : '',
      to: '/resumes',
      hint: latestResume ? latestResume.filename : 'Upload your first resume',
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-line shadow-card gap-px lg:grid-cols-4">
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="bg-surface"
        >
          <Link to={tile.to} className="group block h-full p-5 transition-colors hover:bg-canvas">
            <p className="text-xs font-medium text-muted">{tile.label}</p>
            <p
              className={`mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums ${
                tile.highlight ? 'text-brand-700' : tile.warn ? 'text-warning' : 'text-ink'
              }`}
            >
              <AnimatedNumber value={tile.value} />
              {tile.suffix && <span className="ml-0.5 text-base font-medium text-faint">{tile.suffix}</span>}
            </p>
            <p className="mt-2 truncate text-xs text-muted">{tile.hint}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
