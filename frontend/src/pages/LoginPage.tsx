import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { FormError } from '../components/FormError'
import { useAuth } from '../context/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up where you left off."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="link">
            Create one
          </Link>
        </>
      }
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
        <label className="field">
          <span className="flex items-center justify-between">
            <span className="label">Password</span>
            <Link to="/forgot-password" className="link text-xs">
              Forgot password?
            </Link>
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>

        <FormError message={error} />

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
