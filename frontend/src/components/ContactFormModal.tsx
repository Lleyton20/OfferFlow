import { useState, type FormEvent } from 'react'
import { RELATIONSHIP_TYPES, type Contact, type ContactInput } from '../types/contact'
import { Modal } from './Modal'

interface ContactFormModalProps {
  initial?: Contact
  onSubmit: (data: ContactInput) => void
  onClose: () => void
  isSaving: boolean
}

function toFormState(initial?: Contact): ContactInput {
  return {
    name: initial?.name ?? '',
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    email: initial?.email ?? '',
    linkedin_url: initial?.linkedin_url ?? '',
    relationship_type: initial?.relationship_type ?? 'Recruiter',
    notes: initial?.notes ?? '',
    last_contacted_date: initial?.last_contacted_date ?? '',
    follow_up_date: initial?.follow_up_date ?? '',
  }
}

export function ContactFormModal({ initial, onSubmit, onClose, isSaving }: ContactFormModalProps) {
  const [form, setForm] = useState<ContactInput>(toFormState(initial))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      ...form,
      company: form.company || null,
      role: form.role || null,
      email: form.email || null,
      linkedin_url: form.linkedin_url || null,
      notes: form.notes || null,
      last_contacted_date: form.last_contacted_date || null,
      follow_up_date: form.follow_up_date || null,
    })
  }

  return (
    <Modal title={initial ? 'Edit contact' : 'Add contact'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Name
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field label">
              Relationship
              <input
                list="relationship-options"
                required
                className="input"
                value={form.relationship_type}
                onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}
              />
              <datalist id="relationship-options">
                {RELATIONSHIP_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Company
              <input
                className="input"
                value={form.company ?? ''}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="field label">
              Role or title
              <input
                className="input"
                value={form.role ?? ''}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Email
              <input
                type="email"
                className="input"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="field label">
              LinkedIn URL
              <input
                className="input"
                value={form.linkedin_url ?? ''}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field label">
              Last contacted
              <input
                type="date"
                className="input"
                value={form.last_contacted_date ?? ''}
                onChange={(e) => setForm({ ...form, last_contacted_date: e.target.value })}
              />
            </label>
            <label className="field label">
              Follow up on
              <input
                type="date"
                className="input"
                value={form.follow_up_date ?? ''}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
              />
            </label>
          </div>

          <label className="field label">
            Notes
            <textarea
              className="input"
              rows={3}
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
