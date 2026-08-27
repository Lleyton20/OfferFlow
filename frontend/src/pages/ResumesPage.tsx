import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deleteResume, getResumes, uploadResume } from '../api/resumes'
import { ApiError } from '../api/client'
import { ResumeCard } from '../components/ResumeCard'
import { useAuth } from '../context/AuthContext'

export function ResumesPage() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, jobDescription }: { file: File; jobDescription: string }) =>
      uploadResume(file, jobDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      setJobDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setError(null)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Choose a resume file first.')
      return
    }
    setError(null)
    uploadMutation.mutate({ file, jobDescription })
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-white">OfferFlow</h1>
            <p className="text-sm text-slate-500">Resume Intelligence</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-slate-400 transition hover:text-slate-200">
              ← Dashboard
            </Link>
            <Link to="/contacts" className="text-sm text-slate-400 transition hover:text-slate-200">
              Contacts
            </Link>
            {user && <span className="text-sm text-slate-400">{user.email}</span>}
            <button
              onClick={() => logout()}
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        >
          <h2 className="text-lg font-semibold text-white">Upload a resume</h2>
          <p className="mt-1 text-sm text-slate-500">
            PDF or plain text. Paste a job description to get keyword matching against it.
          </p>

          <div className="mt-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-400"
            />
            <textarea
              placeholder="Paste a job description (optional)"
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={uploadMutation.isPending}
            className="mt-4 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {uploadMutation.isPending ? 'Analyzing…' : 'Analyze Resume'}
          </motion.button>
        </motion.form>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your resumes
        </h2>
        {isLoading && <p className="text-slate-500">Loading…</p>}
        {resumes && resumes.length === 0 && (
          <p className="text-slate-500">No resumes uploaded yet.</p>
        )}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {resumes?.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onDelete={(r) => deleteMutation.mutate(r.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
