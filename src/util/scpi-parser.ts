/**
 * SCPI response parsing utilities.
 *
 * @packageDocumentation
 */

import { parseBlockHeader } from './binary-block.js';
import { Ok, Err, Result } from '../result.js';

/**
 * SCPI overflow pattern: 9.9E37 or 9.9E+37 indicates overflow in SCPI standard.
 */
const SCPI_OVERFLOW_PATTERN = /^[+-]?9\.9[Ee][+]?37$/;

/**
 * Valid SCPI number pattern: optional sign, digits, optional decimal, optional exponent.
 * Must match the entire string (after trimming).
 */
const SCPI_NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\d*\.?\d+)([Ee][+-]?\d+)?$/;

/**
 * Parse a SCPI numeric response.
 *
 * Handles standard numeric formats including scientific notation.
 * Returns Err for SCPI overflow value (9.9E37) with descriptive message.
 * Returns Err for invalid responses.
 *
 * @param response - String containing a numeric value
 * @returns Ok with parsed number, or Err with descriptive error
 *
 * @example
 * parseScpiNumber('1.234E+03')  // Ok(1234)
 * parseScpiNumber('9.9E37')     // Err('Overflow: 9.9E37')
 * parseScpiNumber('****')       // Err('Invalid number format: ****')
 */
export function parseScpiNumber(response: string): Result<number, Error> {
  const trimmed = response.trim();

  if (trimmed === '') {
    return Err(new Error('Invalid number format: empty string'));
  }

  // Check for SCPI overflow (9.9E37 or 9.9E+37)
  if (SCPI_OVERFLOW_PATTERN.test(trimmed)) {
    return Err(new Error(`Overflow: ${trimmed}`));
  }

  // Validate the entire string is a valid number
  if (!SCPI_NUMBER_PATTERN.test(trimmed)) {
    return Err(new Error(`Invalid number format: ${trimmed}`));
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return Err(new Error(`Invalid number format: ${trimmed}`));
  }

  return Ok(value);
}

/**
 * Parse a SCPI boolean response.
 *
 * Accepts standard SCPI boolean values:
 * - True: '1', 'ON', 'TRUE' (case-insensitive)
 * - False: '0', 'OFF', 'FALSE' (case-insensitive)
 *
 * @param response - String containing a boolean value
 * @returns Ok with boolean, or Err for unrecognized values
 *
 * @example
 * parseScpiBool('1')    // Ok(true)
 * parseScpiBool('ON')   // Ok(true)
 * parseScpiBool('0')    // Ok(false)
 * parseScpiBool('OFF')  // Ok(false)
 */
export function parseScpiBool(response: string): Result<boolean, Error> {
  const upper = response.trim().toUpperCase();

  if (upper === '1' || upper === 'ON' || upper === 'TRUE') {
    return Ok(true);
  }

  if (upper === '0' || upper === 'OFF' || upper === 'FALSE') {
    return Ok(false);
  }

  if (upper === '') {
    return Err(new Error('Invalid boolean format: empty string'));
  }

  return Err(new Error(`Unknown boolean value: ${response.trim()}`));
}

/**
 * Parse a SCPI enumerated response.
 *
 * Maps instrument response values to application values using a provided mapping.
 * Matching is case-insensitive.
 *
 * @param response - String containing an enum value
 * @param mapping - Object mapping SCPI values to result values
 * @returns Ok with mapped value, or Err if not found
 *
 * @example
 * const modes = { 'VOLT': 'voltage', 'CURR': 'current' };
 * parseScpiEnum('VOLT', modes);  // Ok('voltage')
 * parseScpiEnum('volt', modes);  // Ok('voltage') (case-insensitive)
 */
export function parseScpiEnum<T>(response: string, mapping: Record<string, T>): Result<T, Error> {
  const trimmed = response.trim();
  const upper = trimmed.toUpperCase();

  if (trimmed === '') {
    return Err(new Error('Invalid enum format: empty string'));
  }

  // Look for a case-insensitive match in the mapping keys
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toUpperCase() === upper) {
      return Ok(value);
    }
  }

  const validValues = Object.keys(mapping).join(', ');
  return Err(new Error(`Unknown enum value: ${trimmed}, expected one of: ${validValues}`));
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
 * @returns Ok with header/data length info, or Err if invalid
 *
 * @example
 * const buf = Buffer.from('#9000001200...');
 * const info = parseDefiniteLengthBlock(buf);
 * // Ok({ header: 11, length: 1200 })
 */
export function parseDefiniteLengthBlock(buffer: Buffer): Result<ScpiBlockInfo, Error> {
  if (buffer.length === 0) {
    return Err(new Error('Invalid block header: empty buffer'));
  }

  if (buffer[0] !== 0x23) {
    return Err(new Error('Invalid block header: missing # prefix'));
  }

  if (buffer.length < 2) {
    return Err(new Error('Invalid block header: buffer too short'));
  }

  // Reject indefinite length blocks (#0)
  if (buffer[1] === 0x30) {
    return Err(new Error('Invalid definite length block: got indefinite length (#0)'));
  }

  const result = parseBlockHeader(buffer);
  if (!result) {
    return Err(new Error('Invalid block header: malformed header'));
  }

  return Ok({ header: result.headerLength, length: result.dataLength });
}

/**
 * Parse an IEEE 488.2 arbitrary (indefinite length) block header.
 *
 * Format: #0<data>\n
 * The data continues until a newline character is encountered.
 * If no newline is found, all remaining data after #0 is treated as the block content.
 *
 * This function only accepts indefinite length blocks (#0).
 *
 * @param buffer - Buffer starting with #0
 * @returns Ok with header/data length info, or Err if invalid
 *
 * @example
 * const buf = Buffer.from('#0hello world\n');
 * const info = parseArbitraryBlock(buf);
 * // Ok({ header: 2, length: 11 })
 */
export function parseArbitraryBlock(buffer: Buffer): Result<ScpiBlockInfo, Error> {
  if (buffer.length === 0) {
    return Err(new Error('Invalid block header: empty buffer'));
  }

  if (buffer[0] !== 0x23) {
    return Err(new Error('Invalid block header: missing # prefix'));
  }

  if (buffer.length < 2) {
    return Err(new Error('Invalid block header: buffer too short'));
  }

  // Only accept indefinite length blocks (#0)
  if (buffer[1] !== 0x30) {
    return Err(new Error('Invalid arbitrary block: expected #0, got definite length'));
  }

  const result = parseBlockHeader(buffer);
  if (!result) {
    return Err(new Error('Invalid block header: malformed header'));
  }

  return Ok({ header: result.headerLength, length: result.dataLength });
}
