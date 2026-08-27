import { motion } from 'motion/react'

/** Three pulsing dots — used in place of static "Loading…" text wherever data is fetching. */
export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-500">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
