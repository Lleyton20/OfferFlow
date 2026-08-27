export const RELATIONSHIP_TYPES = [
  'Recruiter',
  'Hiring Manager',
  'Referral',
  'Alum',
  'Other',
] as const

export interface Interaction {
  id: number
  date: string
  note: string
  created_at: string
}

export interface Contact {
  id: number
  name: string
  company: string | null
  role: string | null
  email: string | null
  linkedin_url: string | null
  relationship_type: string
  notes: string | null
  last_contacted_date: string | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
  interactions: Interaction[]
}

export interface ContactInput {
  name: string
  company: string | null
  role: string | null
  email: string | null
  linkedin_url: string | null
  relationship_type: string
  notes: string | null
  last_contacted_date: string | null
  follow_up_date: string | null
}
