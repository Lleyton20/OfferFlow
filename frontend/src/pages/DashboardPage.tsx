import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
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
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OverviewStats } from '../components/OverviewStats'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { isBirthdayToday } from '../lib/birthday'
import type { Application, ApplicationInput } from '../types/application'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

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

  const firstName = user?.full_name?.split(' ')[0]
  const openCreate = () => setModalState({ mode: 'create' })

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="dashboard" />

      <main className="page">
        {isBirthdayToday(user?.birthday) && <BirthdayBanner name={firstName} />}

        <PageHeader
          title={firstName ? `${greeting()}, ${firstName}` : 'Dashboard'}
          description="Your pipeline at a glance, from first application to signed offer."
          actions={
            <button onClick={openCreate} className="btn btn-primary">
              <span aria-hidden="true">+</span> Add application
            </button>
          }
        />

        {applications && (
          <OverviewStats
            applications={applications}
            resumes={resumes ?? []}
            contacts={contacts ?? []}
          />
        )}

        {isLoading && <LoadingSpinner label="Loading applications…" />}
        {isError && (
          <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            Couldn&apos;t reach the API: {(error as Error).message}
          </div>
        )}
        {applications && applications.length === 0 && (
          <EmptyState
            title="No applications yet"
            description="Add the first role you've applied to and it will show up on your board."
            action={
              <button onClick={openCreate} className="btn btn-primary">
                Add your first application
              </button>
            }
          />
        )}
        {applications && applications.length > 0 && (
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
