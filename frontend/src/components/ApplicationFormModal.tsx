import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getResumes } from '../api/resumes'
import { APPLICATION_STATUSES, type Application, type ApplicationInput } from '../types/application'
import { Modal } from './Modal'

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
    job_url: initial?.job_url ?? '',
    location: initial?.location ?? '',
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
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      ...form,
      contact_person: form.contact_person || null,
      job_description: form.job_description || null,
      notes: form.notes || null,
      job_url: form.job_url || null,
      location: form.location || null,
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
    <Modal title={initial ? 'Edit application' : 'Add application'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Company
              <input
                required
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="field label">
              Role
              <input
                required
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Date applied
              <input
                required
                type="date"
                className="input"
                value={form.date_applied}
                onChange={(e) => setForm({ ...form, date_applied: e.target.value })}
              />
            </label>
            <label className="field label">
              Status
              <input
                list="status-options"
                required
                className="input"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Job posting URL
              <input
                type="url"
                className="input"
                placeholder="https://"
                value={form.job_url ?? ''}
                onChange={(e) => setForm({ ...form, job_url: e.target.value })}
              />
            </label>
            <label className="field label">
              Location
              <input
                className="input"
                value={form.location ?? ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
          </div>

          <label className="field label">
            Contact person
            <input
              className="input"
              value={form.contact_person ?? ''}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.referral_used}
              onChange={(e) => setForm({ ...form, referral_used: e.target.checked })}
              className="h-4 w-4 rounded border-line-strong accent-brand-600"
            />
            Referral used
          </label>

          <label className="field label">
            Job description
            <textarea
              className="input"
              rows={2}
              value={form.job_description ?? ''}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            />
          </label>

          <label className="field label">
            Resume used
            <select
              className="input"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Strengths
              <input
                className="input"
                placeholder="Comma-separated"
                value={strengthsInput}
                onChange={(e) => setStrengthsInput(e.target.value)}
              />
            </label>
            <label className="field label">
              Weaknesses
              <input
                className="input"
                placeholder="Comma-separated"
                value={weaknessesInput}
                onChange={(e) => setWeaknessesInput(e.target.value)}
              />
            </label>
          </div>

          <label className="field label">
            Match score (0–10)
            <input
              type="number"
              min={0}
              max={10}
              className="input"
              value={form.match_score ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  match_score: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>

          <label className="field label">
            Notes
            <textarea
              className="input"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="sticky bottom-0 -mx-6 -mb-5 mt-2 flex justify-end gap-2 border-t border-line bg-surface px-6 py-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
