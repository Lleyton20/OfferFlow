import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { Logo, LogoMark } from '../components/Logo'
import { STATUS_COLORS } from '../lib/statusColors'
import { APPLICATION_STATUSES } from '../types/application'

const REPO_URL = 'https://github.com/Lleyton20/OfferFlow'
const EASE = [0.2, 0.8, 0.2, 1] as const

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  )
}

const FEATURES = [
  {
    title: 'Captured as you apply',
    description:
      'The browser extension saves the role, description and hiring contacts the moment you hit submit, on almost any job site.',
    icon: (
      <>
        <rect x="2.5" y="3.5" width="15" height="12" rx="2" />
        <path d="M2.5 7h15" />
        <path d="M7.5 11.5l1.8 1.8 3.7-3.8" />
      </>
    ),
  },
  {
    title: 'Fresh roles, found for you',
    description:
      'New internships, new-grad roles and fellowships from company job boards, ranked against your resume, with alerts by email.',
    icon: (
      <>
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13 13l4 4" />
        <path d="M9 6.5v5M6.5 9h5" />
      </>
    ),
  },
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
    title: 'Interview prep and analytics',
    description:
      'Mock questions for each interview, an AI career assistant, and conversion rates computed from your own data.',
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

const PREVIEW_STAGES = ['Applied', 'Recruiter Screen', 'Final Round', 'Offer'] as const
type PreviewStage = (typeof PREVIEW_STAGES)[number]

const STATIC_CARDS: { company: string; role: string; stage: PreviewStage }[] = [
  { company: 'Stripe', role: 'Software Engineer Intern', stage: 'Applied' },
  { company: 'Figma', role: 'Product Design Intern', stage: 'Applied' },
  { company: 'Ramp', role: 'Software Engineer, New Grad', stage: 'Recruiter Screen' },
  { company: 'Notion', role: 'Software Engineer Intern', stage: 'Final Round' },
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: EASE },
}

/** Splits a line into words that rise into place one after another. */
function RevealWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.06, ease: EASE }}
          >
            {word}
            {' '}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** A self-playing board: one application advances a stage every couple of seconds. */
function ProductPreview() {
  const [stageIndex, setStageIndex] = useState(0)
  const stage = PREVIEW_STAGES[stageIndex]

  useEffect(() => {
    const id = setInterval(() => setStageIndex((i) => (i + 1) % PREVIEW_STAGES.length), 2200)
    return () => clearInterval(id)
  }, [])

  const isOffer = stage === 'Offer'

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay">
      <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 text-xs text-muted">offerflow / dashboard</span>
      </div>
      <div className="grid grid-cols-2 border-b border-line text-left sm:grid-cols-4 sm:divide-x sm:divide-line">
        {[
          { label: 'Active applications', value: isOffer ? 11 : 12 },
          { label: 'Offers', value: isOffer ? 2 : 1, highlight: isOffer },
          { label: 'Overdue follow-ups', value: 2 },
          { label: 'Latest resume score', value: 86 },
        ].map((tile) => (
          <div key={tile.label} className="px-5 py-4">
            <p className="text-[11px] font-medium text-muted">{tile.label}</p>
            <p
              className={`mt-1 text-xl font-semibold tracking-tight tabular-nums transition-colors duration-500 ${
                tile.highlight ? 'text-brand-600' : 'text-ink'
              }`}
            >
              <AnimatedNumber value={tile.value} />
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 bg-canvas p-4 text-left sm:grid-cols-4">
        {PREVIEW_STAGES.map((column, i) => (
          <div key={column} className={`rounded-lg bg-subtle/80 p-2 ${i > 1 ? 'hidden sm:block' : ''}`}>
            <div className="flex items-center gap-1.5 px-1.5 pt-0.5 pb-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[column] }} />
              <span className="text-[11px] font-semibold text-ink">{column}</span>
            </div>
            <div className="min-h-[7.5rem] space-y-2">
              {stage === column && (
                <motion.div
                  layoutId="preview-moving-card"
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className={`rounded-md border bg-surface p-2.5 shadow-lift ${
                    isOffer ? 'border-brand-300 ring-2 ring-brand-100' : 'border-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-ink">Datadog</p>
                    <span className="chip chip-brand px-1.5 text-[10px]">Referral</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">SWE Intern</p>
                </motion.div>
              )}
              {STATIC_CARDS.filter((card) => card.stage === column).map((card) => (
                <motion.div
                  key={card.company}
                  layout
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="rounded-md border border-line bg-surface p-2.5 shadow-xs"
                >
                  <p className="text-xs font-semibold text-ink">{card.company}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">{card.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The pipeline legend, with a marker that travels from Applied toward Offer. */
function PipelineStrip() {
  const [active, setActive] = useState(0)
  const stages = APPLICATION_STATUSES.filter((s) => s !== 'Rejected')

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % stages.length), 1100)
    return () => clearInterval(id)
  }, [stages.length])

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-2 px-4 py-6 sm:px-6">
      {stages.map((status, i) => (
        <div key={status} className="flex items-center gap-2">
          <span className="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-ink-soft">
            {active === i && (
              <motion.span
                layoutId="pipeline-marker"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-brand-50 ring-1 ring-brand-200"
              />
            )}
            <span
              className="relative h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className={`relative transition-colors duration-300 ${active === i ? 'text-brand-800' : ''}`}>
              {status}
            </span>
          </span>
          {i < stages.length - 1 && (
            <span className="text-line-strong" aria-hidden="true">
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

type CaptureStage = 'page' | 'click' | 'confirm' | 'saved'
const CAPTURE_SEQUENCE: { stage: CaptureStage; ms: number }[] = [
  { stage: 'page', ms: 1600 },
  { stage: 'click', ms: 700 },
  { stage: 'confirm', ms: 900 },
  { stage: 'saved', ms: 2600 },
]

/** A looping mock of the extension: submit an application, watch it get saved. */
function CaptureDemo() {
  const [step, setStep] = useState(0)
  const { stage } = CAPTURE_SEQUENCE[step]

  useEffect(() => {
    const id = setTimeout(() => setStep((s) => (s + 1) % CAPTURE_SEQUENCE.length), CAPTURE_SEQUENCE[step].ms)
    return () => clearTimeout(id)
  }, [step])

  const submitted = stage === 'confirm' || stage === 'saved'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay">
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-2 flex-1 truncate rounded-md bg-surface px-3 py-1 text-[11px] text-muted ring-1 ring-line">
          job-boards.greenhouse.io/figma/jobs/5551234
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md ring-1 ring-line">
          <span className="relative">
            <LogoMark className="h-4 w-4" />
            <AnimatePresence>
              {stage === 'saved' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-brand-600 text-[7px] font-bold text-white ring-2 ring-canvas"
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </span>
      </div>

      <div className="relative h-72 p-6 text-left">
        <AnimatePresence mode="wait" initial={false}>
          {submitted ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <p className="text-lg font-semibold text-ink">Thank you for applying!</p>
              <p className="mt-1 text-sm text-muted">The Figma recruiting team will be in touch.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
              <p className="text-xs font-medium text-muted">Figma · New York, NY</p>
              <p className="mt-1 text-lg font-semibold text-ink">Product Design Intern</p>
              <div className="mt-5 space-y-2.5">
                {['Full name', 'Email', 'Resume'].map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-16 text-[11px] text-muted">{label}</span>
                    <span className="h-7 flex-1 rounded-md border border-line bg-canvas px-2 text-[11px] leading-7 text-ink-soft">
                      {['Lleyton Magama', 'lleyton@example.com', 'resume_v4.pdf'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <motion.span
                animate={stage === 'click' ? { scale: [1, 0.94, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="mt-5 inline-flex rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white"
              >
                Submit application
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {stage === 'saved' && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute right-4 bottom-4 flex max-w-64 gap-2.5 rounded-xl bg-ink px-3.5 py-3 text-left text-white shadow-overlay"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand-600 text-[9px] font-bold">
                ✓
              </span>
              <span className="text-xs">
                <span className="block font-semibold">Saved to OfferFlow</span>
                <span className="text-brand-200">Figma · Product Design Intern</span>
                <span className="block text-brand-200">+ 1 contact</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const DISCOVER_SAMPLE = [
  { company: 'Anthropic', title: 'Research Engineering Fellowship', type: 'Fellowship', reason: 'Matches your interest in machine learning' },
  { company: 'Stripe', title: 'Software Engineer Intern, Summer 2027', type: 'Internship', reason: 'Uses python, react' },
  { company: 'Ramp', title: 'Software Engineer, New Grad', type: 'New grad', reason: "Similar to roles you've applied to" },
]

function DiscoverDemo() {
  return (
    <div className="space-y-2.5">
      {DISCOVER_SAMPLE.map((job, i) => (
        <motion.div
          key={job.company}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease: EASE }}
          className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-left shadow-card"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-sm font-semibold text-ink-soft ring-1 ring-line">
            {job.company[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
            <p className="text-xs text-muted">{job.company}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip chip-neutral">{job.type}</span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="chip chip-brand"
              >
                {job.reason}
              </motion.span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function Showcase({
  eyebrow,
  title,
  body,
  points,
  visual,
  flip,
}: {
  eyebrow: string
  title: string
  body: string
  points: string[]
  visual: ReactNode
  flip?: boolean
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <motion.div {...fadeUp} className={flip ? 'lg:order-2' : ''}>
        <p className="eyebrow text-brand-700">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
        <p className="mt-4 text-base leading-relaxed text-muted">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((point, i) => (
            <motion.li
              key={point}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              className="flex gap-2.5 text-sm text-ink-soft"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 ring-1 ring-brand-200">
                ✓
              </span>
              {point}
            </motion.li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: EASE }}
        className={flip ? 'lg:order-1' : ''}
      >
        {visual}
      </motion.div>
    </div>
  )
}

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const previewRotate = useTransform(scrollYProgress, [0, 0.5], [10, 0])
  const previewScale = useTransform(scrollYProgress, [0, 0.5], [0.94, 1])
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 120])

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <header
        className={`sticky top-0 z-20 border-b bg-canvas/80 backdrop-blur-md transition-colors duration-300 ${
          scrolled ? 'border-line' : 'border-transparent'
        }`}
      >
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
        <section ref={heroRef} className="relative overflow-hidden">
          <motion.div style={{ y: gridY }} className="dot-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl"
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24">
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="chip chip-neutral bg-surface px-3 py-1 shadow-xs"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
              </span>
              Built for internship and new-grad recruiting
            </motion.span>

            <h1 className="mt-6 max-w-3xl text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] text-ink sm:text-6xl">
              <RevealWords text="Your entire job search," delay={0.1} />
              <br />
              <RevealWords text="in one place." delay={0.35} className="text-brand-600" />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            >
              OfferFlow replaces the spreadsheet and seven open tabs with one connected workspace.
              Your applications, resumes, contacts and interview prep, all aware of each other.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65, ease: EASE }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Link to="/register" className="btn btn-primary btn-lg group">
                Create a free account
                <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign in
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.75, ease: EASE }}
              className="mt-16 w-full max-w-5xl [perspective:1400px]"
            >
              <motion.div style={{ rotateX: previewRotate, scale: previewScale, transformOrigin: 'center top' }}>
                <ProductPreview />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <PipelineStrip />
        </section>

        <section className="mx-auto max-w-6xl space-y-28 px-4 pt-24 sm:px-6">
          <Showcase
            eyebrow="Browser extension"
            title="Apply anywhere. It's already tracked."
            body="Hit submit on Greenhouse, Lever, Workday, Ashby, LinkedIn or a company careers page, and the application lands on your board with everything attached."
            points={[
              'Role, company, location and the full job description',
              'Recruiters and hiring managers listed on the posting',
              'Never duplicated, even if you apply from two places',
            ]}
            visual={<CaptureDemo />}
          />
          <Showcase
            flip
            eyebrow="Discover"
            title="New openings, picked for you."
            body="OfferFlow watches company job boards and community-maintained lists for fresh internships, new-grad roles and fellowships, then ranks them against your resume and history."
            points={[
              'Every recommendation says why it was picked',
              'A short email when something new matches',
              'Applied, saved and dismissed roles stay out of the way',
            ]}
            visual={<DiscoverDemo />}
          />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brand-700">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Everything about your search, connected
            </h2>
            <p className="mt-4 text-base text-muted">
              From finding the role to signing the offer, every step lives in one workspace that
              knows about all of them at once.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.08 + Math.floor(i / 3) * 0.12, ease: EASE }}
                className="group relative bg-surface p-7 transition-colors duration-300 hover:bg-canvas"
              >
                <span
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-600 transition-transform duration-500 group-hover:scale-x-100"
                  aria-hidden="true"
                />
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
              <motion.div key={step.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.12 }}>
                <span className="font-mono text-xs font-medium text-brand-700">0{i + 1}</span>
                <motion.div
                  className="mt-3 h-px origin-left bg-line-strong"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: EASE }}
                />
                <h3 className="mt-5 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative overflow-hidden rounded-2xl bg-brand-900 px-6 py-16 text-center sm:px-12"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
              aria-hidden="true"
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['0%', '400%'] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
            <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your search deserves a system.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-base text-brand-100">
              Free for students. Set up in under a minute.
            </p>
            <Link
              to="/register"
              className="btn btn-lg group relative mt-8 bg-white text-brand-900 shadow-xs hover:bg-brand-50"
            >
              Start tracking for free
              <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xs text-muted">© {new Date().getFullYear()} OfferFlow</span>
          </div>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="link-muted text-sm">
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
