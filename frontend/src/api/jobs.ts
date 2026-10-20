import type { DiscoveryStats, JobPosting, JobType, Recommendation } from '../types/job'
import { apiFetch } from './client'

export function getRecommendations(jobType?: JobType): Promise<Recommendation[]> {
  const query = jobType ? `?job_type=${jobType}` : ''
  return apiFetch(`/jobs/recommendations${query}`)
}

export function getSavedJobs(): Promise<JobPosting[]> {
  return apiFetch('/jobs/saved')
}

export function getDiscoveryStats(): Promise<DiscoveryStats> {
  return apiFetch('/jobs/stats')
}

export function saveJob(id: number): Promise<void> {
  return apiFetch(`/jobs/${id}/save`, { method: 'POST' })
}

export function dismissJob(id: number): Promise<void> {
  return apiFetch(`/jobs/${id}/dismiss`, { method: 'POST' })
}

export function clearJobInteraction(id: number): Promise<void> {
  return apiFetch(`/jobs/${id}/interaction`, { method: 'DELETE' })
}
