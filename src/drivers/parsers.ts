/**
 * SCPI response parsers and value formatters for driver implementations.
 *
 * @packageDocumentation
 */

/**
 * Parses a SCPI number response to a JavaScript number.
 * Handles integers, floating point, and scientific notation.
 *
 * @param response - SCPI response string
 * @returns Parsed number, or NaN if not a valid number
 *
 * @example
 * parseScpiNumber('42')         // 42
 * parseScpiNumber('3.14159')    // 3.14159
 * parseScpiNumber('1.5E-3')     // 0.0015
 * parseScpiNumber('  42.5  \n') // 42.5
 */
export function parseScpiNumber(response: string): number {
  const trimmed = response.trim();
  if (trimmed === '') {
    return NaN;
  }
  return parseFloat(trimmed);
}

/**
 * Parses a SCPI boolean response to a JavaScript boolean.
 * Handles "0"/"1", "ON"/"OFF", and "TRUE"/"FALSE" (case insensitive).
 *
 * @param response - SCPI response string
 * @returns Parsed boolean (false for unrecognized values)
 *
 * @example
 * parseScpiBool('1')     // true
 * parseScpiBool('0')     // false
 * parseScpiBool('ON')    // true
 * parseScpiBool('OFF')   // false
 * parseScpiBool('TRUE')  // true
 * parseScpiBool('FALSE') // false
 */
export function parseScpiBool(response: string): boolean {
  const trimmed = response.trim().toUpperCase();
  return trimmed === '1' || trimmed === 'ON' || trimmed === 'TRUE';
}

/**
 * Parses a SCPI string response, removing quotes and whitespace.
 *
 * @param response - SCPI response string
 * @returns Cleaned string value
 *
 * @example
 * parseScpiString('"hello world"') // 'hello world'
 * parseScpiString("'test'")        // 'test'
 * parseScpiString('  value  \n')   // 'value'
 */
export function parseScpiString(response: string): string {
  let result = response.trim();

  // Remove surrounding double quotes
  if (result.startsWith('"') && result.endsWith('"')) {
    result = result.slice(1, -1);
  }
  // Remove surrounding single quotes
  else if (result.startsWith("'") && result.endsWith("'")) {
    result = result.slice(1, -1);
  }

  return result;
}

/**
 * Formats a JavaScript number for SCPI command.
 * Uses standard JavaScript number formatting.
 *
 * @param value - Number to format
 * @returns Formatted string suitable for SCPI command
 *
 * @example
 * formatScpiNumber(42)       // '42'
 * formatScpiNumber(3.14159)  // '3.14159'
 * formatScpiNumber(0.000001) // '0.000001' or '1e-6'
 */
export function formatScpiNumber(value: number): string {
  return String(value);
}

/**
 * Formats a JavaScript boolean for SCPI command.
 * Returns 'ON' for true, 'OFF' for false.
 *
 * @param value - Boolean to format
 * @returns 'ON' or 'OFF'
 *
 * @example
 * formatScpiBool(true)  // 'ON'
 * formatScpiBool(false) // 'OFF'
 */
export function formatScpiBool(value: boolean): string {
  return value ? 'ON' : 'OFF';
}

/**
 * Formats a JavaScript string for SCPI command.
 * Adds quotes if the string contains spaces or special characters.
 *
 * @param value - String to format
 * @returns Formatted string, quoted if necessary
 *
 * @example
 * formatScpiString('hello')       // 'hello'
 * formatScpiString('hello world') // '"hello world"'
 */
export function formatScpiString(value: string): string {
  if (value === '') {
    return '';
  }

  // Add quotes if contains spaces or special characters
  if (/[\s,;]/.test(value)) {
    return `"${value}"`;
  }

  return value;
}
