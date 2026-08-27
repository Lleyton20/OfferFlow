import { AnimatePresence, motion } from 'motion/react'
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

export function ApplicationBoard({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationBoardProps) {
  const groups = groupByStatus(applications)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...groups.entries()].map(([status, apps], columnIndex) => (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: columnIndex * 0.05 }}
          className="w-72 flex-shrink-0"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-300">{status}</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {apps.length}
            </span>
          </div>
          <div className="flex min-h-[4rem] flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {apps.map((application) => (
                <motion.div
                  key={application.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/20 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{application.company}</p>
                      <p className="text-sm text-slate-400">{application.role}</p>
                    </div>
                    {application.referral_used && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Referral
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Applied {application.date_applied}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <select
                      value={application.status}
                      onChange={(e) => onStatusChange(application, e.target.value)}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
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
                      <button
                        onClick={() => onEdit(application)}
                        className="text-indigo-400 transition hover:text-indigo-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(application)}
                        className="text-red-400 transition hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
