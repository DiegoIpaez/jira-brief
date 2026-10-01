import { useMemo, useState } from 'react'
import { FileSelector } from './components/FileSelector'
import { Filters } from './components/Filters'
import { JiraUrlForm } from './components/JiraUrlForm'
import { PreviewTable } from './components/PreviewTable'
import { Summary } from './components/Summary'
import { dayKey, fieldLabel, formatLongDate, type DateField } from './lib/date'
import { parseCsv, type Issue } from './lib/csv'
import { sumSeconds } from './lib/aggregate'
import { jiraBaseUrlLabel } from './lib/jira'

type WizardStep = 'jiraUrl' | 'csv'

/** Date parts -> "YYYY-MM-DD", the value format of <input type="date">. */
function toIsoInput(dateParts: { year: number; month: number; day: number }): string {
  const month = String(dateParts.month).padStart(2, '0')
  const day = String(dateParts.day).padStart(2, '0')
  return `${dateParts.year}-${month}-${day}`
}

/** "YYYY-MM-DD" -> comparable YYYYMMDD key. */
function isoToDayKey(isoDate: string): number {
  return Number(isoDate.replace(/-/g, ''))
}

export default function App() {
  const [wizardStep, setWizardStep] = useState<WizardStep>('jiraUrl')
  const [jiraBaseUrl, setJiraBaseUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Issue[]>([])
  const [skippedCount, setSkippedCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [field, setField] = useState<DateField>('updated')

  function handleJiraUrlSubmitted(submittedUrl: string): void {
    setJiraBaseUrl(submittedUrl)
    setWizardStep('csv')
  }

  function handleFileSelected(selectedFileName: string, fileText: string): void {
    const parseResult = parseCsv(fileText)

    if (!parseResult.ok) {
      setErrorMessage(parseResult.error)
      setRows([])
      setFileName('')
      return
    }

    setErrorMessage('')
    setFileName(selectedFileName)
    setRows(parseResult.rows)
    setSkippedCount(parseResult.skipped)
    // Preload the range with the file extremes so it does not start empty.
    setFromDate(toIsoInput(parseResult.min))
    setToDate(toIsoInput(parseResult.max))
  }

  function handleError(message: string): void {
    setErrorMessage(message)
    setRows([])
    setFileName('')
  }

  function resetToFilePicker(): void {
    setRows([])
    setFileName('')
    setErrorMessage('')
    setSkippedCount(0)
  }

  const isRangeInverted = fromDate !== '' && toDate !== '' && fromDate > toDate

  const filteredRows = useMemo(() => {
    if (isRangeInverted || fromDate === '' || toDate === '') return []

    const fromDayKey = isoToDayKey(fromDate)
    const toDayKey = isoToDayKey(toDate)

    return rows.filter((issue) => {
      const issueDate = field === 'created' ? issue.created : issue.updated
      const issueDayKey = dayKey(issueDate)
      return issueDayKey >= fromDayKey && issueDayKey <= toDayKey
    })
  }, [rows, fromDate, toDate, field, isRangeInverted])

  const totalSeconds = useMemo(() => sumSeconds(filteredRows), [filteredRows])

  // jsPDF (and its html2canvas/dompurify dependencies) weighs ~380 kB: it is loaded
  // only when the PDF is requested, not when the app opens.
  async function download(): Promise<void> {
    const { downloadPdf } = await import('./lib/pdf')
    downloadPdf({ rows: filteredRows, fromDate, toDate, field, fileName, jiraBaseUrl })
  }

  const hasFile = rows.length > 0
  const isCsvStep = wizardStep === 'csv'

  return (
    <div className="app">
      <header className="header">
        <h1>Reporte de horas · Jira</h1>
        <p className="subtitle">
          Indicá la URL de tu Jira, subí la exportación en CSV, elige el rango de fechas y
          descargá el reporte en PDF.
        </p>
      </header>

      <nav className="steps" aria-label="Etapas del reporte">
        <button
          type="button"
          className={`step ${isCsvStep ? 'is-done' : 'is-current'}`}
          aria-current={isCsvStep ? undefined : 'step'}
          onClick={() => setWizardStep('jiraUrl')}
        >
          <span className="step-number">1</span>
          <span className="step-text">
            <strong>URL de Jira</strong>
            <em>{jiraBaseUrl === '' ? 'Sin configurar' : jiraBaseUrlLabel(jiraBaseUrl)}</em>
          </span>
        </button>
        <button
          type="button"
          className={`step ${isCsvStep ? 'is-current' : ''} ${jiraBaseUrl === '' ? 'is-disabled' : ''}`}
          aria-current={isCsvStep ? 'step' : undefined}
          disabled={jiraBaseUrl === ''}
          onClick={() => setWizardStep('csv')}
        >
          <span className="step-number">2</span>
          <span className="step-text">
            <strong>CSV y rango de fechas</strong>
            <em>{hasFile ? fileName : 'Sin archivo'}</em>
          </span>
        </button>
      </nav>

      {errorMessage && (
        <div className="alert error" role="alert">
          {errorMessage}
        </div>
      )}

      {!isCsvStep ? (
        <JiraUrlForm
          initialUrl={jiraBaseUrl}
          onSubmitUrl={handleJiraUrlSubmitted}
          onCancel={jiraBaseUrl === '' ? null : () => setWizardStep('csv')}
        />
      ) : !hasFile ? (
        <FileSelector onFile={handleFileSelected} onError={handleError} />
      ) : (
        <>
          <div className="file-bar">
            <span>
              <strong>{fileName}</strong> · {rows.length} incidencias leídas
              {skippedCount > 0 && ` · ${skippedCount} omitidas por fecha inválida`}
            </span>
            <span className="file-bar-actions">
              <button type="button" className="btn-secondary" onClick={resetToFilePicker}>
                Cambiar archivo
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setWizardStep('jiraUrl')}
              >
                Cambiar URL de Jira
              </button>
            </span>
          </div>

          {skippedCount > 0 && (
            <div className="alert warning">
              Se omitieron {skippedCount} {skippedCount === 1 ? 'fila' : 'filas'} porque su fecha
              de creación o actualización no se pudo interpretar.
            </div>
          )}

          <Filters
            fromDate={fromDate}
            toDate={toDate}
            field={field}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onFieldChange={setField}
          />

          {isRangeInverted ? (
            <div className="alert error" role="alert">
              El rango está invertido: la fecha "Desde" es posterior a "Hasta".
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="alert warning">
              No hay incidencias en el rango {formatLongDate(fromDate)} —{' '}
              {formatLongDate(toDate)} usando la fecha {fieldLabel(field)}.
            </div>
          ) : (
            <>
              <div className="actions">
                <button type="button" className="btn-primary" onClick={download}>
                  Descargar PDF
                </button>
              </div>

              <PreviewTable
                rows={filteredRows}
                totalSeconds={totalSeconds}
                jiraBaseUrl={jiraBaseUrl}
              />
              <Summary rows={filteredRows} totalSeconds={totalSeconds} />
            </>
          )}
        </>
      )}
    </div>
  )
}