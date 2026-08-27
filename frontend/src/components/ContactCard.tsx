import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import type { Contact } from '../types/contact'

function isOverdue(followUpDate: string | null): boolean {
  if (!followUpDate) return false
  return followUpDate < new Date().toISOString().slice(0, 10)
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  Recruiter: 'bg-indigo-500/10 text-indigo-400',
  'Hiring Manager': 'bg-purple-500/10 text-purple-400',
  Referral: 'bg-emerald-500/10 text-emerald-400',
  Alum: 'bg-sky-500/10 text-sky-400',
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  onAddInteraction: (contact: Contact, date: string, note: string) => void
  onDeleteInteraction: (contact: Contact, interactionId: number) => void
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  onAddInteraction,
  onDeleteInteraction,
}: ContactCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const overdue = isOverdue(contact.follow_up_date)

  function handleAddInteraction(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    onAddInteraction(contact, date, note.trim())
    setNote('')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{contact.name}</p>
          <p className="text-sm text-slate-400">
            {[contact.role, contact.company].filter(Boolean).join(' at ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              RELATIONSHIP_COLORS[contact.relationship_type] ?? 'bg-slate-700/50 text-slate-300'
            }`}
          >
            {contact.relationship_type}
          </span>
          <button
            onClick={() => onEdit(contact)}
            className="text-xs text-indigo-400 transition hover:text-indigo-300"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(contact)}
            className="text-xs text-red-400 transition hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="text-slate-400 hover:text-slate-200">
            {contact.email}
          </a>
        )}
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-200"
          >
            LinkedIn
          </a>
        )}
        {contact.follow_up_date && (
          <span className={overdue ? 'font-medium text-red-400' : 'text-slate-400'}>
            {overdue ? 'Follow up overdue: ' : 'Follow up: '}
            {contact.follow_up_date}
          </span>
        )}
      </div>

      {contact.notes && <p className="mt-2 text-sm text-slate-400">{contact.notes}</p>}

      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-3 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
      >
        {expanded
          ? 'Hide conversation history'
          : `Conversation history (${contact.interactions.length})`}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
              <ul className="space-y-2">
                {contact.interactions.map((interaction) => (
                  <li
                    key={interaction.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-slate-950/50 p-2.5 text-sm"
                  >
                    <div>
                      <p className="text-xs text-slate-500">{interaction.date}</p>
                      <p className="text-slate-300">{interaction.note}</p>
                    </div>
                    <button
                      onClick={() => onDeleteInteraction(contact, interaction.id)}
                      className="text-xs text-red-400 transition hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {contact.interactions.length === 0 && (
                  <p className="text-sm text-slate-500">No conversations logged yet.</p>
                )}
              </ul>

              <form onSubmit={handleAddInteraction} className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                />
                <input
                  placeholder="Log a conversation…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-400"
                >
                  Add
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
