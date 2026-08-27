import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 9 }, (_, i) => CURRENT_YEAR - 1 + i)

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthday, setBirthday] = useState('')
  const [university, setUniversity] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({
        full_name: fullName,
        email,
        password,
        birthday,
        university: university.trim() || undefined,
        grad_year: gradYear ? Number(gradYear) : undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="aurora-bg flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-2xl font-semibold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Start tracking your applications with OfferFlow.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Full name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-slate-500">At least 8 characters.</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Birthday</span>
            <input
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={`${inputClass} [color-scheme:dark]`}
            />
            <span className="mt-1 block text-xs text-slate-500">
              We'll surprise you on the day — never shared, never sold.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">
                University <span className="text-slate-600">(optional)</span>
              </span>
              <input
                type="text"
                autoComplete="organization"
                placeholder="e.g. Grambling State"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">
                Grad year <span className="text-slate-600">(optional)</span>
              </span>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {GRAD_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
