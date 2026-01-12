/**
 * SCPI response parsing utilities.
 *
 * @packageDocumentation
 */

import { parseBlockHeader } from './binary-block.js';

/**
 * SCPI overflow pattern: 9.9E37 or 9.9E+37 indicates overflow in SCPI standard.
 */
const SCPI_OVERFLOW_PATTERN = /^[+-]?9\.9[Ee][+]?37$/;

/**
 * Parse a SCPI numeric response.
 *
 * Handles standard numeric formats including scientific notation.
 * Returns Infinity for SCPI overflow value (9.9E37).
 * Returns NaN for invalid responses.
 *
 * @param response - String containing a numeric value
 * @returns Parsed number, Infinity for overflow, or NaN for invalid
 *
 * @example
 * parseScpiNumber('1.234E+03')  // 1234
 * parseScpiNumber('9.9E37')     // Infinity
 * parseScpiNumber('****')       // NaN
 */
export function parseScpiNumber(response: string): number {
  const trimmed = response.trim();

  if (trimmed === '') {
    return NaN;
  }

  // Check for SCPI overflow (9.9E37 or 9.9E+37)
  if (SCPI_OVERFLOW_PATTERN.test(trimmed)) {
    return trimmed.startsWith('-') ? -Infinity : Infinity;
  }

  return parseFloat(trimmed);
}

/**
 * Parse a SCPI boolean response.
 *
 * Accepts standard SCPI boolean values:
 * - True: '1', 'ON', 'TRUE' (case-insensitive)
 * - False: '0', 'OFF', 'FALSE' (case-insensitive)
 *
 * @param response - String containing a boolean value
 * @returns true, false, or null for unrecognized values
 *
 * @example
 * parseScpiBool('1')    // true
 * parseScpiBool('ON')   // true
 * parseScpiBool('0')    // false
 * parseScpiBool('OFF')  // false
 */
export function parseScpiBool(response: string): boolean | null {
  const upper = response.trim().toUpperCase();

  if (upper === '1' || upper === 'ON' || upper === 'TRUE') {
    return true;
  }

  if (upper === '0' || upper === 'OFF' || upper === 'FALSE') {
    return false;
  }

  return null;
}

/**
 * Parse a SCPI enumerated response.
 *
 * Maps instrument response values to application values using a provided mapping.
 * Matching is case-insensitive.
 *
 * @param response - String containing an enum value
 * @param mapping - Object mapping SCPI values to result values
 * @returns Mapped value or null if not found
 *
 * @example
 * const modes = { 'VOLT': 'voltage', 'CURR': 'current' };
 * parseScpiEnum('VOLT', modes);  // 'voltage'
 * parseScpiEnum('volt', modes);  // 'voltage' (case-insensitive)
 */
export function parseScpiEnum<T>(response: string, mapping: Record<string, T>): T | null {
  const trimmed = response.trim().toUpperCase();

  if (trimmed === '') {
    return null;
  }

  // Look for a case-insensitive match in the mapping keys
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toUpperCase() === trimmed) {
      return value;
    }
  }

  return null;
}

/**
 * Result of parsing an IEEE 488.2 block header for SCPI.
 */
export interface ScpiBlockInfo {
  /** Length of the header in bytes */
  header: number;
  /** Length of the data in bytes */
  length: number;
}

/**
 * Parse an IEEE 488.2 definite length block header.
 *
 * Format: #<numDigits><byteCount>
 * Example: #9000001200 means 1200 bytes of data follow
 *
 * This function only accepts definite length blocks (rejects #0).
 *
 * @param buffer - Buffer starting with the block header
 * @returns Object with header length and data length, or null if invalid
 *
 * @example
 * const buf = Buffer.from('#9000001200...');
 * const info = parseDefiniteLengthBlock(buf);
 * // info = { header: 11, length: 1200 }
 */
export function parseDefiniteLengthBlock(buffer: Buffer): ScpiBlockInfo | null {
  // Reject indefinite length blocks (#0)
  if (buffer.length >= 2 && buffer[1] === 0x30) {
    // 0x30 is '0'
    return null;
  }

  const result = parseBlockHeader(buffer);
  if (!result) {
    return null;
  }

  return { header: result.headerLength, length: result.dataLength };
}

/**
 * Parse an IEEE 488.2 arbitrary (indefinite length) block header.
 *
 * Format: #0<data>\n
 * The data continues until a newline character is encountered.
 *
 * This function only accepts indefinite length blocks (#0).
 *
 * @param buffer - Buffer starting with #0
 * @returns Object with header length and data length, or null if invalid
 *
 * @example
 * const buf = Buffer.from('#0hello world\n');
 * const info = parseArbitraryBlock(buf);
 * // info = { header: 2, length: 11 }
 */
export function parseArbitraryBlock(buffer: Buffer): ScpiBlockInfo | null {
  // Only accept indefinite length blocks (#0)
  if (buffer.length < 2 || buffer[0] !== 0x23 || buffer[1] !== 0x30) {
    return null;
  }

  const result = parseBlockHeader(buffer);
  if (!result) {
    return null;
  }

  return { header: result.headerLength, length: result.dataLength };
}
