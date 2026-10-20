import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { updatePreferences } from '../api/auth'
import {
  clearJobInteraction,
  dismissJob,
  getDiscoveryStats,
  getRecommendations,
  getSavedJobs,
  saveJob,
} from '../api/jobs'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { KeywordEditor } from '../components/KeywordEditor'
import { PageHeader } from '../components/PageHeader'
import { ListSkeleton } from '../components/Skeleton'
import { useToast } from '../components/useToast'
import { useAuth } from '../context/useAuth'
import { timeAgo } from '../lib/time'
import { JOB_TYPE_LABELS, type JobPosting, type JobType, type Recommendation } from '../types/job'

type Tab = 'for-you' | JobType | 'saved'

const TABS: { key: Tab; label: string }[] = [
  { key: 'for-you', label: 'For you' },
  { key: 'internship', label: 'Internships' },
  { key: 'new_grad', label: 'New grad' },
  { key: 'fellowship', label: 'Fellowships' },
  { key: 'saved', label: 'Saved' },
]

function CompanyMark({ company }: { company: string }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-sm font-semibold text-ink-soft ring-1 ring-inset ring-line"
      aria-hidden="true"
    >
      {company.slice(0, 1).toUpperCase()}
    </span>
  )
}

interface JobCardProps {
  job: JobPosting
  reasons?: string[]
  saved: boolean
  index: number
  onToggleSave: () => void
  onDismiss?: () => void
}

function JobCard({ job, reasons = [], saved, index, onToggleSave, onDismiss }: JobCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.2, 0.8, 0.2, 1] },
      }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="card flex gap-4 p-5 transition-shadow duration-200 hover:shadow-lift"
    >
      <CompanyMark company={job.company} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink">{job.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {job.company}
              {job.location && <span> · {job.location}</span>}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted">{timeAgo(job.posted_at ?? job.first_seen_at)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="chip chip-neutral">{JOB_TYPE_LABELS[job.job_type]}</span>
          {job.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="chip chip-neutral">
              {tag}
            </span>
          ))}
          {reasons.map((reason) => (
            <span key={reason} className="chip chip-brand">
              {reason}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={job.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
            Apply <span aria-hidden="true">↗</span>
          </a>
          <button onClick={onToggleSave} className="btn btn-secondary btn-sm" aria-pressed={saved}>
            {saved ? 'Saved' : 'Save'}
          </button>
          {onDismiss && (
            <button onClick={onDismiss} className="btn btn-ghost btn-sm">
              Not interested
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function DiscoverPage() {
  const { user, setUser } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('for-you')

  const jobType = tab === 'for-you' || tab === 'saved' ? undefined : tab
  const recommendations = useQuery({
    queryKey: ['recommendations', jobType ?? 'all'],
    queryFn: () => getRecommendations(jobType),
    enabled: tab !== 'saved',
  })
  const saved = useQuery({ queryKey: ['saved-jobs'], queryFn: getSavedJobs })
  const stats = useQuery({ queryKey: ['discovery-stats'], queryFn: getDiscoveryStats })

  const savedIds = new Set((saved.data ?? []).map((job) => job.id))

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
  }

  const toggleSave = useMutation({
    mutationFn: (job: JobPosting) => (savedIds.has(job.id) ? clearJobInteraction(job.id) : saveJob(job.id)),
    onSuccess: (_, job) => {
      toast.show(savedIds.has(job.id) ? 'Removed from saved' : `Saved ${job.company}`)
      refresh()
    },
  })

  const dismiss = useMutation({
    mutationFn: (job: JobPosting) => dismissJob(job.id),
    onMutate: async (job) => {
      // Remove the card immediately so the exit animation plays without waiting on the API.
      queryClient.setQueriesData<Recommendation[]>({ queryKey: ['recommendations'] }, (current) =>
        current?.filter((r) => r.job.id !== job.id),
      )
    },
    onSuccess: () => toast.show('Hidden from your recommendations'),
    onSettled: refresh,
  })

  const preferences = useMutation({
    mutationFn: (job_keywords: string[]) => updatePreferences({ job_keywords }),
    onSuccess: (updated) => {
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  const isLoading = tab === 'saved' ? saved.isLoading : recommendations.isLoading
  const items: { job: JobPosting; reasons: string[] }[] =
    tab === 'saved'
      ? (saved.data ?? []).map((job) => ({ job, reasons: [] }))
      : (recommendations.data ?? []).map((r) => ({ job: r.job, reasons: r.reasons }))

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="discover" />

      <main className="page max-w-4xl">
        <PageHeader
          title="Discover"
          description="Fresh internships, new-grad roles and fellowships from company job boards, ranked for you."
        />

        <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card">
          {[
            { label: 'Open roles tracked', value: stats.data?.active ?? 0 },
            { label: 'New this week', value: stats.data?.new_this_week ?? 0 },
            { label: 'Saved', value: saved.data?.length ?? 0 },
          ].map((tile) => (
            <div key={tile.label} className="bg-surface px-5 py-4">
              <p className="text-xs font-medium text-muted">{tile.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-ink">
                <AnimatedNumber value={tile.value} />
              </p>
            </div>
          ))}
        </div>

        <section className="card mb-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Your interests</h2>
            <p className="text-xs text-muted">
              Also learned from your resume and the roles you apply to.
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-line-strong px-2 py-1.5 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10">
            <KeywordEditor
              keywords={user?.job_keywords ?? []}
              onChange={(keywords) => preferences.mutate(keywords)}
              disabled={preferences.isPending}
            />
          </div>
        </section>

        <div
          className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-subtle p-1 sm:inline-flex"
          role="tablist"
          aria-label="Filter openings"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="discover-tab"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-md bg-surface shadow-xs"
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {isLoading && <ListSkeleton rows={4} />}
        {!isLoading && items.length === 0 && (
          <EmptyState
            title={tab === 'saved' ? 'Nothing saved yet' : 'No matches right now'}
            description={
              tab === 'saved'
                ? 'Save openings here to come back to them later.'
                : stats.data?.active
                  ? 'Try adding a few interests above, or check another tab.'
                  : 'Openings appear after the first job refresh runs.'
            }
          />
        )}

        <div className="space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map(({ job, reasons }, index) => (
              <JobCard
                key={`${tab}-${job.id}`}
                job={job}
                reasons={reasons}
                index={index}
                saved={savedIds.has(job.id)}
                onToggleSave={() => toggleSave.mutate(job)}
                onDismiss={tab === 'saved' ? undefined : () => dismiss.mutate(job)}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
