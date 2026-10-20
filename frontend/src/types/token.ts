export interface ApiToken {
  id: number
  name: string
  prefix: string
  created_at: string
  last_used_at: string | null
}

export interface CreatedApiToken extends ApiToken {
  token: string
}
