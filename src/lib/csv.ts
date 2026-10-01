import Papa from 'papaparse'
import { dayKey, parseJiraDate, type DateParts } from './date'

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

const COLUMNS = {
  issueKey: 'Clave de incidencia',
  summary: 'Resumen',
  timeSpent: 'Σ Tiempo empleado',
  assignee: 'Persona asignada',
  status: 'Estado',
  created: 'Creada',
  updated: 'Actualizada',
} as const

const REQUIRED_COLUMNS: string[] = [
  COLUMNS.issueKey,
  COLUMNS.summary,
  COLUMNS.timeSpent,
  COLUMNS.assignee,
  COLUMNS.status,
  COLUMNS.created,
  COLUMNS.updated,
]

function normalizeHeader(header: string): string {
  return (header ?? '').replace(/^﻿/, '').trim()
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

  const headerFields = (parseResult.meta.fields ?? []).map(normalizeHeader)
  const missingColumns = REQUIRED_COLUMNS.filter(
    (requiredColumn) => !headerFields.includes(requiredColumn),
  )

  if (missingColumns.length > 0) {
    const foundList = headerFields.length > 0 ? headerFields.join(', ') : '(ninguna)'
    const missingList = missingColumns.join(', ')
    return {
      ok: false,
      error: `Faltan columnas obligatorias en el CSV: ${missingList}. Se encontraron: ${foundList}.`,
    }
  }

  const issues: Issue[] = []
  let skippedCount = 0

  for (const rawRow of parseResult.data) {
    const createdParts = parseJiraDate(normalizeHeader(rawRow[COLUMNS.created]))
    const updatedParts = parseJiraDate(normalizeHeader(rawRow[COLUMNS.updated]))

    if (!createdParts || !updatedParts) {
      skippedCount += 1
      continue
    }

    const issueKey = normalizeHeader(rawRow[COLUMNS.issueKey])
    const summary = normalizeHeader(rawRow[COLUMNS.summary])
    const assigneeRaw = normalizeHeader(rawRow[COLUMNS.assignee])
    const statusRaw = normalizeHeader(rawRow[COLUMNS.status])

    issues.push({
      issueKey,
      summary,
      assignee: assigneeRaw || 'Sin asignar',
      status: statusRaw || '—',
      created: createdParts,
      updated: updatedParts,
      seconds: parseSeconds(rawRow[COLUMNS.timeSpent]),
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