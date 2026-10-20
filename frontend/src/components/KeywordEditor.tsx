import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'

interface KeywordEditorProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
  disabled?: boolean
}

/** Interest keywords as removable chips, with an inline field to add more. */
export function KeywordEditor({ keywords, onChange, disabled }: KeywordEditorProps) {
  const [draft, setDraft] = useState('')

  function add(event: FormEvent) {
    event.preventDefault()
    const additions = draft
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k && !keywords.some((existing) => existing.toLowerCase() === k.toLowerCase()))
    if (additions.length) onChange([...keywords, ...additions])
    setDraft('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence initial={false}>
        {keywords.map((keyword) => (
          <motion.span
            key={keyword}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
            className="chip chip-brand pr-1"
          >
            {keyword}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(keywords.filter((k) => k !== keyword))}
              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-100"
              aria-label={`Remove ${keyword}`}
            >
              ×
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <form onSubmit={add} className="min-w-40 flex-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled}
          placeholder={keywords.length ? 'Add another' : 'e.g. software, python, product design'}
          aria-label="Add an interest"
          className="w-full bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-faint"
        />
      </form>
    </div>
  )
}
