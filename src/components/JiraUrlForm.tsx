import { useForm } from '@tanstack/react-form'
import { jiraUrlSchema, normalizeJiraBaseUrl } from '../lib/jira'
import { readValidationMessages } from '../lib/validation'

type Props = {
  /** Previously accepted URL, so going back to this step keeps the value. */
  initialUrl: string
  onSubmitUrl: (jiraBaseUrl: string) => void
  onCancel: (() => void) | null
}

export function JiraUrlForm({ initialUrl, onSubmitUrl, onCancel }: Props) {
  const form = useForm({
    defaultValues: {
      jiraBaseUrl: initialUrl,
    },
    validators: {
      onChange: jiraUrlSchema,
      onBlur: jiraUrlSchema,
    },
    onSubmit: ({ value }) => {
      onSubmitUrl(normalizeJiraBaseUrl(value.jiraBaseUrl))
    },
  })

  return (
    <form
      className="jira-url-card"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <label className="field" htmlFor="jiraBaseUrl">
        <span>URL del tablero de Jira</span>
        <form.Field
          name="jiraBaseUrl"
          // TanStack Form exposes the field instance through a render prop,
          // which is by design and not the same as passing JSX children.
          // oxlint-disable-next-line react/no-children-prop
          children={(field) => {
            const errorMessages = readValidationMessages(field.state.meta.errors)
            const hasErrors = errorMessages.length > 0

            return (
              <>
                <input
                  id="jiraBaseUrl"
                  name={field.name}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://tu-organizacion.atlassian.net"
                  value={field.state.value}
                  aria-invalid={hasErrors}
                  aria-describedby={hasErrors ? 'jiraBaseUrl-error' : 'jiraBaseUrl-hint'}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {hasErrors ? (
                  <span className="field-error" id="jiraBaseUrl-error" role="alert">
                    {errorMessages.join(' · ')}
                  </span>
                ) : (
                  <span className="field-hint" id="jiraBaseUrl-hint">
                    Podés pegar la URL del tablero, del proyecto o de una incidencia: se usa como
                    destino de los enlaces de cada ticket.
                  </span>
                )}
              </>
            )
          }}
        />
      </label>

      <div className="jira-url-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              Continuar
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}