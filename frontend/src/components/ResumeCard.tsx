import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { tailorResume } from '../api/resumes'
import type { Resume } from '../types/resume'
import { LoadingSpinner } from './LoadingSpinner'

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
  const [tailorJD, setTailorJD] = useState('')
  const tailorMutation = useMutation({
    mutationFn: (jobDescription: string) => tailorResume(resume.id, jobDescription),
  })

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

              <div className="border-t border-slate-800 pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tailor For A Job
                </h4>
                <div className="flex gap-2">
                  <textarea
                    placeholder="Paste a job description to tailor this resume toward…"
                    rows={2}
                    value={tailorJD}
                    onChange={(e) => setTailorJD(e.target.value)}
                    className="flex-1 rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    onClick={() => tailorJD.trim() && tailorMutation.mutate(tailorJD.trim())}
                    disabled={!tailorJD.trim() || tailorMutation.isPending}
                    className="self-start rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Tailor
                  </button>
                </div>

                {tailorMutation.isPending && (
                  <div className="mt-3">
                    <LoadingSpinner label="Tailoring…" />
                  </div>
                )}

                {tailorMutation.data && (
                  <div className="mt-3 space-y-2 rounded-lg bg-slate-950/50 p-3 text-sm">
                    {tailorMutation.data.status === 'ok' && tailorMutation.data.suggestions ? (
                      <>
                        <div>
                          <p className="font-medium text-emerald-400">Rewritten Summary</p>
                          <p className="text-slate-300">
                            {tailorMutation.data.suggestions.summary_rewrite}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-sky-400">Bullets To Emphasize</p>
                          <ul className="ml-4 list-disc text-slate-400">
                            {tailorMutation.data.suggestions.bullets_to_emphasize.map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-amber-400">Keywords To Add</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {tailorMutation.data.suggestions.keywords_to_add.map((k) => (
                              <span
                                key={k}
                                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-400">{tailorMutation.data.suggestions.overall_advice}</p>
                      </>
                    ) : (
                      <p className="text-slate-500">
                        {tailorMutation.data.status === 'not_configured'
                          ? "AI tailoring isn't configured — set ANTHROPIC_API_KEY on the backend to enable it."
                          : 'Tailoring was temporarily unavailable — try again.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
