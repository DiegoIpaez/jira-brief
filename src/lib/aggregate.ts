import type { Issue } from './csv'
import { hasNoTime } from '../utils/time.util'

export type AssigneeTotal = {
  assignee: string
  seconds: number
  issueCount: number
}

export function sumSeconds(rows: Issue[]): number {
  return rows.reduce((totalSeconds, issue) => totalSeconds + issue.seconds, 0)
}

export function countWithoutTime(rows: Issue[]): number {
  return rows.filter((issue) => hasNoTime(issue.seconds)).length
}

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