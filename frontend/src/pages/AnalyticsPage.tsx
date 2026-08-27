import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { getApplications } from '../api/applications'
import { getContacts } from '../api/contacts'
import { getInterviewSessions } from '../api/interviews'
import { getResumes } from '../api/resumes'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { AppHeader } from '../components/AppHeader'
import { StatusBarChart } from '../components/charts/StatusBarChart'
import { TrendChart } from '../components/charts/TrendChart'
import { STATUS_COLORS, STATUS_COLOR_FALLBACK } from '../lib/statusColors'
import { APPLICATION_STATUSES } from '../types/application'

const CLOSED = new Set(['Offer', 'Rejected'])

function StatTile({ label, value, suffix = '', accent }: { label: string; value: number; suffix?: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-gradient-to-br p-4 ring-1 ring-inset ${accent}`}
    >
      <p className="text-2xl font-semibold text-white">
        <AnimatedNumber value={value} />
        {suffix}
      </p>
      <p className="mt-0.5 text-xs font-medium text-slate-300">{label}</p>
    </motion.div>
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

  const apps = applications ?? []
  const allResumes = resumes ?? []
  const allContacts = contacts ?? []
  const allInterviews = interviews ?? []

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
    <div className="aurora-bg aurora-bg-subtle min-h-screen bg-slate-950">
      <AppHeader active="analytics" subtitle="Career analytics" />

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total applications" value={stats.total} accent="from-teal-500/20 to-teal-500/5 ring-teal-500/30" />
          <StatTile label="Offer rate" value={stats.offerRate} suffix="%" accent="from-emerald-500/20 to-emerald-500/5 ring-emerald-500/30" />
          <StatTile label="Rejection rate" value={stats.rejectionRate} suffix="%" accent="from-red-500/20 to-red-500/5 ring-red-500/30" />
          <StatTile label="Avg. resume score" value={stats.avgScore} suffix="/100" accent="from-sky-500/20 to-sky-500/5 ring-sky-500/30" />
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-white">Applications by status</h2>
            <p className="mb-4 mt-0.5 text-xs text-slate-500">
              Pipeline stages darken as they progress; offers and rejections are reserved colors.
            </p>
            {stats.total > 0 ? (
              <StatusBarChart data={statusBreakdown} />
            ) : (
              <p className="text-sm text-slate-500">No applications yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-white">Applications over time</h2>
            <p className="mb-4 mt-0.5 text-xs text-slate-500">Count of applications by month applied.</p>
            <TrendChart data={applicationsOverTime} color="#3987e5" ariaLabel="Applications per month" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-white">Resume score trend</h2>
            <p className="mb-4 mt-0.5 text-xs text-slate-500">ATS score of each resume, in upload order.</p>
            <TrendChart data={resumeScoreTrend} color="#d95926" valueSuffix="/100" ariaLabel="Resume ATS score trend" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-white">Networking effectiveness</h2>
            <p className="mb-4 mt-0.5 text-xs text-slate-500">How your network is helping the search.</p>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Contacts" value={allContacts.length} accent="from-teal-500/20 to-teal-500/5 ring-teal-500/30" />
              <StatTile label="Conversations logged" value={stats.totalInteractions} accent="from-emerald-500/20 to-emerald-500/5 ring-emerald-500/30" />
              <StatTile label="Overdue follow-ups" value={stats.overdue} accent="from-amber-500/20 to-amber-500/5 ring-amber-500/30" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-white">Interview performance</h2>
            <p className="mb-4 mt-0.5 text-xs text-slate-500">How prep is translating into interviews.</p>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Upcoming" value={stats.upcomingInterviews} accent="from-sky-500/20 to-sky-500/5 ring-sky-500/30" />
              <StatTile label="Completed" value={stats.completedInterviews} accent="from-teal-500/20 to-teal-500/5 ring-teal-500/30" />
              <StatTile label="Avg. rating" value={stats.avgPerformance} suffix="/5" accent="from-amber-500/20 to-amber-500/5 ring-amber-500/30" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
