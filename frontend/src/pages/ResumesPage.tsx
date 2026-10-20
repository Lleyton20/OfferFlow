import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import { useRef, useState, type FormEvent } from 'react'
import { deleteResume, getResumes, uploadResume } from '../api/resumes'
import { ApiError } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { FormError } from '../components/FormError'
import { PageHeader } from '../components/PageHeader'
import { ResumeCard } from '../components/ResumeCard'
import { ListSkeleton } from '../components/Skeleton'
import { useToast } from '../components/useToast'

export function ResumesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, jobDescription }: { file: File; jobDescription: string }) =>
      uploadResume(file, jobDescription),
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.show(`Scored ${resume.filename}: ${resume.ats_score}/100`)
      setJobDescription('')
      setFileName(null)
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
    <div className="min-h-screen bg-canvas">
      <AppHeader active="resumes" />

      <main className="page max-w-4xl">
        <PageHeader
          title="Resumes"
          description="Score every version against ATS checks and get AI feedback on what to improve."
        />

        <form onSubmit={handleSubmit} className="card mb-10 p-6">
          <h2 className="text-base font-semibold text-ink">Analyze a resume</h2>
          <p className="mt-1 text-sm text-muted">
            PDF or plain text. Add a job description to see which keywords you match.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-canvas px-4 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 focus-within:border-brand-600">
              <span className="text-sm font-medium text-ink">
                {fileName ?? 'Choose a file'}
              </span>
              <span className="mt-1 text-xs text-muted">
                {fileName ? 'Click to choose a different file' : 'PDF or .txt'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="sr-only"
              />
            </label>
            <label className="field">
              <span className="label">
                Job description <span className="font-normal text-muted">(optional)</span>
              </span>
              <textarea
                placeholder="Paste the posting you're targeting"
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="input"
              />
            </label>
          </div>

          <div className="mt-4">
            <FormError message={error} />
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={uploadMutation.isPending} className="btn btn-primary">
              {uploadMutation.isPending ? 'Analyzing…' : 'Analyze resume'}
            </button>
          </div>
        </form>

        <h2 className="eyebrow mb-3">Your resumes</h2>
        {isLoading && <ListSkeleton rows={2} />}
        {resumes && resumes.length === 0 && (
          <EmptyState
            title="No resumes yet"
            description="Upload one above to get an ATS score and feedback."
          />
        )}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {resumes?.map((resume, index) => (
              <ResumeCard
                key={resume.id}
                index={index}
                resume={resume}
                onDelete={(r) => {
                  if (confirm(`Delete ${r.filename}?`)) deleteMutation.mutate(r.id)
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
