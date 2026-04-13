/**
 * sanitizeTime(val) — ensures a value is safe to pass to <input type="time">.
 * Accepts only exactly "HH:MM" 24-hour format. Returns "" for anything else,
 * including 12-hour strings like "07:00 PM", seconds like "19:00:00", or null.
 */
export function sanitizeTime(val) {
  if (!val) return ''
  const s = String(val).trim()
  return /^\d{2}:\d{2}$/.test(s) ? s : ''
}

/**
 * displayTime(t) — converts a stored "HH:MM" string to "7:00 AM" / "7:00 PM".
 * Safe to call with null/undefined/empty — returns "".
 */
export function displayTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return ''
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}
