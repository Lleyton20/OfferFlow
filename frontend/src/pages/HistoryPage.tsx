import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { getApplications } from '../api/applications'
import { getResumes } from '../api/resumes'
import { AppHeader } from '../components/AppHeader'
import type { Application } from '../types/application'

type Filter = 'all' | 'active' | 'offer' | 'rejected'

const CLOSED = new Set(['Offer', 'Rejected'])

const STATUS_DOT: Record<string, string> = {
  Offer: 'bg-emerald-400',
  Rejected: 'bg-red-400',
}

function matchesFilter(app: Application, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return !CLOSED.has(app.status)
  if (filter === 'offer') return app.status === 'Offer'
  return app.status === 'Rejected'
}

function HistoryRow({ application, resumeFilename }: { application: Application; resumeFilename?: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"
    >
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[application.status] ?? 'bg-indigo-400'}`}
            />
            <p className="truncate font-medium text-white">
              {application.company} — {application.role}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Applied {application.date_applied}
            {resumeFilename && <span className="text-sky-400"> · 📄 {resumeFilename}</span>}
          </p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
          {application.status}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
              {application.job_description && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Job Description
                  </h4>
                  <p className="whitespace-pre-line text-sm text-slate-400">
                    {application.job_description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status Timeline
                </h4>
                <ol className="space-y-2">
                  {application.status_history.map((event, i) => (
                    <li key={event.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={`h-2 w-2 rounded-full ${STATUS_DOT[event.status] ?? 'bg-indigo-400'}`}
                      />
                      <span className="text-slate-300">{event.status}</span>
                      <span className="text-xs text-slate-600">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                      {i === application.status_history.length - 1 && (
                        <span className="text-xs text-indigo-400">current</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {application.notes && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </h4>
                  <p className="text-sm text-slate-400">{application.notes}</p>
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

  const TABS: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'offer', label: `Offers (${counts.offer})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <AppHeader active="history" subtitle="Application history" />

      <main className="mx-auto max-w-4xl px-6 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filter === tab.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-slate-500">Loading…</p>}
        {sorted.length === 0 && !isLoading && (
          <p className="text-slate-500">No applications match this filter.</p>
        )}

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((application) => (
              <HistoryRow
                key={application.id}
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
