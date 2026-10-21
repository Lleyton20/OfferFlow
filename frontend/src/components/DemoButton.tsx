import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/useAuth'
import { useToast } from './useToast'

interface DemoButtonProps {
  className?: string
  label?: string
}

/** Signs the visitor into a fresh, pre-filled demo account and opens the dashboard. */
export function DemoButton({ className = 'btn btn-secondary btn-lg', label = 'Try the live demo' }: DemoButtonProps) {
  const { startDemo } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [isStarting, setIsStarting] = useState(false)

  async function handleClick() {
    setIsStarting(true)
    try {
      await startDemo()
      navigate('/dashboard')
    } catch (err) {
      toast.show(
        err instanceof ApiError && err.status === 429
          ? 'Lots of demos started from your network. Try again in a little while.'
          : "Couldn't start the demo. The server may be waking up, so try again in a moment.",
        'error',
      )
      setIsStarting(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={isStarting} className={className}>
      {isStarting ? (
        <>
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          Setting up your demo…
        </>
      ) : (
        label
      )}
    </button>
  )
}
