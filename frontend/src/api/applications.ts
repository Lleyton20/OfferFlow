import type { Application, ApplicationInput } from '../types/application'
import { apiFetch } from './client'

export function getApplications(): Promise<Application[]> {
  return apiFetch('/applications')
}

export function createApplication(data: ApplicationInput): Promise<Application> {
  return apiFetch('/applications', { method: 'POST', body: JSON.stringify(data) })
}

export function updateApplication(
  id: number,
  data: Partial<ApplicationInput>,
): Promise<Application> {
  return apiFetch(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteApplication(id: number): Promise<void> {
  return apiFetch(`/applications/${id}`, { method: 'DELETE' })
}
