import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { Resume } from '../types/resume'

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10'
  if (score >= 50) return 'text-amber-400 bg-amber-500/10'
  return 'text-red-400 bg-red-500/10'
}

interface ResumeCardProps {
  resume: Resume
  onDelete: (resume: Resume) => void
}

export function ResumeCard({ resume, onDelete }: ResumeCardProps) {
  const [expanded, setExpanded] = useState(false)

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
          <p className="font-medium text-white">{resume.filename}</p>
          <p className="text-xs text-slate-500">
            Uploaded {new Date(resume.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreColor(resume.ats_score)}`}>
            {resume.ats_score}/100
          </span>
          <button
            onClick={() => onDelete(resume)}
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
        {expanded ? 'Hide details' : 'Show ATS breakdown & AI feedback'}
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
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ATS Checks
                </h4>
                <ul className="space-y-1.5">
                  {resume.ats_checks.map((check) => (
                    <li key={check.check} className="flex items-start gap-2 text-sm">
                      <span className={check.passed ? 'text-emerald-400' : 'text-red-400'}>
                        {check.passed ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-300">
                        <span className="font-medium text-slate-200">{check.check}:</span>{' '}
                        {check.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {(resume.matched_keywords.length > 0 || resume.missing_keywords.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Matched Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.matched_keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"
                        >
                          {k}
                        </span>
                      ))}
                      {resume.matched_keywords.length === 0 && (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Missing Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.missing_keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                        >
                          {k}
                        </span>
                      ))}
                      {resume.missing_keywords.length === 0 && (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  AI Feedback
                </h4>
                {resume.ai_feedback_status === 'ok' && resume.ai_feedback && (
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>{resume.ai_feedback.overall_summary}</p>
                    <div>
                      <p className="font-medium text-emerald-400">Strengths</p>
                      <ul className="ml-4 list-disc text-slate-400">
                        {resume.ai_feedback.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-amber-400">Weaknesses</p>
                      <ul className="ml-4 list-disc text-slate-400">
                        {resume.ai_feedback.weaknesses.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-sky-400">Suggestions</p>
                      <ul className="ml-4 list-disc text-slate-400">
                        {resume.ai_feedback.suggestions.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {resume.ai_feedback_status === 'not_configured' && (
                  <p className="text-sm text-slate-500">
                    AI feedback isn&apos;t configured — set <code>ANTHROPIC_API_KEY</code> on the
                    backend to enable it.
                  </p>
                )}
                {resume.ai_feedback_status === 'error' && (
                  <p className="text-sm text-slate-500">
                    AI feedback was temporarily unavailable for this upload.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
