import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import type { Contact } from '../types/contact'

function isOverdue(followUpDate: string | null): boolean {
  if (!followUpDate) return false
  return followUpDate < new Date().toISOString().slice(0, 10)
}

const RELATIONSHIP_CHIPS: Record<string, string> = {
  Recruiter: 'chip-brand',
  Referral: 'chip-brand',
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  onAddInteraction: (contact: Contact, date: string, note: string) => void
  onDeleteInteraction: (contact: Contact, interactionId: number) => void
  index?: number
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  onAddInteraction,
  onDeleteInteraction,
  index = 0,
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
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.2, 0.8, 0.2, 1] } }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="card p-5 transition-shadow duration-200 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{contact.name}</p>
            <span className={`chip ${RELATIONSHIP_CHIPS[contact.relationship_type] ?? 'chip-neutral'}`}>
              {contact.relationship_type}
            </span>
          </div>
          {(contact.role || contact.company) && (
            <p className="mt-0.5 text-sm text-muted">
              {[contact.role, contact.company].filter(Boolean).join(' at ')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
          <button onClick={() => onEdit(contact)} className="link-muted">
            Edit
          </button>
          <button onClick={() => onDelete(contact)} className="link-danger">
            Delete
          </button>
        </div>
      </div>

      {(contact.email || contact.linkedin_url || contact.follow_up_date) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="link-muted">
              {contact.email}
            </a>
          )}
          {contact.linkedin_url && (
            <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="link-muted">
              LinkedIn ↗
            </a>
          )}
          {contact.follow_up_date && (
            <span className={overdue ? 'chip chip-warning' : 'text-muted'}>
              {overdue ? 'Follow-up overdue · ' : 'Follow up '}
              {contact.follow_up_date}
            </span>
          )}
        </div>
      )}

      {contact.notes && <p className="mt-3 text-sm text-ink-soft">{contact.notes}</p>}

      <button onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="link mt-4 text-xs">
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
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              {contact.interactions.length > 0 ? (
                <ol className="relative space-y-3 border-l border-line pl-4">
                  {contact.interactions.map((interaction) => (
                    <li key={interaction.id} className="group relative flex items-start justify-between gap-3 text-sm">
                      <span
                        className="absolute top-1.5 -left-[21px] h-2 w-2 rounded-full border-2 border-surface bg-line-strong"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs text-muted">{interaction.date}</p>
                        <p className="text-ink-soft">{interaction.note}</p>
                      </div>
                      <button
                        onClick={() => onDeleteInteraction(contact, interaction.id)}
                        className="link-danger text-xs font-medium"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">No conversations logged yet.</p>
              )}

              <form onSubmit={handleAddInteraction} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Conversation date"
                  className="input sm:w-40"
                />
                <input
                  placeholder="Log a conversation"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-label="Conversation note"
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-secondary">
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
