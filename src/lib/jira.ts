import { z } from 'zod'

export const jiraUrlSchema = z.object({
  jiraBaseUrl: z
    .string()
    .trim()
    .min(1, 'La URL de Jira es obligatoria')
    .url('La URL no es válida')
    .refine(
      (value) => /^https?:\/\//i.test(value),
      'Debe comenzar con http:// o https://',
    ),
})

export type JiraUrlFormValues = z.infer<typeof jiraUrlSchema>

/**
 * Users paste whatever URL they have at hand: the board, the project or a direct
 * issue link. Instances are always served from an Atlassian Cloud subdomain, so
 * only "{protocolo}://{dominio}" is kept and every route after it is discarded.
 */
export function normalizeJiraBaseUrl(input: string): string {
  const trimmedInput = input.trim()

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedInput)
  } catch {
    // Unparsable input is reported by jiraUrlSchema; keep it as typed.
    return trimmedInput.replace(/\/+$/, '')
  }

  // "origin" is exactly "{protocolo}://{dominio}": it drops path, query and
  // hash, and normalizes the host to lowercase.
  return parsedUrl.origin
}

/** Direct link to an issue, e.g. "https://acme.atlassian.net/browse/SP-1". */
export function buildIssueUrl(issueKey: string, jiraBaseUrl: string): string {
  const normalizedKey = issueKey.trim()
  if (normalizedKey === '') return ''

  // Normalized defensively: the caller may still hold a full pasted URL.
  const baseUrl = normalizeJiraBaseUrl(jiraBaseUrl)
  if (baseUrl === '') return ''

  return `${baseUrl}/browse/${encodeURIComponent(normalizedKey)}`
}

/** Human label for the instance, shown as the destination of the links. */
export function jiraBaseUrlLabel(jiraBaseUrl: string): string {
  try {
    return new URL(jiraBaseUrl).hostname
  } catch {
    return jiraBaseUrl
  }
}