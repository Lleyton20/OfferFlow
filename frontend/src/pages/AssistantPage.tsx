import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { clearChatMessages, getChatMessages, sendChatMessage } from '../api/assistant'
import { AppHeader } from '../components/AppHeader'
import { LoadingSpinner } from '../components/LoadingSpinner'

const SUGGESTIONS = [
  'What should I follow up on this week?',
  'How does my application pipeline look?',
  'Is my resume in good shape?',
]

export function AssistantPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: messages, isLoading } = useQuery({
    queryKey: ['assistant'],
    queryFn: getChatMessages,
  })

  const sendMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assistant'] }),
  })

  const clearMutation = useMutation({
    mutationFn: clearChatMessages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assistant'] }),
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sendMutation.isPending])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || sendMutation.isPending) return
    sendMutation.mutate(draft.trim())
    setDraft('')
  }

  return (
    <div className="aurora-bg aurora-bg-subtle flex min-h-screen flex-col bg-slate-950">
      <AppHeader
        active="assistant"
        subtitle="Career assistant"
        actions={
          messages && messages.length > 0 ? (
            <button
              onClick={() => clearMutation.mutate()}
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              Clear chat
            </button>
          ) : undefined
        }
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-6">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto">
          {isLoading && <LoadingSpinner label="Loading conversation…" />}

          {!isLoading && (!messages || messages.length === 0) && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-lg font-medium text-white">
                Ask me anything about your job search
              </p>
              <p className="max-w-sm text-sm text-slate-500">
                I can see your applications, resumes, contacts, and interview prep —
                ask something specific.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMutation.mutate(s)}
                    className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages?.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'border border-slate-800 bg-slate-900/80 text-slate-200'
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5">
                <LoadingSpinner />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your search…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={sendMutation.isPending || !draft.trim()}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            Send
          </motion.button>
        </form>
      </main>
    </div>
  )
}
