import Papa from 'papaparse'
import { dayKey, parseJiraDate, type DateParts } from '../utils/date.util'

export type Issue = {
  issueKey: string
  summary: string
  assignee: string
  status: string
  created: DateParts
  updated: DateParts
  seconds: number
}

export type ParseResult =
  | { ok: true; rows: Issue[]; skipped: number; min: DateParts; max: DateParts }
  | { ok: false; error: string }

const COLUMN_FIELDS = [
  'issueKey',
  'summary',
  'timeSpent',
  'assignee',
  'status',
  'created',
  'updated',
] as const

type ColumnField = (typeof COLUMN_FIELDS)[number]

const COLUMN_ALIASES: Record<ColumnField, readonly string[]> = {
  issueKey: ['Clave de incidencia', 'Issue key'],
  summary: ['Resumen', 'Summary'],
  timeSpent: ['Σ Tiempo empleado', 'Σ Time Spent', 'Tiempo empleado', 'Time Spent'],
  assignee: ['Persona asignada', 'Assignee'],
  status: ['Estado', 'Status'],
  created: ['Creada', 'Created'],
  updated: ['Actualizada', 'Updated'],
}

type ResolvedColumns = Record<ColumnField, string>

type ColumnResolution = { ok: true; columns: ResolvedColumns } | { ok: false; missing: ColumnField[] }

function normalizeHeader(header: string): string {
  return (header ?? '').replace(/^﻿/, '').trim()
}

function headerMatchKey(header: string): string {
  return normalizeHeader(header)
    .replace(/Σ/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function missingColumnLabel(field: ColumnField): string {
  return COLUMN_ALIASES[field].join(' / ')
}

function resolveColumns(rawHeaders: string[]): ColumnResolution {
  const availableHeaders = new Map<string, string>()

  for (const rawHeader of rawHeaders) {
    availableHeaders.set(headerMatchKey(rawHeader), rawHeader)
  }

  const columns = {} as ResolvedColumns
  const missing: ColumnField[] = []

  for (const field of COLUMN_FIELDS) {
    const matchedHeader = COLUMN_ALIASES[field]
      .map((alias) => availableHeaders.get(headerMatchKey(alias)))
      .find((header) => header !== undefined)

    if (matchedHeader === undefined) {
      missing.push(field)
      continue
    }

    columns[field] = matchedHeader
  }

  return missing.length > 0 ? { ok: false, missing } : { ok: true, columns }
}

function parseSeconds(value: string): number {
  const trimmed = (value ?? '').trim()
  const numericValue = Number(trimmed)
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue
  }
  return 0
}

function findDateExtremes(issues: Issue[]): { min: DateParts; max: DateParts } {
  const allDates = issues.flatMap((issue) => [issue.created, issue.updated])
  const datesByDay = [...allDates].sort(
    (leftDate, rightDate) => dayKey(leftDate) - dayKey(rightDate),
  )

  return {
    min: datesByDay[0],
    max: datesByDay[datesByDay.length - 1],
  }
}

export function parseCsv(text: string): ParseResult {
  const parseResult = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
  })

  const rawHeaders = parseResult.meta.fields ?? []
  const headerFields = rawHeaders.map(normalizeHeader)
  const resolution = resolveColumns(rawHeaders)

  if (!resolution.ok) {
    const foundList = headerFields.length > 0 ? headerFields.join(', ') : '(ninguna)'
    const missingList = resolution.missing.map(missingColumnLabel).join(', ')
    return {
      ok: false,
      error: `Faltan columnas obligatorias en el CSV: ${missingList}. Se encontraron: ${foundList}.`,
    }
  }

  const { columns } = resolution
  const issues: Issue[] = []
  let skippedCount = 0

  for (const rawRow of parseResult.data) {
    const createdParts = parseJiraDate(normalizeHeader(rawRow[columns.created]))
    const updatedParts = parseJiraDate(normalizeHeader(rawRow[columns.updated]))

    if (!createdParts || !updatedParts) {
      skippedCount += 1
      continue
    }

    const issueKey = normalizeHeader(rawRow[columns.issueKey])
    const summary = normalizeHeader(rawRow[columns.summary])
    const assigneeRaw = normalizeHeader(rawRow[columns.assignee])
    const statusRaw = normalizeHeader(rawRow[columns.status])

    issues.push({
      issueKey,
      summary,
      assignee: assigneeRaw || 'Sin asignar',
      status: statusRaw || '—',
      created: createdParts,
      updated: updatedParts,
      seconds: parseSeconds(rawRow[columns.timeSpent]),
    })
  }

  if (issues.length === 0) {
    const errorMessage =
      skippedCount > 0
        ? `Se omitieron las ${skippedCount} filas porque sus fechas no se pudieron interpretar.`
        : 'El CSV no contiene filas de datos.'
    return { ok: false, error: errorMessage }
  }

  return { ok: true, rows: issues, skipped: skippedCount, ...findDateExtremes(issues) }
}
