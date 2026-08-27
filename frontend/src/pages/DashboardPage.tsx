import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from '../api/applications'
import { getContacts } from '../api/contacts'
import { getResumes } from '../api/resumes'
import { AppHeader } from '../components/AppHeader'
import { ApplicationBoard } from '../components/ApplicationBoard'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { BirthdayBanner } from '../components/BirthdayBanner'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OverviewStats } from '../components/OverviewStats'
import { useAuth } from '../context/AuthContext'
import { isBirthdayToday } from '../lib/birthday'
import type { Application, ApplicationInput } from '../types/application'

export function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<
    { mode: 'create' } | { mode: 'edit'; application: Application } | null
  >(null)

  const { data: applications, isLoading, isError, error } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
  })

  // Fetched here too (not just on their own pages) so the overview strip below
  // can tie all three domains together on one screen, and so Resumes/Contacts
  // feel instant when the user clicks through — React Query already has them cached.
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const { data: contacts } = useQuery({ queryKey: ['contacts'], queryFn: getContacts })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['applications'] })

  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      invalidate()
      setModalState(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApplicationInput> }) =>
      updateApplication(id, data),
    onSuccess: () => {
      invalidate()
      setModalState(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: invalidate,
  })

  function handleDelete(application: Application) {
    if (confirm(`Delete the ${application.company} application?`)) {
      deleteMutation.mutate(application.id)
    }
  }

  function handleStatusChange(application: Application, status: string) {
    updateMutation.mutate({ id: application.id, data: { status } })
  }

  function handleSubmit(data: ApplicationInput) {
    if (modalState?.mode === 'edit') {
      updateMutation.mutate({ id: modalState.application.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="aurora-bg aurora-bg-subtle min-h-screen bg-slate-950">
      <AppHeader
        active="dashboard"
        subtitle="From Application to Offer."
        actions={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalState({ mode: 'create' })}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            + Add Application
          </motion.button>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-6">
        {isBirthdayToday(user?.birthday) && <BirthdayBanner name={user?.full_name?.split(' ')[0]} />}

        {applications && (
          <OverviewStats
            applications={applications}
            resumes={resumes ?? []}
            contacts={contacts ?? []}
          />
        )}

        {isLoading && <LoadingSpinner label="Loading applications…" />}
        {isError && (
          <p className="text-red-400">Couldn&apos;t reach the API: {(error as Error).message}</p>
        )}
        {applications && (
          <ApplicationBoard
            applications={applications}
            onEdit={(application) => setModalState({ mode: 'edit', application })}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      <AnimatePresence>
        {modalState && (
          <ApplicationFormModal
            initial={modalState.mode === 'edit' ? modalState.application : undefined}
            onSubmit={handleSubmit}
            onClose={() => setModalState(null)}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
