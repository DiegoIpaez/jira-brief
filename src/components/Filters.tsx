import { fieldLabel, type DateField } from '../lib/date'

type Props = {
  fromDate: string
  toDate: string
  field: DateField
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  onFieldChange: (value: DateField) => void
}

export function Filters({
  fromDate,
  toDate,
  field,
  onFromDateChange,
  onToDateChange,
  onFieldChange,
}: Props) {
  return (
    <div className="filters">
      <div className="field">
        <label htmlFor="from">Desde</label>
        <input
          id="from"
          type="date"
          value={fromDate}
          onChange={(event) => onFromDateChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="to">Hasta</label>
        <input
          id="to"
          type="date"
          value={toDate}
          onChange={(event) => onToDateChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="field">Filtrar por fecha</label>
        <select
          id="field"
          value={field}
          onChange={(event) => onFieldChange(event.target.value as DateField)}
        >
          <option value="updated">Actualizada</option>
          <option value="created">Creada</option>
        </select>
      </div>

      <p className="filters-note">
        Rango inclusivo en ambos extremos, aplicado sobre la columna {fieldLabel(field)}.
      </p>
    </div>
  )
}