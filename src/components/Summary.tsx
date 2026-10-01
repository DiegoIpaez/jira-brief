import { formatDuration } from '../utils/time.util'
import { countWithoutTime, summarizeByAssignee } from '../lib/aggregate'
import type { Issue } from '../lib/csv'

type Props = {
  rows: Issue[]
  totalSeconds: number
}

export function Summary({ rows, totalSeconds }: Props) {
  const assigneeTotals = summarizeByAssignee(rows)
  const withoutTimeCount = countWithoutTime(rows)

  return (
    <div className="summary">
      <div className="cards">
        <div className="card">
          <span className="card-value">{rows.length}</span>
          <span className="card-label">Incidencias incluidas</span>
        </div>
        <div className="card">
          <span className="card-value">{formatDuration(totalSeconds)}</span>
          <span className="card-label">Tiempo total</span>
        </div>
        <div className="card">
          <span className="card-value">{withoutTimeCount}</span>
          <span className="card-label">Sin tiempo registrado</span>
        </div>
      </div>

      <h2 className="summary-title">Horas por persona asignada</h2>
      {assigneeTotals.length === 0 ? (
        <p className="empty">Sin datos para el rango seleccionado.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Persona asignada</th>
                <th className="num">Incidencias</th>
                <th className="num">Tiempo empleado</th>
              </tr>
            </thead>
            <tbody>
              {assigneeTotals.map((assigneeTotal) => (
                <tr key={assigneeTotal.assignee}>
                  <td>{assigneeTotal.assignee}</td>
                  <td className="num">{assigneeTotal.issueCount}</td>
                  <td className="num">{formatDuration(assigneeTotal.seconds)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                <td className="num">{rows.length}</td>
                <td className="num">{formatDuration(totalSeconds)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}