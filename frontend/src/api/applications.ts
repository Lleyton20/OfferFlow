import type { Application, ApplicationInput } from '../types/application'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed with status ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export function getApplications(): Promise<Application[]> {
  return fetch(`${API_URL}/applications`).then((res) => handleResponse(res))
}

export function createApplication(data: ApplicationInput): Promise<Application> {
  return fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => handleResponse(res))
}

export function updateApplication(
  id: number,
  data: Partial<ApplicationInput>,
): Promise<Application> {
  return fetch(`${API_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => handleResponse(res))
}

export function deleteApplication(id: number): Promise<void> {
  return fetch(`${API_URL}/applications/${id}`, { method: 'DELETE' }).then((res) =>
    handleResponse(res),
  )
}
