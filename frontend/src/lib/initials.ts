/** Two-letter avatar label: first and last name initials, or the first two characters of the email. */
export function initials(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2)
  return letters.toUpperCase()
}
