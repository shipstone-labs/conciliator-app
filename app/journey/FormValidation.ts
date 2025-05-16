/**
 * Utility functions for form validation in the journey flows
 */

/**
 * Validates that a string is not empty after trimming
 * @param value The string to validate
 * @returns True if the string is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim() !== ''
}

/**
 * Validates that a string meets a minimum length requirement after trimming
 * @param value The string to validate
 * @param minLength The minimum length required
 * @returns True if the string meets the minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength
}

/**
 * Creates a validation function that checks if all specified validation functions pass
 * @param validations Array of validation functions to check
 * @returns A function that returns true if all validations pass
 */
export function createValidator(...validations: boolean[]): boolean {
  return validations.every((isValid) => isValid)
}

/**
 * Utility to create a validation function for a form
 * @param checks Object mapping validation names to validation results
 * @returns True if all validations pass
 */
export function validateForm(checks: Record<string, boolean>): boolean {
  return Object.values(checks).every((isValid) => isValid)
}
