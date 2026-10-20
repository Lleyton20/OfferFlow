import { motion } from 'motion/react'

const CONFETTI = ['🎉', '🎂', '🎈']

interface BirthdayBannerProps {
  name?: string
}

export function BirthdayBanner({ name }: BirthdayBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative mb-6 overflow-hidden rounded-xl border border-brand-200 bg-brand-50 px-5 py-3.5"
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-0.5 text-lg" aria-hidden="true">
          {CONFETTI.map((emoji, i) => (
            <motion.span
              key={emoji}
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
        <p className="text-sm text-brand-900">
          <span className="font-semibold">Happy birthday{name ? `, ${name}` : ''}.</span> Here&apos;s
          hoping today brings good news, and maybe an offer.
        </p>
      </div>
    </motion.div>
  )
}
