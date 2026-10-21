import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** Shown across the top of the app while exploring a demo account. */
export function DemoBanner() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user?.is_demo) return null

  async function createAccount() {
    await logout()
    navigate('/register')
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="overflow-hidden bg-brand-900 text-white"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-center text-[13px] sm:px-6">
        <span className="text-brand-100">
          <span className="font-semibold text-white">You're exploring a demo.</span> Click around and
          change anything. It resets after 24 hours.
        </span>
        <button
          onClick={createAccount}
          className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-brand-900 transition-colors hover:bg-brand-50"
        >
          Create your free account
        </button>
      </div>
    </motion.div>
  )
}
