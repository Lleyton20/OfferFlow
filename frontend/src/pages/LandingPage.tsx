import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { APPLICATION_STATUSES } from '../types/application'

const FEATURES = [
  {
    title: 'Application Tracking',
    description:
      'A Kanban board across every stage — Applied through Offer — with deadlines, notes, and custom statuses.',
    accent: 'from-emerald-500/20 to-emerald-500/5 ring-emerald-500/30',
  },
  {
    title: 'Resume Intelligence',
    description:
      'Upload a resume and get an explainable ATS score plus AI feedback, scored against a real job description.',
    accent: 'from-sky-500/20 to-sky-500/5 ring-sky-500/30',
  },
  {
    title: 'Networking CRM',
    description:
      'Track recruiters and referrals, log every conversation, and never miss a follow-up date again.',
    accent: 'from-teal-500/20 to-teal-500/5 ring-teal-500/30',
  },
  {
    title: 'Career Analytics',
    description:
      'See conversion rates and offer rates emerge from your own data — no spreadsheet required.',
    accent: 'from-amber-500/20 to-amber-500/5 ring-amber-500/30',
  },
]

const STEPS = [
  { title: 'Log every application', body: 'Company, role, deadline, status — captured in seconds.' },
  { title: 'Keep your network warm', body: 'Recruiters and referrals with follow-up reminders that fire on time.' },
  { title: 'Sharpen your resume', body: 'ATS scoring and AI feedback for every version, against every JD.' },
]

const STUDENT_AVATARS = [
  { initials: 'CS', gradient: 'from-emerald-400 to-teal-500', label: 'Computer Science' },
  { initials: 'BA', gradient: 'from-sky-400 to-emerald-500', label: 'Business' },
  { initials: 'EE', gradient: 'from-amber-400 to-orange-500', label: 'Engineering' },
  { initials: 'DS', gradient: 'from-teal-400 to-sky-500', label: 'Data Science' },
  { initials: 'MK', gradient: 'from-emerald-400 to-sky-500', label: 'Marketing' },
  { initials: 'FIN', gradient: 'from-amber-400 to-teal-500', label: 'Finance' },
]

export function LandingPage() {
  return (
    <div className="aurora-bg min-h-screen overflow-hidden bg-slate-950">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-xl font-bold text-transparent">
          OfferFlow
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center py-16 text-center sm:py-24">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-400"
          >
            From Application to Offer.
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl"
          >
            One place for your{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
              entire job search
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 max-w-xl text-base text-slate-400 sm:text-lg"
          >
            OfferFlow replaces the spreadsheet-plus-seven-tabs chaos of internship and new-grad
            recruiting with one connected system — applications, resumes, and your network, all
            talking to each other.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/register"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
            >
              Create your free account
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              I already have one
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 flex w-full flex-wrap items-center justify-center gap-2"
          >
            {APPLICATION_STATUSES.map((status, i) => (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.06 }}
                className="flex items-center gap-2"
              >
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    status === 'Offer'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : status === 'Rejected'
                        ? 'border-slate-700 bg-slate-900/60 text-slate-500'
                        : 'border-teal-500/30 bg-teal-500/10 text-teal-200'
                  }`}
                >
                  {status}
                </span>
                {i < APPLICATION_STATUSES.length - 1 && <span className="text-slate-700">→</span>}
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/40 px-6 py-10 sm:px-10"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200"
              whileHover={{ scale: 1.04 }}
            >
              <motion.span
                animate={{ rotate: [0, -12, 12, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                className="inline-block"
              >
                🐯
              </motion.span>
              Built by a Grambling State Tiger
            </motion.div>
            <p className="max-w-xl text-sm text-slate-400 sm:text-base">
              I built OfferFlow because I was tracking my own internship search across five
              different tools. If you're a student doing the same juggling act, this is for you —
              whatever you're majoring in.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {STUDENT_AVATARS.map((avatar, i) => (
              <motion.div
                key={avatar.initials}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 3 + (i % 3) * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  }}
                  whileHover={{ scale: 1.1 }}
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-lg ${avatar.gradient}`}
                >
                  {avatar.initials}
                </motion.div>
                <span className="text-xs text-slate-500">{avatar.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <section className="py-12 sm:py-16">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="text-center text-2xl font-semibold text-white sm:text-3xl"
          >
            Everything about your search, connected
          </motion.h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-400">
            Four tools that used to live in four different tabs — now one dashboard that knows
            about all of them at once.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`rounded-2xl bg-gradient-to-br p-6 ring-1 ring-inset transition-shadow hover:shadow-xl hover:shadow-black/20 ${feature.accent}`}
              >
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4, borderColor: 'rgba(52, 211, 153, 0.4)' }}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-shadow hover:shadow-xl hover:shadow-black/20"
              >
                <span className="text-sm font-semibold text-emerald-400">0{i + 1}</span>
                <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="mb-20 rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 px-8 py-12 text-center"
        >
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Your search deserves a system, not seven tabs.
          </h2>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Start tracking for free
          </Link>
        </motion.section>
      </main>

      <footer className="relative z-10 border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-slate-500 sm:flex-row">
          <p>OfferFlow — built by Lleyton Magama, Grambling State University.</p>
          <a
            href="https://github.com/lleyton"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-slate-300"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
