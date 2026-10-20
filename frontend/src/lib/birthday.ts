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
