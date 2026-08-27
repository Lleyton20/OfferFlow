import type { User } from '../types/user'
import { apiFetch } from './client'

export interface Credentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  birthday: string
  university?: string
  grad_year?: number
}

export function register(data: RegisterData): Promise<User> {
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

export function forgotPassword(email: string): Promise<void> {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  })
}
