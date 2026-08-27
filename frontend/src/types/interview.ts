export const INTERVIEW_TYPES = [
  'Behavioral',
  'Technical',
  'System Design',
  'Recruiter Screen',
  'Final Round',
] as const

export const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const

export interface MockQuestion {
  question: string
  tip: string
}

export type AIFeedbackStatus = 'ok' | 'not_configured' | 'error'

export interface InterviewSession {
  id: number
  application_id: number | null
  title: string
  interview_type: string
  scheduled_date: string | null
  status: string
  prep_notes: string | null
  performance_rating: number | null
  performance_notes: string | null
  mock_questions: MockQuestion[]
  ai_feedback_status: AIFeedbackStatus
  created_at: string
  updated_at: string
}

export interface InterviewSessionInput {
  title: string
  interview_type: string
  application_id: number | null
  scheduled_date: string | null
  prep_notes: string | null
}

export type InterviewSessionPatch = Partial<InterviewSessionInput> & {
  status?: string
  performance_rating?: number | null
  performance_notes?: string | null
}
