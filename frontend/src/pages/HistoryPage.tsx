import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { getApplications } from '../api/applications'
import { getResumes } from '../api/resumes'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { ListSkeleton } from '../components/Skeleton'
import { STATUS_COLORS, STATUS_COLOR_FALLBACK } from '../lib/statusColors'
import type { Application } from '../types/application'

type Filter = 'all' | 'active' | 'offer' | 'rejected'

const CLOSED = new Set(['Offer', 'Rejected'])

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLOR_FALLBACK
}

function matchesFilter(app: Application, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return !CLOSED.has(app.status)
  if (filter === 'offer') return app.status === 'Offer'
  return app.status === 'Rejected'
}

function HistoryRow({
  application,
  resumeFilename,
  index,
}: {
  application: Application
  resumeFilename?: string
  index: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: Math.min(index, 10) * 0.035 } }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className="card transition-shadow duration-200 hover:shadow-lift"
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left transition-colors hover:bg-canvas"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: statusColor(application.status) }}
              aria-hidden="true"
            />
            <p className="truncate font-medium text-ink">
              {application.company}
              <span className="font-normal text-muted"> · {application.role}</span>
            </p>
          </div>
          <p className="mt-1 pl-4 text-xs text-muted">
            Applied {application.date_applied}
            {resumeFilename && <span> · {resumeFilename}</span>}
          </p>
        </div>
        <span
          className={`chip flex-shrink-0 ${
            application.status === 'Offer'
              ? 'chip-brand'
              : application.status === 'Rejected'
                ? 'chip-danger'
                : 'chip-neutral'
          }`}
        >
          {application.status}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-6 border-t border-line px-4 py-5">
              {(application.job_url || application.location) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {application.location && <span className="text-ink-soft">{application.location}</span>}
                  {application.job_url && (
                    <a href={application.job_url} target="_blank" rel="noreferrer" className="link">
                      View job posting ↗
                    </a>
                  )}
                  {application.source !== 'manual' && (
                    <span className="text-muted">Captured automatically from {application.source}</span>
                  )}
                </div>
              )}

              {application.job_description && (
                <div>
                  <h4 className="eyebrow mb-1.5">
                    Job description
                  </h4>
                  <p className="whitespace-pre-line text-sm text-ink-soft">
                    {application.job_description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="eyebrow mb-2">
                  Status timeline
                </h4>
                <ol className="space-y-2">
                  {application.status_history.map((event, i) => (
                    <li key={event.id} className="flex items-center gap-3 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: statusColor(event.status) }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-ink">{event.status}</span>
                      <span className="text-xs text-muted">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                      {i === application.status_history.length - 1 && (
                        <span className="chip chip-brand">Current</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {application.notes && (
                <div>
                  <h4 className="eyebrow mb-1.5">
                    Notes
                  </h4>
                  <p className="text-sm text-ink-soft">{application.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function HistoryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
  })
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const resumeById = new Map((resumes ?? []).map((r) => [r.id, r]))

  const sorted = useMemo(() => {
    return [...(applications ?? [])]
      .filter((a) => matchesFilter(a, filter))
      .sort((a, b) => b.date_applied.localeCompare(a.date_applied))
  }, [applications, filter])

  const counts = useMemo(() => {
    const list = applications ?? []
    return {
      all: list.length,
      active: list.filter((a) => !CLOSED.has(a.status)).length,
      offer: list.filter((a) => a.status === 'Offer').length,
      rejected: list.filter((a) => a.status === 'Rejected').length,
    }
  }, [applications])

  const TABS: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'offer', label: 'Offers', count: counts.offer },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ]

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="history" />

      <main className="page max-w-4xl">
        <PageHeader
          title="History"
          description="Every application you've tracked, with its full status timeline."
        />

        <div className="mb-6 inline-flex flex-wrap gap-1 rounded-lg bg-subtle p-1" role="tablist" aria-label="Filter applications">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {filter === tab.key && (
                <motion.span
                  layoutId="history-filter"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-md bg-surface shadow-xs"
                />
              )}
              <span className="relative">
                {tab.label}
                <span className="ml-1.5 tabular-nums text-faint">{tab.count}</span>
              </span>
            </button>
          ))}
        </div>

        {isLoading && <ListSkeleton />}
        {sorted.length === 0 && !isLoading && (
          <EmptyState
            title={counts.all === 0 ? 'No applications yet' : 'Nothing matches this filter'}
            description={
              counts.all === 0 ? 'Applications you add on the dashboard will appear here.' : undefined
            }
          />
        )}

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sorted.map((application, index) => (
              <HistoryRow
                key={application.id}
                index={index}
                application={application}
                resumeFilename={
                  application.resume_id
                    ? resumeById.get(application.resume_id)?.filename
                    : undefined
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
