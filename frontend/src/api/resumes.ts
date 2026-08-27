import type { Resume, TailorResponse } from '../types/resume'
import { apiFetch } from './client'

export function getResumes(): Promise<Resume[]> {
  return apiFetch('/resumes')
}

export function getResume(id: number): Promise<Resume> {
  return apiFetch(`/resumes/${id}`)
}

export function uploadResume(file: File, jobDescription: string): Promise<Resume> {
  const formData = new FormData()
  formData.append('file', file)
  if (jobDescription.trim()) {
    formData.append('job_description', jobDescription.trim())
  }
  return apiFetch('/resumes', { method: 'POST', body: formData })
}

export function deleteResume(id: number): Promise<void> {
  return apiFetch(`/resumes/${id}`, { method: 'DELETE' })
}

export function tailorResume(id: number, jobDescription: string): Promise<TailorResponse> {
  return apiFetch(`/resumes/${id}/tailor`, {
    method: 'POST',
    body: JSON.stringify({ job_description: jobDescription }),
  })
}
