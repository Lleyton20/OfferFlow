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
import { ApiError } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { InterviewFormModal } from '../components/InterviewFormModal'
import { InterviewSessionCard } from '../components/InterviewSessionCard'
import { PageHeader } from '../components/PageHeader'
import { ListSkeleton } from '../components/Skeleton'
import { useToast } from '../components/useToast'
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
    <div className="card self-start p-5">
      <h2 className="text-base font-semibold text-ink">Question bank</h2>
      <p className="mt-1 mb-4 text-sm text-muted">
        Common questions, each with a note on what a strong answer covers.
      </p>
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Question category">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`relative rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
              category === c ? 'text-white ring-transparent' : 'bg-surface text-muted ring-line hover:text-ink'
            }`}
          >
            {category === c && (
              <motion.span
                layoutId="question-category"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-full bg-ink"
              />
            )}
            <span className="relative">{c}</span>
          </button>
        ))}
      </div>
      <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {filtered.map((q, i) => (
          <motion.li
            key={`${category}-${q.question}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }}
            className="well p-3 text-sm"
          >
            <p className="font-medium text-ink">{q.question}</p>
            <p className="mt-1 text-xs text-muted">
              <span className="font-medium text-ink-soft">Tip:</span> {q.tip}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export function InterviewPrepPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
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
      toast.show('Interview prep created')
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
    onError: (error) =>
      toast.show(error instanceof ApiError ? error.message : "Couldn't generate questions", 'error'),
  })

  function handleSubmit(data: InterviewSessionInput) {
    if (modalState?.mode === 'edit') {
      updateMutation.mutate({ id: modalState.session.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="interviews" />

      <main className="page">
        <PageHeader
          title="Interview prep"
          description="Plan each interview, practice with AI-generated questions, and reflect afterwards."
          actions={
            <button onClick={() => setModalState({ mode: 'create' })} className="btn btn-primary">
              <span aria-hidden="true">+</span> New interview prep
            </button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <QuestionBank />

          <div>
            <h2 className="eyebrow mb-3">Your interview sessions</h2>
            {isLoading && <ListSkeleton rows={2} />}
            {sessions && sessions.length === 0 && (
              <EmptyState
                title="No interview sessions yet"
                description="Create one for an upcoming interview, optionally linked to an application."
              />
            )}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sessions?.map((session, index) => (
                  <InterviewSessionCard
                    key={session.id}
                    index={index}
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
