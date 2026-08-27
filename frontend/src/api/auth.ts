import type { User } from '../types/user'
import { apiFetch } from './client'

export interface Credentials {
  email: string
  password: string
}

export function register(data: Credentials): Promise<User> {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) })
}

export function login(data: Credentials): Promise<User> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) })
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' })
}

export function getMe(): Promise<User> {
  return apiFetch('/auth/me')
}
