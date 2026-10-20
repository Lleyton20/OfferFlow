import { motion } from 'motion/react'

interface StarRatingProps {
  value: number | null
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Performance rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(star)}
          className={`text-xl leading-none transition-colors ${
            value !== null && star <= value ? 'text-brand-600' : 'text-line-strong hover:text-brand-300'
          }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </motion.button>
      ))}
    </div>
  )
}
