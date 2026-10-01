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

/** Path segments that start an application route, e.g. "/browse/SP-1". */
const APP_ROUTE_SEGMENTS = [
  'browse',
  'projects',
  'issues',
  'jql',
  'secure',
  'dashboard',
  'plugins',
  'servicedesk',
]

/** Cloud serves the app under "/jira/software" or "/jira/platform". */
const CLOUD_APP_SEGMENTS = ['software', 'platform', 'sd']

function toComparableSegment(pathSegment: string): string {
  return pathSegment.toLowerCase()
}

/**
 * Returns the index where the application route starts, or -1 when the whole
 * path is just the instance context path.
 *
 * "jira" is ambiguous: it is the cloud app prefix ("/jira/software/...") but also
 * the context path of self-hosted instances ("/jira/browse/SP-1"). It only counts
 * as an app prefix when a cloud app segment follows it.
 */
function findAppRouteIndex(pathSegments: string[]): number {
  return pathSegments.findIndex((pathSegment, segmentIndex) => {
    const segment = toComparableSegment(pathSegment)

    if (APP_ROUTE_SEGMENTS.includes(segment)) return true

    if (segment === 'jira') {
      const nextSegment = pathSegments[segmentIndex + 1]
      return (
        nextSegment !== undefined &&
        CLOUD_APP_SEGMENTS.includes(toComparableSegment(nextSegment))
      )
    }

    return false
  })
}

/**
 * Users paste whatever URL they have at hand: the board, the project or a direct
 * issue link. Only the instance root is needed to build `/browse/{key}` links, so
 * the application route is trimmed while a custom context path is preserved.
 */
export function normalizeJiraBaseUrl(input: string): string {
  const trimmedInput = input.trim()

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedInput)
  } catch {
    return trimmedInput.replace(/\/+$/, '')
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
  const appRouteIndex = findAppRouteIndex(pathSegments)

  // Everything before the application route is the context path of the instance.
  const contextPathSegments =
    appRouteIndex === -1 ? pathSegments : pathSegments.slice(0, appRouteIndex)

  return `${parsedUrl.origin}/${contextPathSegments.join('/')}`.replace(/\/+$/, '')
}

/** Direct link to an issue, e.g. "https://acme.atlassian.net/browse/SP-1". */
export function buildIssueUrl(issueKey: string, jiraBaseUrl: string): string {
  const normalizedKey = issueKey.trim()
  if (normalizedKey === '') return ''

  return `${jiraBaseUrl.replace(/\/+$/, '')}/browse/${encodeURIComponent(normalizedKey)}`
}

/** Human label for the instance, shown as the destination of the links. */
export function jiraBaseUrlLabel(jiraBaseUrl: string): string {
  try {
    return new URL(jiraBaseUrl).hostname
  } catch {
    return jiraBaseUrl
  }
}