export const APPLICATION_STATUSES = [
  'Applied',
  'Online Assessment',
  'Recruiter Screen',
  'Technical Interview',
  'Final Round',
  'Offer',
  'Rejected',
] as const

export type KnownStatus = (typeof APPLICATION_STATUSES)[number]

export interface StatusEvent {
  id: number
  status: string
  created_at: string
}

export interface Application {
  id: number
  company: string
  role: string
  date_applied: string
  status: string
  referral_used: boolean
  contact_person: string | null
  job_description: string | null
  match_score: number | null
  strengths: string[]
  weaknesses: string[]
  notes: string | null
  resume_id: number | null
  created_at: string
  updated_at: string
  status_history: StatusEvent[]
}

export interface ApplicationInput {
  company: string
  role: string
  date_applied: string
  status: string
  referral_used: boolean
  contact_person: string | null
  job_description: string | null
  match_score: number | null
  strengths: string[]
  weaknesses: string[]
  notes: string | null
  resume_id: number | null
}
