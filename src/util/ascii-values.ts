/**
 * ASCII value parsing utilities for SCPI instrument responses.
 *
 * @packageDocumentation
 */

import type { AsciiValuesOptions } from '../types.js';

/**
 * Parses ASCII values from a string response.
 *
 * @param response - String containing values (e.g., "1.23,4.56,7.89")
 * @param options - Parse options (separator, converter)
 * @returns Array of numbers. NaN values are filtered out.
 *
 * @example
 * parseAsciiValues("1.23,4.56,7.89") // [1.23, 4.56, 7.89]
 * parseAsciiValues("1;2;3", { separator: ";" }) // [1, 2, 3]
 */
export function parseAsciiValues(response: string, options?: AsciiValuesOptions): number[] {
  if (response.trim() === '') {
    return [];
  }

  const separator = options?.separator ?? /[\s,]+/;
  const converter = options?.converter ?? parseFloat;

  const parts =
    typeof separator === 'string' ? response.split(separator) : response.split(separator);

  return parts.map((s) => converter(s.trim())).filter((n) => !isNaN(n));
}
