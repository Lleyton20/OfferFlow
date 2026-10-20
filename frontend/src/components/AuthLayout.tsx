import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Logo } from './Logo'

interface AuthLayoutProps {
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function AuthLayout({ title, description, children, footer, wide }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-4 py-10 sm:py-16">
      <Logo />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`card mt-8 w-full p-8 ${wide ? 'max-w-md' : 'max-w-sm'}`}
      >
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        {children}
      </motion.div>

      {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
    </div>
  )
}
