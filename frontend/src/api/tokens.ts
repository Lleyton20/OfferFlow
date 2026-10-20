import type { ApiToken, CreatedApiToken } from '../types/token'
import { apiFetch } from './client'

export function getTokens(): Promise<ApiToken[]> {
  return apiFetch('/tokens')
}

export function createToken(name: string): Promise<CreatedApiToken> {
  return apiFetch('/tokens', { method: 'POST', body: JSON.stringify({ name }) })
}

export function revokeToken(id: number): Promise<void> {
  return apiFetch(`/tokens/${id}`, { method: 'DELETE' })
}
