import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import { tailorResume } from '../api/resumes'
import type { Resume } from '../types/resume'
import { LoadingSpinner } from './LoadingSpinner'

function scoreChip(score: number) {
  if (score >= 80) return 'chip-brand'
  if (score >= 50) return 'chip-warning'
  return 'chip-danger'
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="eyebrow mb-2">{title}</h4>
      {children}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-sm text-ink-soft marker:text-faint">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function KeywordList({ keywords, tone }: { keywords: string[]; tone: 'brand' | 'danger' | 'neutral' }) {
  if (keywords.length === 0) return <span className="text-xs text-muted">None</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((k) => (
        <span key={k} className={`chip chip-${tone}`}>
          {k}
        </span>
      ))}
    </div>
  )
}

interface ResumeCardProps {
  resume: Resume
  onDelete: (resume: Resume) => void
  index?: number
}

export function ResumeCard({ resume, onDelete, index = 0 }: ResumeCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [tailorJD, setTailorJD] = useState('')
  const tailorMutation = useMutation({
    mutationFn: (jobDescription: string) => tailorResume(resume.id, jobDescription),
  })

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
          <p className="truncate font-medium text-ink">{resume.filename}</p>
          <p className="mt-0.5 text-xs text-muted">
            Uploaded {new Date(resume.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className={`chip ${scoreChip(resume.ats_score)} px-2.5 py-1 text-sm tabular-nums`}>
            {resume.ats_score}
            <span className="font-normal opacity-70">/100</span>
          </span>
          <button onClick={() => onDelete(resume)} className="link-danger text-xs font-medium">
            Delete
          </button>
        </div>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="link mt-4 text-xs"
      >
        {expanded ? 'Hide details' : 'View ATS breakdown and AI feedback'}
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
              <Section title="ATS checks">
                <ul className="space-y-2">
                  {resume.ats_checks.map((check) => (
                    <li key={check.check} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          check.passed ? 'bg-brand-50 text-brand-700' : 'bg-danger-soft text-danger'
                        }`}
                        aria-label={check.passed ? 'Passed' : 'Failed'}
                      >
                        {check.passed ? '✓' : '✕'}
                      </span>
                      <span className="text-ink-soft">
                        <span className="font-medium text-ink">{check.check}.</span> {check.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              {(resume.matched_keywords.length > 0 || resume.missing_keywords.length > 0) && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <Section title="Matched keywords">
                    <KeywordList keywords={resume.matched_keywords} tone="brand" />
                  </Section>
                  <Section title="Missing keywords">
                    <KeywordList keywords={resume.missing_keywords} tone="danger" />
                  </Section>
                </div>
              )}

              <Section title="AI feedback">
                {resume.ai_feedback_status === 'ok' && resume.ai_feedback && (
                  <div className="space-y-4 text-sm">
                    <p className="text-ink-soft">{resume.ai_feedback.overall_summary}</p>
                    <div>
                      <p className="mb-1 font-medium text-ink">Strengths</p>
                      <BulletList items={resume.ai_feedback.strengths} />
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-ink">Weaknesses</p>
                      <BulletList items={resume.ai_feedback.weaknesses} />
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-ink">Suggestions</p>
                      <BulletList items={resume.ai_feedback.suggestions} />
                    </div>
                  </div>
                )}
                {resume.ai_feedback_status === 'not_configured' && (
                  <p className="text-sm text-muted">
                    AI feedback isn&apos;t configured. Set{' '}
                    <code className="font-mono text-xs text-ink">ANTHROPIC_API_KEY</code> on the
                    backend to enable it.
                  </p>
                )}
                {resume.ai_feedback_status === 'requires_account' && (
                  <p className="text-sm text-muted">
                    AI feedback is available with a free account. The ATS checks above work in the demo.
                  </p>
                )}
                {resume.ai_feedback_status === 'error' && (
                  <p className="text-sm text-muted">AI feedback was temporarily unavailable for this upload.</p>
                )}
              </Section>

              <div className="border-t border-line pt-5">
                <Section title="Tailor for a job">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <textarea
                      placeholder="Paste a job description to tailor this resume toward"
                      rows={2}
                      value={tailorJD}
                      onChange={(e) => setTailorJD(e.target.value)}
                      aria-label="Job description to tailor toward"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => tailorJD.trim() && tailorMutation.mutate(tailorJD.trim())}
                      disabled={!tailorJD.trim() || tailorMutation.isPending}
                      className="btn btn-secondary self-start"
                    >
                      Tailor
                    </button>
                  </div>
                </Section>

                {tailorMutation.error && (
                  <p className="mt-3 text-sm text-muted">
                    {tailorMutation.error instanceof ApiError
                      ? tailorMutation.error.message
                      : 'Tailoring was temporarily unavailable. Try again.'}
                  </p>
                )}

                {tailorMutation.isPending && (
                  <div className="mt-3">
                    <LoadingSpinner label="Tailoring…" />
                  </div>
                )}

                {tailorMutation.data && (
                  <div className="well mt-4 space-y-4 p-4 text-sm">
                    {tailorMutation.data.status === 'ok' && tailorMutation.data.suggestions ? (
                      <>
                        <div>
                          <p className="mb-1 font-medium text-ink">Rewritten summary</p>
                          <p className="text-ink-soft">{tailorMutation.data.suggestions.summary_rewrite}</p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium text-ink">Bullets to emphasize</p>
                          <BulletList items={tailorMutation.data.suggestions.bullets_to_emphasize} />
                        </div>
                        <div>
                          <p className="mb-1.5 font-medium text-ink">Keywords to add</p>
                          <KeywordList keywords={tailorMutation.data.suggestions.keywords_to_add} tone="neutral" />
                        </div>
                        <p className="text-ink-soft">{tailorMutation.data.suggestions.overall_advice}</p>
                      </>
                    ) : (
                      <p className="text-muted">
                        {tailorMutation.data.status === 'not_configured'
                          ? "AI tailoring isn't configured. Set ANTHROPIC_API_KEY on the backend to enable it."
                          : 'Tailoring was temporarily unavailable. Try again.'}
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
