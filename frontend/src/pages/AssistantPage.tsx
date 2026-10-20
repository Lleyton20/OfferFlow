import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { clearChatMessages, getChatMessages, sendChatMessage } from '../api/assistant'
import { AppHeader } from '../components/AppHeader'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'

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
    <div className="flex h-screen flex-col bg-canvas">
      <AppHeader active="assistant" />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 pt-8 pb-6 sm:px-6">
        <PageHeader
          title="Career assistant"
          description="Ask questions about your search. Answers draw on your own applications, resumes and contacts."
          actions={
            messages && messages.length > 0 ? (
              <button onClick={() => clearMutation.mutate()} className="btn btn-secondary btn-sm">
                Clear conversation
              </button>
            ) : undefined
          }
        />

        <div
          ref={scrollRef}
          className="card min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
          aria-live="polite"
        >
          {isLoading && <LoadingSpinner label="Loading conversation…" />}

          {!isLoading && (!messages || messages.length === 0) && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-base font-semibold text-ink">What would you like to know?</p>
              <p className="max-w-sm text-sm text-muted">
                I can see your applications, resumes, contacts and interview prep. Specific
                questions get the most useful answers.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMutation.mutate(s)}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-brand-600 text-white'
                      : 'rounded-bl-md bg-subtle text-ink-soft'
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-subtle px-4 py-3">
                <LoadingSpinner />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your search"
            aria-label="Message"
            className="input py-2.5"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !draft.trim()}
            className="btn btn-primary btn-lg"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  )
}
