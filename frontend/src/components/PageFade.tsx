import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Wraps a routed page so navigating between routes fades/slides instead of snapping. */
export function PageFade({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } }}
    >
      {children}
    </motion.div>
  )
}
