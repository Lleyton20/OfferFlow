export interface User {
  id: number
  email: string
  full_name: string
  birthday: string | null
  university: string | null
  grad_year: number | null
  job_keywords: string[]
  digest_enabled: boolean
  created_at: string
}
