import { formatDateTime } from '../lib/date'
import { buildIssueUrl } from '../lib/jira'
import { formatDuration } from '../lib/time'
import type { Issue } from '../lib/csv'

type Props = {
  rows: Issue[]
  totalSeconds: number
  jiraBaseUrl: string
}

function IssueKeyCell({ issueKey, jiraBaseUrl }: { issueKey: string; jiraBaseUrl: string }) {
  const issueUrl = buildIssueUrl(issueKey, jiraBaseUrl)

  if (issueUrl === '') {
    return <span className="issue-key">{issueKey}</span>
  }

  return (
    <a
      className="issue-key issue-link"
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Abrir ${issueKey} en Jira`}
    >
      {issueKey}
    </a>
  )
}

export function PreviewTable({ rows, totalSeconds, jiraBaseUrl }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Clave</th>
            <th>Resumen</th>
            <th>Persona asignada</th>
            <th>Estado</th>
            <th>Creada</th>
            <th>Actualizada</th>
            <th className="num">Tiempo empleado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((issue) => (
            <tr
              key={`${issue.issueKey}-${issue.updated.year}${issue.updated.month}${issue.updated.day}${issue.updated.hour}${issue.updated.minute}`}
            >
              <td>
                <IssueKeyCell issueKey={issue.issueKey} jiraBaseUrl={jiraBaseUrl} />
              </td>
              <td>{issue.summary}</td>
              <td>{issue.assignee}</td>
              <td>{issue.status}</td>
              <td className="date">{formatDateTime(issue.created)}</td>
              <td className="date">{formatDateTime(issue.updated)}</td>
              <td className="num">{formatDuration(issue.seconds)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={6}>Total general</td>
            <td className="num">{formatDuration(totalSeconds)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}