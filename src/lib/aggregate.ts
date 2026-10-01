import type { Issue } from './csv'
import { hasNoTime } from './time'

/** Logged time and issue count for a single assignee. */
export type AssigneeTotal = {
  assignee: string
  seconds: number
  issueCount: number
}

/** Sum of the time logged in every issue, in seconds. */
export function sumSeconds(rows: Issue[]): number {
  return rows.reduce((totalSeconds, issue) => totalSeconds + issue.seconds, 0)
}

/** How many issues have no usable time: empty, non-numeric or under 30 s. */
export function countWithoutTime(rows: Issue[]): number {
  return rows.filter((issue) => hasNoTime(issue.seconds)).length
}

/**
 * Time per assignee, sorted by descending time and then by name so the report
 * stays stable between two exports of the same data.
 */
export function summarizeByAssignee(rows: Issue[]): AssigneeTotal[] {
  const totalsByAssignee = new Map<string, AssigneeTotal>()

  for (const issue of rows) {
    const currentTotal = totalsByAssignee.get(issue.assignee) ?? {
      assignee: issue.assignee,
      seconds: 0,
      issueCount: 0,
    }
    currentTotal.seconds += issue.seconds
    currentTotal.issueCount += 1
    totalsByAssignee.set(issue.assignee, currentTotal)
  }

  return [...totalsByAssignee.values()].sort(
    (leftTotal, rightTotal) =>
      rightTotal.seconds - leftTotal.seconds ||
      leftTotal.assignee.localeCompare(rightTotal.assignee, 'es'),
  )
}