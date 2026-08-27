import { useState, type FormEvent } from 'react'
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
  }
}

export function ApplicationFormModal({
  initial,
  onSubmit,
  onClose,
  isSaving,
}: ApplicationFormModalProps) {
  const [form, setForm] = useState<ApplicationInput>(toFormState(initial))
  const [strengthsInput, setStrengthsInput] = useState(form.strengths.join(', '))
  const [weaknessesInput, setWeaknessesInput] = useState(form.weaknesses.join(', '))

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {initial ? 'Edit Application' : 'Add Application'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Company
              <input
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Role
              <input
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Date Applied
              <input
                required
                type="date"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.date_applied}
                onChange={(e) => setForm({ ...form, date_applied: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Status
              <input
                list="status-options"
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Contact Person
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.contact_person ?? ''}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.referral_used}
              onChange={(e) => setForm({ ...form, referral_used: e.target.checked })}
            />
            Referral used
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Job Description
            <textarea
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={form.job_description ?? ''}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Strengths (comma-separated)
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={strengthsInput}
                onChange={(e) => setStrengthsInput(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Weaknesses (comma-separated)
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={weaknessesInput}
                onChange={(e) => setWeaknessesInput(e.target.value)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Match Score (0-10)
            <input
              type="number"
              min={0}
              max={10}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.match_score ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  match_score: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Notes
            <textarea
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
