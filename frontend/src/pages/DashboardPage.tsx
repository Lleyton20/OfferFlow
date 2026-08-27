import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from '../api/applications'
import { ApplicationBoard } from '../components/ApplicationBoard'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { useAuth } from '../context/AuthContext'
import type { Application, ApplicationInput } from '../types/application'

export function DashboardPage() {
  const { user, logout } = useAuth()
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
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-white">OfferFlow</h1>
            <p className="text-sm text-slate-500">From Application to Offer.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/resumes" className="text-sm text-slate-400 transition hover:text-slate-200">
              Resumes
            </Link>
            <Link to="/contacts" className="text-sm text-slate-400 transition hover:text-slate-200">
              Contacts
            </Link>
            {user && <span className="text-sm text-slate-400">{user.email}</span>}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setModalState({ mode: 'create' })}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
            >
              + Add Application
            </motion.button>
            <button
              onClick={() => logout()}
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {isLoading && <p className="text-slate-500">Loading applications…</p>}
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
