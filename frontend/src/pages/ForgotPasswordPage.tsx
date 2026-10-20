import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'

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

  const footer = (
    <Link to="/login" className="link">
      Back to sign in
    </Link>
  )

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        description={
          <>
            If an account exists for <span className="font-medium text-ink">{email}</span>, we sent a
            password reset link. It expires in an hour.
          </>
        }
        footer={footer}
      />
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="field">
          <span className="label">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}
