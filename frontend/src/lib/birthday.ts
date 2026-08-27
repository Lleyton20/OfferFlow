/** True when `birthday` (YYYY-MM-DD) shares today's month and day, in the viewer's local time. */
export function isBirthdayToday(birthday: string | null | undefined): boolean {
  if (!birthday) return false
  const parts = birthday.split('-')
  if (parts.length !== 3) return false
  const [, month, day] = parts
  const today = new Date()
  return (
    Number(month) === today.getMonth() + 1 && Number(day) === today.getDate()
  )
}

export function daysUntilBirthday(birthday: string | null | undefined): number | null {
  if (!birthday) return null
  const parts = birthday.split('-')
  if (parts.length !== 3) return null
  const [, month, day] = parts.map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let next = new Date(today.getFullYear(), month - 1, day)
  if (next < today) {
    next = new Date(today.getFullYear() + 1, month - 1, day)
  }
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
