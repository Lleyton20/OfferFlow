import { motion } from 'motion/react'

const CONFETTI = ['🎉', '🎂', '✨', '🎈', '🎊']

interface BirthdayBannerProps {
  name?: string
}

export function BirthdayBanner({ name }: BirthdayBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-indigo-500/15 via-fuchsia-500/15 to-sky-500/15 px-6 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1 text-xl">
          {CONFETTI.map((emoji, i) => (
            <motion.span
              key={emoji}
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: [0, -6, 0], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
        <p className="text-sm font-medium text-white">
          Happy birthday{name ? `, ${name}` : ''}! 🎂 The whole OfferFlow team (that's just you and a
          very determined API) hopes today brings good news — and maybe an offer.
        </p>
      </div>
    </motion.div>
  )
}
