import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await forgotPassword(email)
    } finally {
      // Always show the same confirmation, whether or not the email exists —
      // the backend deliberately never reveals that either.
      setIsSubmitting(false)
      setSubmitted(true)
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
        {submitted ? (
          <>
            <h1 className="text-2xl font-semibold text-white">Check your email</h1>
            <p className="mt-2 text-sm text-slate-400">
              If an account exists for <span className="text-slate-300">{email}</span>, we sent a
              password reset link. It expires in an hour.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white">Forgot your password?</h1>
            <p className="mt-1 text-sm text-slate-400">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </label>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </motion.button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
