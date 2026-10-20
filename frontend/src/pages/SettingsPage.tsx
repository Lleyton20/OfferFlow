import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { updatePreferences } from '../api/auth'
import { createToken, getTokens, revokeToken } from '../api/tokens'
import { AppHeader } from '../components/AppHeader'
import { KeywordEditor } from '../components/KeywordEditor'
import { PageHeader } from '../components/PageHeader'
import { Switch } from '../components/Switch'
import { useToast } from '../components/useToast'
import { useAuth } from '../context/useAuth'
import { timeAgo } from '../lib/time'
import type { CreatedApiToken } from '../types/token'

const EXTENSION_GUIDE = 'https://github.com/Lleyton20/OfferFlow/tree/main/extension#install'

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="card grid gap-5 p-6 md:grid-cols-[14rem_1fr]"
    >
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </motion.section>
  )
}

function NewTokenNotice({ token, onDone }: { token: CreatedApiToken; onDone: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(token.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-medium text-brand-900">Copy your token now. It won't be shown again.</p>
        <div className="mt-3 flex gap-2">
          <code className="input min-w-0 flex-1 truncate bg-surface font-mono text-xs leading-5">{token.token}</code>
          <button onClick={copy} className="btn btn-primary btn-sm shrink-0">
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <p className="mt-3 text-xs text-brand-800">
          Paste it into the OfferFlow extension's settings.{' '}
          <button onClick={onDone} className="font-medium underline underline-offset-2">
            Done
          </button>
        </p>
      </div>
    </motion.div>
  )
}

export function SettingsPage() {
  const { user, setUser } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [tokenName, setTokenName] = useState('Chrome')
  const [created, setCreated] = useState<CreatedApiToken | null>(null)

  const tokens = useQuery({ queryKey: ['tokens'], queryFn: getTokens })

  const create = useMutation({
    mutationFn: createToken,
    onSuccess: (token) => {
      setCreated(token)
      queryClient.invalidateQueries({ queryKey: ['tokens'] })
    },
    onError: () => toast.show("Couldn't create a token", 'error'),
  })

  const revoke = useMutation({
    mutationFn: revokeToken,
    onSuccess: () => {
      toast.show('Token revoked')
      queryClient.invalidateQueries({ queryKey: ['tokens'] })
    },
  })

  const preferences = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (updated, variables) => {
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
      if (variables.digest_enabled !== undefined) {
        toast.show(variables.digest_enabled ? 'Job alerts turned on' : 'Job alerts turned off')
      }
    },
  })

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    create.mutate(tokenName.trim() || 'Browser extension')
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader active="settings" />

      <main className="page max-w-4xl">
        <PageHeader title="Settings" description="Your account, browser extension and job alerts." />

        <div className="space-y-4">
          <Section title="Account" description="The details you signed up with.">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[
                ['Name', user?.full_name],
                ['Email', user?.email],
                ['University', user?.university ?? 'Not set'],
                ['Graduation year', user?.grad_year ?? 'Not set'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section
            title="Browser extension"
            description="Saves applications automatically the moment you hit submit, on almost any job site."
          >
            <ol className="mb-5 space-y-2 text-sm text-ink-soft">
              {[
                <>
                  Install the OfferFlow extension.{' '}
                  <a href={EXTENSION_GUIDE} target="_blank" rel="noreferrer" className="link">
                    Installation guide ↗
                  </a>
                </>,
                'Create an access token below.',
                'Paste it into the extension when it opens its settings.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold text-ink-soft ring-1 ring-line">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <AnimatePresence>
              {created && <NewTokenNotice token={created} onDone={() => setCreated(null)} />}
            </AnimatePresence>

            <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                maxLength={60}
                aria-label="Token name"
                placeholder="Token name, e.g. Chrome on laptop"
                className="input sm:max-w-xs"
              />
              <button type="submit" disabled={create.isPending} className="btn btn-primary">
                {create.isPending ? 'Creating…' : 'Create access token'}
              </button>
            </form>

            {tokens.data && tokens.data.length > 0 && (
              <ul className="mt-5 divide-y divide-line rounded-lg border border-line">
                <AnimatePresence initial={false}>
                  {tokens.data.map((token) => (
                    <motion.li
                      key={token.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{token.name}</p>
                        <p className="text-xs text-muted">
                          <code className="font-mono">{token.prefix}…</code> · created {timeAgo(token.created_at)}
                          {' · '}
                          {token.last_used_at ? `last used ${timeAgo(token.last_used_at)}` : 'never used'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Revoke "${token.name}"? The extension using it will stop syncing.`)) {
                            revoke.mutate(token.id)
                          }
                        }}
                        className="link-danger text-xs font-medium"
                      >
                        Revoke
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Section>

          <Section
            title="Job alerts"
            description="A short email when new openings match your interests. At most once a day."
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Email me new matches</p>
                <p className="text-xs text-muted">Sent to {user?.email}</p>
              </div>
              <Switch
                checked={user?.digest_enabled ?? true}
                onChange={(digest_enabled) => preferences.mutate({ digest_enabled })}
                label="Email me new matches"
                disabled={preferences.isPending}
              />
            </div>
            <div className="mt-5">
              <p className="label mb-2">Interests</p>
              <div className="rounded-lg border border-line-strong px-2 py-1.5 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10">
                <KeywordEditor
                  keywords={user?.job_keywords ?? []}
                  onChange={(job_keywords) => preferences.mutate({ job_keywords })}
                  disabled={preferences.isPending}
                />
              </div>
              <p className="hint mt-2">Roles, skills or industries. Recommendations also learn from your resume.</p>
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}
