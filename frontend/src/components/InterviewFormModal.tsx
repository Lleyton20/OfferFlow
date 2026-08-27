import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { getApplications } from '../api/applications'
import { INTERVIEW_TYPES, type InterviewSession, type InterviewSessionInput } from '../types/interview'

interface InterviewFormModalProps {
  initial?: InterviewSession
  onSubmit: (data: InterviewSessionInput) => void
  onClose: () => void
  isSaving: boolean
}

function toFormState(initial?: InterviewSession): InterviewSessionInput {
  return {
    title: initial?.title ?? '',
    interview_type: initial?.interview_type ?? 'Behavioral',
    application_id: initial?.application_id ?? null,
    scheduled_date: initial?.scheduled_date ?? '',
    prep_notes: initial?.prep_notes ?? '',
  }
}

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'

export function InterviewFormModal({ initial, onSubmit, onClose, isSaving }: InterviewFormModalProps) {
  const [form, setForm] = useState<InterviewSessionInput>(toFormState(initial))
  const { data: applications } = useQuery({ queryKey: ['applications'], queryFn: getApplications })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      ...form,
      scheduled_date: form.scheduled_date || null,
      prep_notes: form.prep_notes || null,
    })
  }

  function handleApplicationChange(value: string) {
    const applicationId = value ? Number(value) : null
    const linked = applications?.find((a) => a.id === applicationId)
    setForm((prev) => ({
      ...prev,
      application_id: applicationId,
      title: prev.title || (linked ? `${linked.company} — ${linked.role}` : prev.title),
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">
          {initial ? 'Edit Interview Prep' : 'New Interview Prep'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Linked Application (optional)
            <select
              className={inputClass}
              value={form.application_id ?? ''}
              onChange={(e) => handleApplicationChange(e.target.value)}
            >
              <option value="">None</option>
              {applications?.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.company} — {application.role}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Title
            <input
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Interview Type
              <input
                list="interview-type-options"
                required
                className={inputClass}
                value={form.interview_type}
                onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
              />
              <datalist id="interview-type-options">
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Scheduled Date
              <input
                type="date"
                className={inputClass}
                value={form.scheduled_date ?? ''}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Study Plan / Prep Notes
            <textarea
              className={inputClass}
              rows={4}
              placeholder="What to review before this one…"
              value={form.prep_notes ?? ''}
              onChange={(e) => setForm({ ...form, prep_notes: e.target.value })}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
