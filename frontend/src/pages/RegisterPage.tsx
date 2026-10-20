import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { FormError } from '../components/FormError'
import { useAuth } from '../context/useAuth'

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 9 }, (_, i) => CURRENT_YEAR - 1 + i)

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
    <AuthLayout
      wide
      title="Create your account"
      description="Free for students. Takes about a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="field">
          <span className="label">Full name</span>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />
        </label>

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
          <span className="label">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <span className="hint">At least 8 characters.</span>
        </label>

        <label className="field">
          <span className="label">Birthday</span>
          <input
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="input"
          />
          <span className="hint">Only used to say happy birthday. Never shared.</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span className="label">
              University <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              type="text"
              autoComplete="organization"
              placeholder="e.g. Grambling State"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="input"
            />
          </label>
          <label className="field">
            <span className="label">
              Grad year <span className="font-normal text-muted">(optional)</span>
            </span>
            <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} className="input">
              <option value="">Select</option>
              {GRAD_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <FormError message={error} />

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
