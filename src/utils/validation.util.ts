import type { StandardSchemaV1Issue } from '@tanstack/react-form'

export function readValidationMessages(errors: unknown): string[] {
  if (errors === undefined || errors === null) return []

  if (typeof errors === 'string') return errors === '' ? [] : [errors]

  if (Array.isArray(errors)) {
    return errors.flatMap(readValidationMessages)
  }

  if (typeof errors === 'object') {
    const possibleIssue = errors as StandardSchemaV1Issue
    if (typeof possibleIssue.message === 'string') {
      return possibleIssue.message === '' ? [] : [possibleIssue.message]
    }
    return Object.values(errors).flatMap(readValidationMessages)
  }

  return [String(errors)]
}