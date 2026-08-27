import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { RELATIONSHIP_TYPES, type Contact, type ContactInput } from '../types/contact'

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

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'

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
          {initial ? 'Edit Contact' : 'Add Contact'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Name
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Relationship
              <input
                list="relationship-options"
                required
                className={inputClass}
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

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Company
              <input
                className={inputClass}
                value={form.company ?? ''}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Role / Title
              <input
                className={inputClass}
                value={form.role ?? ''}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Email
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              LinkedIn URL
              <input
                className={inputClass}
                value={form.linkedin_url ?? ''}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Last Contacted
              <input
                type="date"
                className={inputClass}
                value={form.last_contacted_date ?? ''}
                onChange={(e) => setForm({ ...form, last_contacted_date: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-400">
              Follow Up On
              <input
                type="date"
                className={inputClass}
                value={form.follow_up_date ?? ''}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Notes
            <textarea
              className={inputClass}
              rows={3}
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
