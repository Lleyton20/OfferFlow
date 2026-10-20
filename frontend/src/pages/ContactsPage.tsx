import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
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
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
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

  const openCreate = () => setModalState({ mode: 'create' })

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="contacts" />

      <main className="page max-w-4xl">
        <PageHeader
          title="Contacts"
          description="Recruiters, referrals and alumni, with every conversation and follow-up in one place."
          actions={
            <button onClick={openCreate} className="btn btn-primary">
              <span aria-hidden="true">+</span> Add contact
            </button>
          }
        />

        {contacts && contacts.length > 0 && (
          <div className="card mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums text-ink">{stats.total}</p>
              <p className="text-xs text-muted">Contacts</p>
            </div>
            <div>
              <p
                className={`text-2xl font-semibold tracking-tight tabular-nums ${
                  stats.overdue > 0 ? 'text-warning' : 'text-ink'
                }`}
              >
                {stats.overdue}
              </p>
              <p className="text-xs text-muted">Overdue follow-ups</p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              {stats.byType.map(([type, count]) => (
                <span key={type} className="chip chip-neutral">
                  {type}
                  <span className="tabular-nums text-muted">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {isLoading && <LoadingSpinner label="Loading contacts…" />}
        {contacts && contacts.length === 0 && (
          <EmptyState
            title="No contacts yet"
            description="Add a recruiter or referral to start tracking conversations and follow-ups."
            action={
              <button onClick={openCreate} className="btn btn-primary">
                Add your first contact
              </button>
            }
          />
        )}
        <div className="space-y-3">
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
