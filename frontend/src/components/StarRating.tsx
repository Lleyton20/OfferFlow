import { motion } from 'motion/react'

interface StarRatingProps {
  value: number | null
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(star)}
          className={`text-xl leading-none ${
            value !== null && star <= value ? 'text-amber-400' : 'text-slate-700'
          }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </motion.button>
      ))}
    </div>
  )
}
