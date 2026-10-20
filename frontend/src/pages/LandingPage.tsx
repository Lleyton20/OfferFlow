import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { StudentFigure } from '../components/StudentFigure'
import { STATUS_COLORS } from '../lib/statusColors'
import { APPLICATION_STATUSES } from '../types/application'

const REPO_URL = 'https://github.com/Lleyton20/OfferFlow'

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  )
}

const FEATURES = [
  {
    title: 'Application tracking',
    description:
      'A board for every stage from Applied to Offer, with deadlines, notes, referrals and custom statuses.',
    icon: (
      <>
        <rect x="3" y="3.5" width="4" height="13" rx="1" />
        <rect x="8" y="3.5" width="4" height="9" rx="1" />
        <rect x="13" y="3.5" width="4" height="6" rx="1" />
      </>
    ),
  },
  {
    title: 'Resume intelligence',
    description:
      'An explainable ATS score for every version, keyword matching against a real posting, and AI feedback.',
    icon: (
      <>
        <path d="M5 2.5h7l3 3v12H5z" />
        <path d="M8 9.5h4M8 12.5h4M8 6.5h2" />
      </>
    ),
  },
  {
    title: 'Networking CRM',
    description:
      'Recruiters, referrals and alumni with a conversation log and follow-up dates that surface when overdue.',
    icon: (
      <>
        <circle cx="7.5" cy="7" r="2.5" />
        <path d="M3 16c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4" />
        <circle cx="14" cy="8" r="2" />
        <path d="M13.5 12.2c1.8 0 3.1 1.2 3.5 3.3" />
      </>
    ),
  },
  {
    title: 'Interview prep',
    description:
      'A question bank, AI-generated mock questions for each interview, and ratings to track how prep is paying off.',
    icon: (
      <>
        <path d="M3.5 4.5h13v8h-7l-3.5 3v-3H3.5z" />
        <path d="M7 8.5h6" />
      </>
    ),
  },
  {
    title: 'Career assistant',
    description:
      'Ask what to follow up on or how your pipeline looks. Answers are grounded in your own data.',
    icon: (
      <>
        <path d="M10 2.5l1.6 4.4L16 8.5l-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6z" />
        <path d="M15.5 14v3M14 15.5h3" />
      </>
    ),
  },
  {
    title: 'Analytics',
    description:
      'Offer rate, conversion by stage and resume score trends, calculated from what you track. No spreadsheet.',
    icon: (
      <>
        <path d="M3 16.5h14" />
        <path d="M4.5 13l4-4 3 3 4.5-5.5" />
      </>
    ),
  },
]

const STEPS = [
  { title: 'Log every application', body: 'Company, role, date and status, captured in seconds.' },
  { title: 'Keep your network warm', body: 'Follow-up reminders for every recruiter and referral.' },
  { title: 'Sharpen each resume', body: 'ATS scoring and tailored feedback against every posting.' },
]

const STUDENT_FIGURES: {
  pose: 'laptop' | 'walking' | 'celebrating' | 'reading'
  skinTone: string
  outfit: string
  label: string
}[] = [
  { pose: 'laptop', skinTone: '#c68863', outfit: '#0f7a45', label: 'Computer Science' },
  { pose: 'walking', skinTone: '#8d5524', outfit: '#3c413e', label: 'Business' },
  { pose: 'celebrating', skinTone: '#f1c27d', outfit: '#3fa36a', label: 'Engineering' },
  { pose: 'reading', skinTone: '#e0ac69', outfit: '#0a4f2e', label: 'Data Science' },
  { pose: 'laptop', skinTone: '#5c3a21', outfit: '#848a86', label: 'Marketing' },
  { pose: 'walking', skinTone: '#f1c27d', outfit: '#1a8a50', label: 'Finance' },
]

const PREVIEW_COLUMNS = [
  {
    status: 'Applied',
    cards: [
      { company: 'Stripe', role: 'Software Engineer Intern' },
      { company: 'Figma', role: 'Product Design Intern' },
    ],
  },
  { status: 'Recruiter Screen', cards: [{ company: 'Datadog', role: 'SWE Intern', referral: true }] },
  { status: 'Final Round', cards: [{ company: 'Ramp', role: 'Software Engineer, New Grad' }] },
  { status: 'Offer', cards: [{ company: 'Notion', role: 'Software Engineer Intern' }] },
]

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as const },
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay">
      <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 text-xs text-muted">offerflow / dashboard</span>
      </div>
      <div className="grid grid-cols-2 divide-line border-b border-line text-left sm:grid-cols-4 sm:divide-x">
        {[
          ['Active applications', '12'],
          ['Offers', '1'],
          ['Overdue follow-ups', '2'],
          ['Latest resume score', '86'],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-4">
            <p className="text-[11px] font-medium text-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 bg-canvas p-4 text-left sm:grid-cols-4">
        {PREVIEW_COLUMNS.map((column, i) => (
          <div key={column.status} className={`rounded-lg bg-subtle/80 p-2 ${i > 1 ? 'hidden sm:block' : ''}`}>
            <div className="flex items-center gap-1.5 px-1.5 pt-0.5 pb-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[column.status] }} />
              <span className="text-[11px] font-semibold text-ink">{column.status}</span>
            </div>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <div key={card.company} className="rounded-md border border-line bg-surface p-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-ink">{card.company}</p>
                    {'referral' in card && <span className="chip chip-brand px-1.5 text-[10px]">Referral</span>}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">{card.role}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-transparent bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24">
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="chip chip-neutral bg-surface px-3 py-1 shadow-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
              Built for internship and new-grad recruiting
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 max-w-3xl text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] text-ink sm:text-6xl"
            >
              Your entire job search,
              <br />
              <span className="text-brand-600">in one place.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            >
              OfferFlow replaces the spreadsheet and seven open tabs with one connected workspace.
              Your applications, resumes, contacts and interview prep, all aware of each other.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Link to="/register" className="btn btn-primary btn-lg">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign in
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="mt-16 w-full max-w-5xl"
            >
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-6 sm:px-6">
            {APPLICATION_STATUSES.map((status, i) => (
              <div key={status} className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  {status}
                </span>
                {i < APPLICATION_STATUSES.length - 1 && (
                  <span className="text-line-strong" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brand-700">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Everything about your search, connected
            </h2>
            <p className="mt-4 text-base text-muted">
              Six tools that used to live in six different places, now one workspace that knows
              about all of them at once.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
                className="bg-surface p-7"
              >
                <Icon>{feature.icon}</Icon>
                <h3 className="mt-5 text-[15px] font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div key={step.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
                <span className="font-mono text-xs font-medium text-brand-700">0{i + 1}</span>
                <div className="mt-3 h-px bg-line" />
                <h3 className="mt-5 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <motion.div {...fadeUp} className="card px-6 py-12 text-center sm:px-12">
            <span className="chip chip-neutral px-3 py-1">
              <span aria-hidden="true">🐯</span> Built by a Grambling State Tiger
            </span>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
              I built OfferFlow because I was tracking my own internship search across five different
              tools. If you&apos;re a student doing the same juggling act, this is for you, whatever
              you&apos;re studying.
            </p>

            <div className="mt-10 flex flex-wrap items-end justify-center gap-5 sm:gap-8">
              {STUDENT_FIGURES.map((figure, i) => (
                <motion.div
                  key={`${figure.pose}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="rounded-2xl bg-canvas p-2 ring-1 ring-inset ring-line"
                  >
                    <StudentFigure
                      pose={figure.pose}
                      skinTone={figure.skinTone}
                      outfit={figure.outfit}
                      className="h-14 w-14"
                    />
                  </motion.div>
                  <span className="text-xs text-muted">{figure.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl bg-brand-900 px-6 py-16 text-center sm:px-12"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
              aria-hidden="true"
            />
            <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your search deserves a system.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-base text-brand-100">
              Free for students. Set up in under a minute.
            </p>
            <Link
              to="/register"
              className="btn btn-lg relative mt-8 bg-white text-brand-900 shadow-xs hover:bg-brand-50"
            >
              Start tracking for free
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xs text-muted">Built by Lleyton Magama, Grambling State University</span>
          </div>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="link-muted text-sm">
            View on GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
