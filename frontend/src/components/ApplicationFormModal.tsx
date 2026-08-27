import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { getResumes } from '../api/resumes'
import { APPLICATION_STATUSES, type Application, type ApplicationInput } from '../types/application'

interface ApplicationFormModalProps {
  initial?: Application
  onSubmit: (data: ApplicationInput) => void
  onClose: () => void
  isSaving: boolean
}

function toFormState(initial?: Application): ApplicationInput {
  return {
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    date_applied: initial?.date_applied ?? new Date().toISOString().slice(0, 10),
    status: initial?.status ?? 'Applied',
    referral_used: initial?.referral_used ?? false,
    contact_person: initial?.contact_person ?? '',
    job_description: initial?.job_description ?? '',
    match_score: initial?.match_score ?? null,
    strengths: initial?.strengths ?? [],
    weaknesses: initial?.weaknesses ?? [],
    notes: initial?.notes ?? '',
    resume_id: initial?.resume_id ?? null,
  }
}

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'

export function ApplicationFormModal({
  initial,
  onSubmit,
  onClose,
  isSaving,
}: ApplicationFormModalProps) {
  const [form, setForm] = useState<ApplicationInput>(toFormState(initial))
  const [strengthsInput, setStrengthsInput] = useState(form.strengths.join(', '))
  const [weaknessesInput, setWeaknessesInput] = useState(form.weaknesses.join(', '))
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      ...form,
      contact_person: form.contact_person || null,
      job_description: form.job_description || null,
      notes: form.notes || null,
      strengths: strengthsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      weaknesses: weaknessesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
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
          {initial ? 'Edit Application' : 'Add Application'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Company
              <input
                required
                className={inputClass}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Role
              <input
                required
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Date Applied
              <input
                required
                type="date"
                className={inputClass}
                value={form.date_applied}
                onChange={(e) => setForm({ ...form, date_applied: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Status
              <input
                list="status-options"
                required
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
              <datalist id="status-options">
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Contact Person
            <input
              className={inputClass}
              value={form.contact_person ?? ''}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={form.referral_used}
              onChange={(e) => setForm({ ...form, referral_used: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-emerald-500"
            />
            Referral used
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Job Description
            <textarea
              className={inputClass}
              rows={2}
              value={form.job_description ?? ''}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Resume used
            <select
              className={inputClass}
              value={form.resume_id ?? ''}
              onChange={(e) =>
                setForm({ ...form, resume_id: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">None</option>
              {resumes?.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.filename} ({resume.ats_score}/100)
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Strengths (comma-separated)
              <input
                className={inputClass}
                value={strengthsInput}
                onChange={(e) => setStrengthsInput(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Weaknesses (comma-separated)
              <input
                className={inputClass}
                value={weaknessesInput}
                onChange={(e) => setWeaknessesInput(e.target.value)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Match Score (0-10)
            <input
              type="number"
              min={0}
              max={10}
              className={inputClass}
              value={form.match_score ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  match_score: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Notes
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
