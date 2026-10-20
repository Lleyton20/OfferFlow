import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { Application } from '../types/application'
import { INTERVIEW_STATUSES, type InterviewSession } from '../types/interview'
import { LoadingSpinner } from './LoadingSpinner'
import { StarRating } from './StarRating'

interface InterviewSessionCardProps {
  session: InterviewSession
  linkedApplication?: Application
  onEdit: (session: InterviewSession) => void
  onDelete: (session: InterviewSession) => void
  onStatusChange: (session: InterviewSession, status: string) => void
  onRate: (session: InterviewSession, rating: number) => void
  onNotesChange: (session: InterviewSession, notes: string) => void
  onGenerateQuestions: (session: InterviewSession) => void
  isGenerating: boolean
  index?: number
}

export function InterviewSessionCard({
  session,
  linkedApplication,
  onEdit,
  onDelete,
  onStatusChange,
  onRate,
  onNotesChange,
  onGenerateQuestions,
  isGenerating,
  index = 0,
}: InterviewSessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(session.performance_notes ?? '')

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
          <p className="font-medium text-ink">{session.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {session.interview_type}
            {linkedApplication && (
              <span> · {linkedApplication.company}</span>
            )}
            {session.scheduled_date && <span> · {session.scheduled_date}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
          <select
            value={session.status}
            onChange={(e) => onStatusChange(session, e.target.value)}
            aria-label="Interview status"
            className="input input-sm w-auto py-1"
          >
            {INTERVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => onEdit(session)}
            className="link-muted"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(session)}
            className="link-danger"
          >
            Delete
          </button>
        </div>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="link mt-4 text-xs"
      >
        {expanded ? 'Hide details' : 'View prep, mock questions and performance'}
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
            <div className="mt-4 space-y-6 border-t border-line pt-5">
              {session.prep_notes && (
                <div>
                  <h4 className="eyebrow mb-1.5">
                    Study plan
                  </h4>
                  <p className="whitespace-pre-line text-sm text-ink-soft">{session.prep_notes}</p>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="eyebrow">
                    Mock questions
                  </h4>
                  <button
                    onClick={() => onGenerateQuestions(session)}
                    disabled={isGenerating}
                    className="btn btn-secondary btn-sm"
                  >
                    {session.mock_questions.length > 0 ? 'Regenerate' : 'Generate with AI'}
                  </button>
                </div>
                {isGenerating && <LoadingSpinner label="Generating questions…" />}
                {!isGenerating && session.mock_questions.length > 0 && (
                  <ul className="space-y-2">
                    {session.mock_questions.map((q) => (
                      <li key={q.question} className="well p-3 text-sm">
                        <p className="font-medium text-ink">{q.question}</p>
                        <p className="mt-1 text-xs text-muted">
                          <span className="font-medium text-ink-soft">Tip:</span> {q.tip}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {!isGenerating && session.mock_questions.length === 0 && (
                  <p className="text-sm text-muted">
                    {session.ai_feedback_status === 'not_configured'
                      ? "AI question generation isn't configured. Set ANTHROPIC_API_KEY on the backend to enable it."
                      : 'No questions yet. Generate a set to practice with.'}
                  </p>
                )}
              </div>

              <div>
                <h4 className="eyebrow mb-2">
                  Performance
                </h4>
                <div className="flex items-center gap-3">
                  <StarRating value={session.performance_rating} onChange={(r) => onRate(session, r)} />
                  <span className="text-xs text-muted">How do you think it went?</span>
                </div>
                <textarea
                  placeholder="What went well, and what to improve next time"
                  aria-label="Reflection notes"
                  rows={2}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => {
                    if (notesDraft !== (session.performance_notes ?? '')) {
                      onNotesChange(session, notesDraft)
                    }
                  }}
                  className="input mt-3"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
