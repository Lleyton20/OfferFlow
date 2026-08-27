import type {
  InterviewSession,
  InterviewSessionInput,
  InterviewSessionPatch,
} from '../types/interview'
import { apiFetch } from './client'

export function getInterviewSessions(): Promise<InterviewSession[]> {
  return apiFetch('/interviews')
}

export function createInterviewSession(data: InterviewSessionInput): Promise<InterviewSession> {
  return apiFetch('/interviews', { method: 'POST', body: JSON.stringify(data) })
}

export function updateInterviewSession(
  id: number,
  data: InterviewSessionPatch,
): Promise<InterviewSession> {
  return apiFetch(`/interviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteInterviewSession(id: number): Promise<void> {
  return apiFetch(`/interviews/${id}`, { method: 'DELETE' })
}

export function generateMockQuestions(id: number): Promise<InterviewSession> {
  return apiFetch(`/interviews/${id}/generate-questions`, { method: 'POST' })
}
