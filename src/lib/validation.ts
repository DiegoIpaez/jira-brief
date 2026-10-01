import type { StandardSchemaV1Issue } from '@tanstack/react-form'

/**
 * Validation errors are typed as a plain `string` for function validators and as
 * `StandardSchemaV1Issue[]` for schema validators. This helper normalizes both
 * shapes (and their combinations) into a list of messages to display.
 */
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