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

export function normalizeJiraBaseUrl(input: string): string {
  const trimmedInput = input.trim()

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedInput)
  } catch {
    return trimmedInput.replace(/\/+$/, '')
  }

  return parsedUrl.origin
}

export function buildIssueUrl(issueKey: string, jiraBaseUrl: string): string {
  const normalizedKey = issueKey.trim()
  if (normalizedKey === '') return ''

  const baseUrl = normalizeJiraBaseUrl(jiraBaseUrl)
  if (baseUrl === '') return ''

  return `${baseUrl}/browse/${encodeURIComponent(normalizedKey)}`
}

export function jiraBaseUrlLabel(jiraBaseUrl: string): string {
  try {
    return new URL(jiraBaseUrl).hostname
  } catch {
    return jiraBaseUrl
  }
}