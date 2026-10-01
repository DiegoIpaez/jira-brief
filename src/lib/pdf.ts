import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { formatDateTime, formatLongDate } from '../utils/date.util'
import { formatDuration } from '../utils/time.util'
import { countWithoutTime, sumSeconds, summarizeByAssignee } from './aggregate'
import { buildIssueUrl } from '../utils/jira.util'
import type { Issue } from './csv'

const BRAND_BLUE: [number, number, number] = [15, 63, 120]
const TEXT_GRAY: [number, number, number] = [110, 110, 110]
const ROW_GRAY: [number, number, number] = [242, 244, 247]
const FOOTER_GRAY: [number, number, number] = [150, 150, 150]
const LINK_BLUE: [number, number, number] = [26, 98, 193]

const PAGE_MARGIN = 14
const FOOTER_MARGIN = 8
const SUMMARY_SPACING = 10
const COUNTERS_SPACING = 8

export type ReportOptions = {
  rows: Issue[]
  fromDate: string
  toDate: string
  jiraBaseUrl: string
}

type WithLastTable = { lastAutoTable?: { finalY: number } }

function lastTableY(pdfDocument: unknown, fallbackY: number): number {
  const lastTable = (pdfDocument as WithLastTable).lastAutoTable
  return lastTable?.finalY ?? fallbackY
}

function drawHeader(pdfDocument: jsPDF, options: ReportOptions): void {
  pdfDocument.setFontSize(16)
  pdfDocument.setTextColor(...BRAND_BLUE)
  pdfDocument.setFont('helvetica', 'bold')
  pdfDocument.text('Reporte de tiempo empleado', PAGE_MARGIN, 18)

  pdfDocument.setFontSize(9)
  pdfDocument.setFont('helvetica', 'normal')
  pdfDocument.setTextColor(...TEXT_GRAY)
  pdfDocument.text(
    `Fecha desde: ${formatLongDate(options.fromDate)} — Fecha hasta: ${formatLongDate(options.toDate)}`,
    PAGE_MARGIN,
    25,
  )
}

function drawIssuesTable(pdfDocument: jsPDF, options: ReportOptions, totalSeconds: number): void {
  const tableBody = options.rows.map((issue) => [
    issue.issueKey,
    issue.summary,
    issue.assignee,
    issue.status,
    formatDateTime(issue.created),
    formatDateTime(issue.updated),
    formatDuration(issue.seconds),
  ])

  const jiraBaseUrl = options.jiraBaseUrl.trim()

  autoTable(pdfDocument, {
    startY: 32,
    head: [
      [
        'Clave',
        'Resumen',
        'Persona asignada',
        'Estado',
        'Creada',
        'Actualizada',
        'Tiempo empleado',
      ],
    ],
    body: tableBody,
    foot: [['', 'Total general', '', '', '', '', formatDuration(totalSeconds)]],
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 18 },
    showHead: 'everyPage',
    pageBreak: 'auto',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', halign: 'left' },
    footStyles: { fillColor: ROW_GRAY, textColor: BRAND_BLUE, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: ROW_GRAY },
    columnStyles: {
      0: { cellWidth: 18, textColor: jiraBaseUrl === '' ? [0, 0, 0] : LINK_BLUE },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40 },
      3: { cellWidth: 24 },
      4: { cellWidth: 28, fontSize: 7 },
      5: { cellWidth: 28, fontSize: 7 },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      if (
        jiraBaseUrl === '' ||
        data.section !== 'body' ||
        data.column.index !== 0 ||
        data.cell.text === undefined
      ) {
        return
      }

      const issueKey = data.cell.text[0] ?? String(data.cell.raw ?? '')
      const issueUrl = buildIssueUrl(issueKey, jiraBaseUrl)
      if (issueUrl === '') return

      const padding = 2
      pdfDocument.link(
        data.cell.x + padding,
        data.cell.y + padding,
        data.cell.width - padding * 2,
        data.cell.height - padding * 2,
        { url: issueUrl },
      )
    },
  })
}

function drawAssigneeTable(pdfDocument: jsPDF, rows: Issue[], totalSeconds: number): void {
  const assigneeTotals = summarizeByAssignee(rows)
  const tableBody = assigneeTotals.map((assigneeTotal) => [
    assigneeTotal.assignee,
    String(assigneeTotal.issueCount),
    formatDuration(assigneeTotal.seconds),
  ])

  autoTable(pdfDocument, {
    startY: lastTableY(pdfDocument, 60) + SUMMARY_SPACING,
    head: [['Persona asignada', 'Incidencias', 'Tiempo empleado']],
    body: tableBody,
    foot: [['Total', String(rows.length), formatDuration(totalSeconds)]],
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 18 },
    showHead: 'everyPage',
    pageBreak: 'auto',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: ROW_GRAY, textColor: BRAND_BLUE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ROW_GRAY },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  })
}

function drawCounters(pdfDocument: jsPDF, rows: Issue[]): void {
  const withoutTimeCount = countWithoutTime(rows)

  pdfDocument.setFontSize(9)
  pdfDocument.setFont('helvetica', 'normal')
  pdfDocument.setTextColor(...TEXT_GRAY)
  pdfDocument.text(
    `Incidencias incluidas: ${rows.length} · Sin tiempo registrado: ${withoutTimeCount} de ${rows.length}`,
    PAGE_MARGIN,
    lastTableY(pdfDocument, 60) + COUNTERS_SPACING,
  )
}

function drawPageNumbers(pdfDocument: jsPDF, pageWidth: number): void {
  const pageCount = pdfDocument.getNumberOfPages()

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdfDocument.setPage(pageNumber)
    pdfDocument.setFontSize(8)
    pdfDocument.setTextColor(...FOOTER_GRAY)
    pdfDocument.text(
      `Página ${pageNumber} de ${pageCount}`,
      pageWidth - PAGE_MARGIN,
      pdfDocument.internal.pageSize.getHeight() - FOOTER_MARGIN,
      { align: 'right' },
    )
  }
}

export function buildPdf(options: ReportOptions) {
  const pdfDocument = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = pdfDocument.internal.pageSize.getWidth()
  const totalSeconds = sumSeconds(options.rows)

  drawHeader(pdfDocument, options)
  drawIssuesTable(pdfDocument, options, totalSeconds)
  drawAssigneeTable(pdfDocument, options.rows, totalSeconds)
  drawCounters(pdfDocument, options.rows)
  drawPageNumbers(pdfDocument, pageWidth)

  return pdfDocument
}

export function downloadPdf(options: ReportOptions): void {
  const fileName = `reporte-tiempo-${options.fromDate}_${options.toDate}.pdf`
  buildPdf(options).save(fileName)
}