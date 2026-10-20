import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { getResumes } from '../api/resumes'
import { STATUS_COLORS, STATUS_COLOR_FALLBACK } from '../lib/statusColors'
import { APPLICATION_STATUSES, type Application } from '../types/application'

interface ApplicationBoardProps {
  applications: Application[]
  onEdit: (application: Application) => void
  onDelete: (application: Application) => void
  onStatusChange: (application: Application, status: string) => void
}

function groupByStatus(applications: Application[]) {
  const groups = new Map<string, Application[]>()
  for (const status of APPLICATION_STATUSES) {
    groups.set(status, [])
  }
  for (const application of applications) {
    const key = APPLICATION_STATUSES.includes(application.status as never)
      ? application.status
      : 'Other'
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(application)
  }
  return groups
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ApplicationBoard({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationBoardProps) {
  const groups = groupByStatus(applications)
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const resumeById = new Map((resumes ?? []).map((r) => [r.id, r]))

  return (
    <LayoutGroup>
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {[...groups.entries()].map(([status, apps], columnIndex) => (
        <motion.section
          key={status}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: columnIndex * 0.05, ease: [0.2, 0.8, 0.2, 1] } }}
          aria-label={`${status} (${apps.length})`}
          className="w-72 flex-shrink-0 snap-start rounded-xl bg-subtle/70 p-2"
        >
          <header className="flex items-center justify-between px-2 pt-1 pb-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] ?? STATUS_COLOR_FALLBACK }}
                aria-hidden="true"
              />
              <h3 className="text-[13px] font-semibold text-ink">{status}</h3>
            </div>
            <span className="text-xs font-medium tabular-nums text-muted">{apps.length}</span>
          </header>

          <div className="flex min-h-16 flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {apps.map((application) => {
                const resume = application.resume_id ? resumeById.get(application.resume_id) : undefined
                return (
                  <motion.article
                    key={application.id}
                    layoutId={`application-${application.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="group card p-3.5 transition-shadow duration-200 hover:shadow-lift"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{application.company}</p>
                        <p className="truncate text-[13px] text-muted">{application.role}</p>
                      </div>
                      {application.referral_used && <span className="chip chip-brand">Referral</span>}
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
                      <span>Applied {formatDate(application.date_applied)}</span>
                      {resume && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate" title={resume.filename}>
                            {resume.filename}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                      <select
                        value={application.status}
                        onChange={(e) => onStatusChange(application, e.target.value)}
                        aria-label={`Status for ${application.company}`}
                        className="input input-sm w-auto max-w-[9.5rem] py-1"
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        {!APPLICATION_STATUSES.includes(application.status as never) && (
                          <option value={application.status}>{application.status}</option>
                        )}
                      </select>
                      <div className="flex gap-3 text-xs">
                        <button onClick={() => onEdit(application)} className="link-muted font-medium">
                          Edit
                        </button>
                        <button onClick={() => onDelete(application)} className="link-danger font-medium">
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
            {apps.length === 0 && (
              <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-xs text-muted">
                Nothing here yet
              </p>
            )}
          </div>
        </motion.section>
      ))}
    </div>
    </LayoutGroup>
  )
}
