export interface ResumeCheck {
  check: string
  passed: boolean
  detail: string
}

export interface AIFeedback {
  overall_summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export type AIFeedbackStatus = 'ok' | 'not_configured' | 'error'

export interface TailoringSuggestions {
  summary_rewrite: string
  bullets_to_emphasize: string[]
  keywords_to_add: string[]
  overall_advice: string
}

export interface TailorResponse {
  suggestions: TailoringSuggestions | null
  status: AIFeedbackStatus
}

export interface Resume {
  id: number
  filename: string
  job_description: string | null
  ats_score: number
  ats_checks: ResumeCheck[]
  matched_keywords: string[]
  missing_keywords: string[]
  ai_feedback: AIFeedback | null
  ai_feedback_status: AIFeedbackStatus
  created_at: string
}
