import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from './api/applications'
import { ApplicationBoard } from './components/ApplicationBoard'
import { ApplicationFormModal } from './components/ApplicationFormModal'
import type { Application, ApplicationInput } from './types/application'

function App() {
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<
    { mode: 'create' } | { mode: 'edit'; application: Application } | null
  >(null)

  const { data: applications, isLoading, isError, error } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
  })

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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">OfferFlow</h1>
            <p className="text-sm text-slate-500">From Application to Offer.</p>
          </div>
          <button
            onClick={() => setModalState({ mode: 'create' })}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + Add Application
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {isLoading && <p className="text-slate-500">Loading applications…</p>}
        {isError && (
          <p className="text-red-600">
            Couldn&apos;t reach the API: {(error as Error).message}
          </p>
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

      {modalState && (
        <ApplicationFormModal
          initial={modalState.mode === 'edit' ? modalState.application : undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalState(null)}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

export default App
