export type JobType = 'internship' | 'new_grad' | 'fellowship'

export interface JobPosting {
  id: number
  source: string
  company: string
  title: string
  location: string | null
  url: string
  job_type: JobType
  category: string | null
  tags: string[]
  posted_at: string | null
  first_seen_at: string
}

export interface Recommendation {
  job: JobPosting
  score: number
  reasons: string[]
  state: 'saved' | null
}

export interface DiscoveryStats {
  active: number
  new_this_week: number
  by_type: Partial<Record<JobType, number>>
  last_refreshed_at: string | null
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  internship: 'Internship',
  new_grad: 'New grad',
  fellowship: 'Fellowship',
}
