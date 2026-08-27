import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { getApplications } from '../api/applications'
import {
  createInterviewSession,
  deleteInterviewSession,
  generateMockQuestions,
  getInterviewSessions,
  updateInterviewSession,
} from '../api/interviews'
import { AppHeader } from '../components/AppHeader'
import { InterviewFormModal } from '../components/InterviewFormModal'
import { InterviewSessionCard } from '../components/InterviewSessionCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { QUESTION_BANK, type BankQuestion } from '../lib/questionBank'
import type { InterviewSession, InterviewSessionInput, InterviewSessionPatch } from '../types/interview'

const CATEGORIES: BankQuestion['category'][] = [
  'Behavioral',
  'Situational',
  'Culture Fit',
  'Technical Fundamentals',
]

function QuestionBank() {
  const [category, setCategory] = useState<BankQuestion['category'] | 'All'>('All')
  const filtered = QUESTION_BANK.filter((q) => category === 'All' || q.category === category)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-sm font-semibold text-white">Question Bank</h2>
      <p className="mb-3 mt-0.5 text-xs text-slate-500">
        Common questions to practice, with a tip on what a strong answer covers.
      </p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              category === c
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {filtered.map((q) => (
          <li key={q.question} className="rounded-lg bg-slate-950/50 p-3 text-sm">
            <p className="text-slate-200">{q.question}</p>
            <p className="mt-1 text-xs text-slate-500">💡 {q.tip}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function InterviewPrepPage() {
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<
    { mode: 'create' } | { mode: 'edit'; session: InterviewSession } | null
  >(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: getInterviewSessions,
  })
  const { data: applications } = useQuery({ queryKey: ['applications'], queryFn: getApplications })
  const applicationById = new Map((applications ?? []).map((a) => [a.id, a]))

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['interviews'] })

  const createMutation = useMutation({
    mutationFn: createInterviewSession,
    onSuccess: () => {
      invalidate()
      setModalState(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InterviewSessionPatch }) =>
      updateInterviewSession(id, data),
    onSuccess: () => {
      invalidate()
      setModalState(null)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteInterviewSession, onSuccess: invalidate })

  const generateMutation = useMutation({
    mutationFn: generateMockQuestions,
    onMutate: (id) => setGeneratingId(id),
    onSettled: () => setGeneratingId(null),
    onSuccess: invalidate,
  })

  function handleSubmit(data: InterviewSessionInput) {
    if (modalState?.mode === 'edit') {
      updateMutation.mutate({ id: modalState.session.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="aurora-bg aurora-bg-subtle min-h-screen bg-slate-950">
      <AppHeader
        active="interviews"
        subtitle="Interview prep"
        actions={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalState({ mode: 'create' })}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            + New Interview Prep
          </motion.button>
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <QuestionBank />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Your Interview Sessions
            </h2>
            {isLoading && <LoadingSpinner label="Loading interviews…" />}
            {sessions && sessions.length === 0 && (
              <p className="text-sm text-slate-500">
                No interview prep sessions yet — add one, optionally linked to an application.
              </p>
            )}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {sessions?.map((session) => (
                  <InterviewSessionCard
                    key={session.id}
                    session={session}
                    linkedApplication={
                      session.application_id ? applicationById.get(session.application_id) : undefined
                    }
                    onEdit={(s) => setModalState({ mode: 'edit', session: s })}
                    onDelete={(s) => {
                      if (confirm(`Delete "${s.title}"?`)) deleteMutation.mutate(s.id)
                    }}
                    onStatusChange={(s, status) => updateMutation.mutate({ id: s.id, data: { status } })}
                    onRate={(s, rating) =>
                      updateMutation.mutate({ id: s.id, data: { performance_rating: rating } })
                    }
                    onNotesChange={(s, notes) =>
                      updateMutation.mutate({ id: s.id, data: { performance_notes: notes } })
                    }
                    onGenerateQuestions={(s) => generateMutation.mutate(s.id)}
                    isGenerating={generatingId === session.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {modalState && (
          <InterviewFormModal
            initial={modalState.mode === 'edit' ? modalState.session : undefined}
            onSubmit={handleSubmit}
            onClose={() => setModalState(null)}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
