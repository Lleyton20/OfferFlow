import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { getApplications } from '../api/applications'
import { getContacts } from '../api/contacts'
import { getInterviewSessions } from '../api/interviews'
import { getResumes } from '../api/resumes'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { AppHeader } from '../components/AppHeader'
import { StatusBarChart } from '../components/charts/StatusBarChart'
import { TrendChart } from '../components/charts/TrendChart'
import { PageHeader } from '../components/PageHeader'
import { STATUS_COLORS, STATUS_COLOR_FALLBACK } from '../lib/statusColors'
import { APPLICATION_STATUSES } from '../types/application'

const CLOSED = new Set(['Offer', 'Rejected'])

function StatTile({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-surface p-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums text-ink">
        <AnimatedNumber value={value} />
        {suffix && <span className="ml-0.5 text-base font-medium text-faint">{suffix}</span>}
      </p>
    </div>
  )
}

function MiniStat({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="well px-4 py-3">
      <p className="text-xl font-semibold tracking-tight tabular-nums text-ink">
        <AnimatedNumber value={value} />
        {suffix && <span className="text-sm font-medium text-faint">{suffix}</span>}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-5"
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 mb-5 text-xs text-muted">{description}</p>
      {children}
    </motion.section>
  )
}

function monthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export function AnalyticsPage() {
  const { data: applications } = useQuery({ queryKey: ['applications'], queryFn: getApplications })
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const { data: contacts } = useQuery({ queryKey: ['contacts'], queryFn: getContacts })
  const { data: interviews } = useQuery({ queryKey: ['interviews'], queryFn: getInterviewSessions })

  const apps = useMemo(() => applications ?? [], [applications])
  const allResumes = useMemo(() => resumes ?? [], [resumes])
  const allContacts = useMemo(() => contacts ?? [], [contacts])
  const allInterviews = useMemo(() => interviews ?? [], [interviews])

  const stats = useMemo(() => {
    const total = apps.length
    const offers = apps.filter((a) => a.status === 'Offer').length
    const rejected = apps.filter((a) => a.status === 'Rejected').length
    const active = apps.filter((a) => !CLOSED.has(a.status)).length
    const avgScore = allResumes.length
      ? Math.round(allResumes.reduce((sum, r) => sum + r.ats_score, 0) / allResumes.length)
      : 0
    const today = new Date().toISOString().slice(0, 10)
    const overdue = allContacts.filter((c) => c.follow_up_date && c.follow_up_date < today).length
    const totalInteractions = allContacts.reduce((sum, c) => sum + c.interactions.length, 0)

    const completedInterviews = allInterviews.filter((i) => i.status === 'Completed')
    const ratedInterviews = completedInterviews.filter((i) => i.performance_rating != null)
    // Rounded to a whole star — ratings are 1-5 integers (no half-stars in the UI),
    // and AnimatedNumber rounds to an integer anyway, so a decimal here would be
    // silently truncated at render time.
    const avgPerformance = ratedInterviews.length
      ? Math.round(
          ratedInterviews.reduce((sum, i) => sum + (i.performance_rating ?? 0), 0) /
            ratedInterviews.length,
        )
      : 0
    const upcomingInterviews = allInterviews.filter((i) => i.status === 'Scheduled').length

    return {
      total,
      offers,
      rejected,
      active,
      offerRate: total ? Math.round((offers / total) * 100) : 0,
      rejectionRate: total ? Math.round((rejected / total) * 100) : 0,
      avgScore,
      overdue,
      totalInteractions,
      completedInterviews: completedInterviews.length,
      avgPerformance,
      upcomingInterviews,
    }
  }, [apps, allResumes, allContacts, allInterviews])

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const status of APPLICATION_STATUSES) counts.set(status, 0)
    let other = 0
    for (const app of apps) {
      if (counts.has(app.status)) {
        counts.set(app.status, counts.get(app.status)! + 1)
      } else {
        other += 1
      }
    }
    const bars = [...counts.entries()].map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] ?? STATUS_COLOR_FALLBACK,
    }))
    if (other > 0) bars.push({ label: 'Other', value: other, color: STATUS_COLOR_FALLBACK })
    return bars
  }, [apps])

  const applicationsOverTime = useMemo(() => {
    const counts = new Map<string, number>()
    for (const app of apps) {
      const month = app.date_applied.slice(0, 7)
      counts.set(month, (counts.get(month) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ label: monthLabel(month), value }))
  }, [apps])

  const resumeScoreTrend = useMemo(() => {
    return [...allResumes]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((r, i) => ({ label: `#${i + 1}`, value: r.ats_score }))
  }, [allResumes])

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="analytics" />

      <main className="page">
        <PageHeader
          title="Analytics"
          description="How your search is converting, computed from your own data."
        />

        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card lg:grid-cols-4">
          <StatTile label="Total applications" value={stats.total} />
          <StatTile label="Offer rate" value={stats.offerRate} suffix="%" />
          <StatTile label="Rejection rate" value={stats.rejectionRate} suffix="%" />
          <StatTile label="Avg. resume score" value={stats.avgScore} suffix="/100" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Applications by status"
            description="Pipeline stages darken as they progress. Offers and rejections use reserved colors."
          >
            {stats.total > 0 ? (
              <StatusBarChart data={statusBreakdown} />
            ) : (
              <p className="text-sm text-muted">No applications yet.</p>
            )}
          </Panel>

          <Panel title="Applications over time" description="Applications submitted per month.">
            <TrendChart data={applicationsOverTime} color="#0f7a45" ariaLabel="Applications per month" />
          </Panel>

          <Panel title="Resume score trend" description="ATS score of each resume, in upload order.">
            <TrendChart data={resumeScoreTrend} color="#2a2f2c" valueSuffix="/100" ariaLabel="Resume ATS score trend" />
          </Panel>

          <Panel title="Networking" description="How your network is supporting the search.">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Contacts" value={allContacts.length} />
              <MiniStat label="Conversations" value={stats.totalInteractions} />
              <MiniStat label="Overdue" value={stats.overdue} />
            </div>
          </Panel>

          <Panel title="Interview performance" description="How preparation is translating into interviews.">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Upcoming" value={stats.upcomingInterviews} />
              <MiniStat label="Completed" value={stats.completedInterviews} />
              <MiniStat label="Avg. rating" value={stats.avgPerformance} suffix="/5" />
            </div>
          </Panel>
        </div>
      </main>
    </div>
  )
}
