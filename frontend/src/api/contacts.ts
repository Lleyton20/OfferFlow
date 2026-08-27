import type { Contact, ContactInput, Interaction } from '../types/contact'
import { apiFetch } from './client'

export function getContacts(): Promise<Contact[]> {
  return apiFetch('/contacts')
}

export function createContact(data: ContactInput): Promise<Contact> {
  return apiFetch('/contacts', { method: 'POST', body: JSON.stringify(data) })
}

export function updateContact(id: number, data: Partial<ContactInput>): Promise<Contact> {
  return apiFetch(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteContact(id: number): Promise<void> {
  return apiFetch(`/contacts/${id}`, { method: 'DELETE' })
}

export function addInteraction(
  contactId: number,
  data: { date: string; note: string },
): Promise<Interaction> {
  return apiFetch(`/contacts/${contactId}/interactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteInteraction(contactId: number, interactionId: number): Promise<void> {
  return apiFetch(`/contacts/${contactId}/interactions/${interactionId}`, { method: 'DELETE' })
}
