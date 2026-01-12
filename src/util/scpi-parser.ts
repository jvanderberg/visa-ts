/**
 * SCPI response parsing utilities.
 *
 * @packageDocumentation
 */

/**
 * SCPI overflow pattern: 9.9E37 or 9.9E+37 indicates overflow in SCPI standard.
 */
const SCPI_OVERFLOW_PATTERN = /^[+-]?9\.9[Ee][+]?37$/;

/**
 * SCPI parser utilities for parsing instrument responses.
 */
export const ScpiParser = {
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
   * ScpiParser.parseNumber('1.234E+03')  // 1234
   * ScpiParser.parseNumber('9.9E37')     // Infinity
   * ScpiParser.parseNumber('****')       // NaN
   */
  parseNumber(response: string): number {
    const trimmed = response.trim();

    if (trimmed === '') {
      return NaN;
    }

    // Check for SCPI overflow (9.9E37 or 9.9E+37)
    if (SCPI_OVERFLOW_PATTERN.test(trimmed)) {
      return trimmed.startsWith('-') ? -Infinity : Infinity;
    }

    return parseFloat(trimmed);
  },

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
   * ScpiParser.parseBool('1')    // true
   * ScpiParser.parseBool('ON')   // true
   * ScpiParser.parseBool('0')    // false
   * ScpiParser.parseBool('OFF')  // false
   */
  parseBool(response: string): boolean | null {
    const upper = response.trim().toUpperCase();

    if (upper === '1' || upper === 'ON' || upper === 'TRUE') {
      return true;
    }

    if (upper === '0' || upper === 'OFF' || upper === 'FALSE') {
      return false;
    }

    return null;
  },

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
   * ScpiParser.parseEnum('VOLT', modes);  // 'voltage'
   * ScpiParser.parseEnum('volt', modes);  // 'voltage' (case-insensitive)
   */
  parseEnum<T>(response: string, mapping: Record<string, T>): T | null {
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
  },

  /**
   * Parse an IEEE 488.2 definite length block header.
   *
   * Format: #<numDigits><byteCount>
   * Example: #9000001200 means 1200 bytes of data follow
   *
   * @param buffer - Buffer starting with the block header
   * @returns Object with header length and data length, or null if invalid
   *
   * @example
   * const buf = Buffer.from('#9000001200...');
   * const info = ScpiParser.parseDefiniteLengthBlock(buf);
   * // info = { header: 11, length: 1200 }
   */
  parseDefiniteLengthBlock(buffer: Buffer): { header: number; length: number } | null {
    // Need at least 2 bytes for '#' and digit count
    if (buffer.length < 2 || buffer[0] !== 0x23) {
      // 0x23 is '#'
      return null;
    }

    const byte1 = buffer[1];
    if (byte1 === undefined) {
      return null;
    }

    const numDigitsChar = String.fromCharCode(byte1);

    // Reject indefinite length block (#0)
    if (numDigitsChar === '0') {
      return null;
    }

    const numDigits = parseInt(numDigitsChar, 10);
    if (isNaN(numDigits) || numDigits < 1 || numDigits > 9) {
      return null;
    }

    const headerLength = 2 + numDigits;
    if (buffer.length < headerLength) {
      return null;
    }

    const lengthStr = buffer.subarray(2, headerLength).toString('ascii');
    const dataLength = parseInt(lengthStr, 10);
    if (isNaN(dataLength)) {
      return null;
    }

    return { header: headerLength, length: dataLength };
  },

  /**
   * Parse an IEEE 488.2 arbitrary (indefinite length) block header.
   *
   * Format: #0<data>\n
   * The data continues until a newline character is encountered.
   *
   * @param buffer - Buffer starting with #0
   * @returns Object with header length and data length, or null if invalid
   *
   * @example
   * const buf = Buffer.from('#0hello world\n');
   * const info = ScpiParser.parseArbitraryBlock(buf);
   * // info = { header: 2, length: 11 }
   */
  parseArbitraryBlock(buffer: Buffer): { header: number; length: number } | null {
    // Need at least 2 bytes for '#0'
    if (buffer.length < 2 || buffer[0] !== 0x23) {
      return null;
    }

    const byte1 = buffer[1];
    if (byte1 === undefined) {
      return null;
    }

    const char1 = String.fromCharCode(byte1);

    // Must be #0 for indefinite length block
    if (char1 !== '0') {
      return null;
    }

    // Data ends with newline, or extends to end of buffer if no newline
    const newlineIndex = buffer.indexOf(0x0a, 2); // 0x0a is '\n'
    const dataLength = newlineIndex === -1 ? buffer.length - 2 : newlineIndex - 2;

    return { header: 2, length: dataLength };
  },
};
