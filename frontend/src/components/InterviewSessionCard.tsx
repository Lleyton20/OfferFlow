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
}: InterviewSessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(session.performance_notes ?? '')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{session.title}</p>
          <p className="text-sm text-slate-400">
            {session.interview_type}
            {linkedApplication && (
              <span className="text-slate-500"> · {linkedApplication.company}</span>
            )}
            {session.scheduled_date && <span className="text-slate-500"> · {session.scheduled_date}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={session.status}
            onChange={(e) => onStatusChange(session, e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            {INTERVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => onEdit(session)}
            className="text-xs text-emerald-400 transition hover:text-emerald-300"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(session)}
            className="text-xs text-red-400 transition hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-3 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
      >
        {expanded ? 'Hide details' : 'Show prep, mock questions & performance'}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
              {session.prep_notes && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Study Plan
                  </h4>
                  <p className="whitespace-pre-line text-sm text-slate-400">{session.prep_notes}</p>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mock Questions
                  </h4>
                  <button
                    onClick={() => onGenerateQuestions(session)}
                    disabled={isGenerating}
                    className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300 disabled:opacity-50"
                  >
                    {session.mock_questions.length > 0 ? 'Regenerate' : 'Generate with AI'}
                  </button>
                </div>
                {isGenerating && <LoadingSpinner label="Generating questions…" />}
                {!isGenerating && session.mock_questions.length > 0 && (
                  <ul className="space-y-2">
                    {session.mock_questions.map((q) => (
                      <li key={q.question} className="rounded-lg bg-slate-950/50 p-2.5 text-sm">
                        <p className="text-slate-200">{q.question}</p>
                        <p className="mt-1 text-xs text-slate-500">💡 {q.tip}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {!isGenerating && session.mock_questions.length === 0 && (
                  <p className="text-sm text-slate-500">
                    {session.ai_feedback_status === 'not_configured'
                      ? "AI question generation isn't configured — set ANTHROPIC_API_KEY on the backend to enable it."
                      : 'No questions yet — generate a set to practice with.'}
                  </p>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Performance
                </h4>
                <div className="flex items-center gap-3">
                  <StarRating value={session.performance_rating} onChange={(r) => onRate(session, r)} />
                  <span className="text-xs text-slate-500">How do you think it went?</span>
                </div>
                <textarea
                  placeholder="Reflection notes — what went well, what to improve next time…"
                  rows={2}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => {
                    if (notesDraft !== (session.performance_notes ?? '')) {
                      onNotesChange(session, notesDraft)
                    }
                  }}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
