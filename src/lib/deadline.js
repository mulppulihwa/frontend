const DAY_MS = 86400000

function parseLocalDate(dateLike) {
  if (!dateLike) return null
  if (dateLike instanceof Date) {
    return Number.isNaN(dateLike.getTime()) ? null : dateLike
  }

  const value = String(dateLike).trim()
  const dateOnly = value.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (
      date.getFullYear() !== Number(year)
      || date.getMonth() !== Number(month) - 1
      || date.getDate() !== Number(day)
    ) return null
    return date
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getLocalDayNumber(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}

export function getDeadlineDays(deadlineLike, today = new Date()) {
  const deadline = parseLocalDate(deadlineLike)
  if (!deadline || Number.isNaN(today.getTime())) return Number.POSITIVE_INFINITY
  return getLocalDayNumber(deadline) - getLocalDayNumber(today)
}

export function formatDday(deadlineLike, today = new Date()) {
  const days = getDeadlineDays(deadlineLike, today)
  if (!Number.isFinite(days) || days === 0) return '-'
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`
}

export function formatDeadlineText(deadlineLike, today = new Date()) {
  const days = getDeadlineDays(deadlineLike, today)
  if (!Number.isFinite(days)) return '마감일 확인 필요'
  if (days === 0) return '오늘 마감'
  if (days > 0) return `마감까지 ${days}일 남음`
  return `마감 ${Math.abs(days)}일 지남`
}
