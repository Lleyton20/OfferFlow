import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { FormError } from '../components/FormError'

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

  const footer = (
    <Link to="/forgot-password" className="link">
      Request a new link
    </Link>
  )

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        description="This link is missing its token. Request a new one below."
        footer={footer}
      />
    )
  }

  if (done) {
    return <AuthLayout title="Password updated" description="Taking you to sign in…" />
  }

  return (
    <AuthLayout title="Set a new password" description="Choose at least 8 characters." footer={footer}>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="field">
          <span className="label">New password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>

        <FormError message={error} />

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
          {isSubmitting ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  )
}
