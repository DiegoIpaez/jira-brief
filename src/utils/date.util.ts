export type DateField = 'created' | 'updated'

export type DateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const MONTH_ABBREVIATIONS: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
}

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const JIRA_DATE_PATTERN =
  /^(\d{1,2})\/([a-záé]{3,})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i

export function parseJiraDate(value: string): DateParts | null {
  const trimmedValue = (value ?? '').trim()
  if (!trimmedValue) return null

  const match = JIRA_DATE_PATTERN.exec(trimmedValue)
  if (!match) return null

  const [, dayText, monthText, yearText, hourText, minuteText, meridiemText] = match

  const month = MONTH_ABBREVIATIONS[monthText.toLowerCase()]
  if (month === undefined) return null

  const day = Number(dayText)
  const hourIn12HourClock = Number(hourText)
  const minute = Number(minuteText)

  let year = Number(yearText)
  if (year < 100) year = year <= 68 ? 2000 + year : 1900 + year

  if (day < 1 || day > 31 || hourIn12HourClock < 1 || hourIn12HourClock > 12 || minute > 59) {
    return null
  }

  let hour = hourIn12HourClock % 12
  if (meridiemText.toLowerCase() === 'pm') hour += 12

  return { year, month, day, hour, minute }
}

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

export function dayKey(dateParts: DateParts): number {
  return dateParts.year * 10000 + dateParts.month * 100 + dateParts.day
}

export function formatShortDate(dateParts: DateParts): string {
  const twoDigitYear = String(dateParts.year).slice(-2)
  return `${padTwoDigits(dateParts.day)}/${padTwoDigits(dateParts.month)}/${twoDigitYear}`
}

export function formatDateTime(dateParts: DateParts): string {
  const day = padTwoDigits(dateParts.day)
  const month = padTwoDigits(dateParts.month)
  const hour = padTwoDigits(dateParts.hour)
  const minute = padTwoDigits(dateParts.minute)
  return `${day}/${month}/${dateParts.year} ${hour}:${minute}`
}

const FIELD_LABEL: Record<DateField, string> = {
  created: 'Creada',
  updated: 'Actualizada',
}

export function fieldLabel(field: DateField): string {
  return FIELD_LABEL[field]
}

export function formatLongDate(isoDate: string): string {
  const [yearText, monthText, dayText] = isoDate.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!year || !month || !day) return isoDate
  return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`
}