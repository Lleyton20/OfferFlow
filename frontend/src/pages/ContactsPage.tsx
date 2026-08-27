import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  addInteraction,
  createContact,
  deleteContact,
  deleteInteraction,
  getContacts,
  updateContact,
} from '../api/contacts'
import { AppHeader } from '../components/AppHeader'
import { ContactCard } from '../components/ContactCard'
import { ContactFormModal } from '../components/ContactFormModal'
import type { Contact, ContactInput } from '../types/contact'

export function ContactsPage() {
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<
    { mode: 'create' } | { mode: 'edit'; contact: Contact } | null
  >(null)

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contacts'] })

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      invalidate()
      setModalState(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContactInput> }) =>
      updateContact(id, data),
    onSuccess: () => {
      invalidate()
      setModalState(null)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteContact, onSuccess: invalidate })

  const addInteractionMutation = useMutation({
    mutationFn: ({ contactId, date, note }: { contactId: number; date: string; note: string }) =>
      addInteraction(contactId, { date, note }),
    onSuccess: invalidate,
  })

  const deleteInteractionMutation = useMutation({
    mutationFn: ({ contactId, interactionId }: { contactId: number; interactionId: number }) =>
      deleteInteraction(contactId, interactionId),
    onSuccess: invalidate,
  })

  const stats = useMemo(() => {
    const list = contacts ?? []
    const today = new Date().toISOString().slice(0, 10)
    const overdue = list.filter((c) => c.follow_up_date && c.follow_up_date < today).length
    const byType = new Map<string, number>()
    for (const c of list) {
      byType.set(c.relationship_type, (byType.get(c.relationship_type) ?? 0) + 1)
    }
    return { total: list.length, overdue, byType: [...byType.entries()] }
  }, [contacts])

  function handleSubmit(data: ContactInput) {
    if (modalState?.mode === 'edit') {
      updateMutation.mutate({ id: modalState.contact.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AppHeader active="contacts" subtitle="Networking CRM" />

      <main className="mx-auto max-w-4xl px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-2xl font-semibold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total contacts</p>
            </div>
            <div>
              <p className={`text-2xl font-semibold ${stats.overdue > 0 ? 'text-red-400' : 'text-white'}`}>
                {stats.overdue}
              </p>
              <p className="text-xs text-slate-500">Overdue follow-ups</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.byType.map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalState({ mode: 'create' })}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
          >
            + Add Contact
          </motion.button>
        </motion.div>

        {isLoading && <p className="text-slate-500">Loading contacts…</p>}
        {contacts && contacts.length === 0 && (
          <p className="text-slate-500">No contacts yet — add your first one above.</p>
        )}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {contacts?.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={(c) => setModalState({ mode: 'edit', contact: c })}
                onDelete={(c) => {
                  if (confirm(`Delete ${c.name}?`)) deleteMutation.mutate(c.id)
                }}
                onAddInteraction={(c, date, note) =>
                  addInteractionMutation.mutate({ contactId: c.id, date, note })
                }
                onDeleteInteraction={(c, interactionId) =>
                  deleteInteractionMutation.mutate({ contactId: c.id, interactionId })
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {modalState && (
          <ContactFormModal
            initial={modalState.mode === 'edit' ? modalState.contact : undefined}
            onSubmit={handleSubmit}
            onClose={() => setModalState(null)}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
