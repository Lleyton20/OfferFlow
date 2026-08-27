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
      {[...groups.entries()].map(([status, apps]) => (
        <div key={status} className="w-72 flex-shrink-0">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-700">{status}</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
              {apps.length}
            </span>
          </div>
          <div className="flex min-h-[4rem] flex-col gap-2">
            {apps.map((application) => (
              <div
                key={application.id}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{application.company}</p>
                    <p className="text-sm text-slate-500">{application.role}</p>
                  </div>
                  {application.referral_used && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      Referral
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Applied {application.date_applied}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <select
                    value={application.status}
                    onChange={(e) => onStatusChange(application, e.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
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
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => onEdit(application)}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(application)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
