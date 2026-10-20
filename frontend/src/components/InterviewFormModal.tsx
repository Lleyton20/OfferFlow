import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getApplications } from '../api/applications'
import { INTERVIEW_TYPES, type InterviewSession, type InterviewSessionInput } from '../types/interview'
import { Modal } from './Modal'

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
    <Modal title={initial ? 'Edit interview prep' : 'New interview prep'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="field label">
            Linked application
            <select
              className="input"
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

          <label className="field label">
            Title
            <input
              required
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Interview type
              <input
                list="interview-type-options"
                required
                className="input"
                value={form.interview_type}
                onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
              />
              <datalist id="interview-type-options">
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </label>
            <label className="field label">
              Scheduled date
              <input
                type="date"
                className="input"
                value={form.scheduled_date ?? ''}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              />
            </label>
          </div>

          <label className="field label">
            Study plan
            <textarea
              className="input"
              rows={4}
              placeholder="What to review before this one…"
              value={form.prep_notes ?? ''}
              onChange={(e) => setForm({ ...form, prep_notes: e.target.value })}
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
