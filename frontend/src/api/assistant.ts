import type { ChatMessage } from '../types/chat'
import { apiFetch } from './client'

export function getChatMessages(): Promise<ChatMessage[]> {
  return apiFetch('/assistant/messages')
}

export function sendChatMessage(content: string): Promise<ChatMessage> {
  return apiFetch('/assistant/messages', { method: 'POST', body: JSON.stringify({ content }) })
}

export function clearChatMessages(): Promise<void> {
  return apiFetch('/assistant/messages', { method: 'DELETE' })
}
