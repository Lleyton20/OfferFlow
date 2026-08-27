import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { ApiError } from '../api/client'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="aurora-bg flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl"
      >
        {!token ? (
          <>
            <h1 className="text-2xl font-semibold text-white">Invalid reset link</h1>
            <p className="mt-2 text-sm text-slate-400">
              This link is missing its token. Request a new one below.
            </p>
          </>
        ) : done ? (
          <>
            <h1 className="text-2xl font-semibold text-white">Password updated</h1>
            <p className="mt-2 text-sm text-slate-400">Taking you to sign in…</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white">Set a new password</h1>
            <p className="mt-1 text-sm text-slate-400">At least 8 characters.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </label>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : 'Reset password'}
              </motion.button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/forgot-password" className="font-medium text-emerald-400 hover:text-emerald-300">
            Request a new link
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
