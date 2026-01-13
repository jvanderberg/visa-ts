/**
 * Shared helper functions for simulated device implementations.
 *
 * These utilities handle common parsing, formatting, and validation tasks
 * used across device simulations (PSU, Load, Oscilloscope, DMM, etc.).
 *
 * @packageDocumentation
 */

/**
 * Property value type used in simulation device properties.
 * This is the default type parameter for Property<T> when T is not specified.
 */
export type PropertyValue = number | string | boolean;

// ============================================================================
// PARSERS - Extract values from RegExpMatchArray
// ============================================================================

/**
 * Parse a numeric value from a command match.
 *
 * @param match - RegExp match array where match[1] contains the numeric string
 * @returns Parsed number, or 0 if match[1] is undefined
 *
 * @example
 * ```typescript
 * // For command 'VOLT 12.5' matched by /^VOLT\s+([\d.]+)$/
 * const match = 'VOLT 12.5'.match(/^VOLT\s+([\d.]+)$/);
 * parseNumber(match); // Returns 12.5
 * ```
 */
export function parseNumber(match: RegExpMatchArray): number {
  return parseFloat(match[1] ?? '0');
}

/**
 * Parse a boolean state from a command match (ON/OFF/1/0).
 *
 * @param match - RegExp match array where match[1] contains the state string
 * @returns true for 'ON' or '1', false otherwise
 *
 * @example
 * ```typescript
 * // For command 'OUTP ON' matched by /^OUTP\s+(ON|OFF|1|0)$/i
 * const match = 'OUTP ON'.match(/^OUTP\s+(ON|OFF|1|0)$/i);
 * parseBooleanState(match); // Returns true
 * ```
 */
export function parseBooleanState(match: RegExpMatchArray): boolean {
  const val = (match[1] ?? '').toUpperCase();
  return val === 'ON' || val === '1';
}

/**
 * Parse a string value from a command match, converting to uppercase.
 *
 * @param match - RegExp match array where match[1] contains the string
 * @returns Uppercase string, or empty string if match[1] is undefined
 *
 * @example
 * ```typescript
 * // For command 'MODE cc' matched by /^MODE\s+(\w+)$/i
 * const match = 'MODE cc'.match(/^MODE\s+(\w+)$/i);
 * parseString(match); // Returns 'CC'
 * ```
 */
export function parseString(match: RegExpMatchArray): string {
  return (match[1] ?? '').toUpperCase();
}

/**
 * Parse an integer value from a command match.
 *
 * @param match - RegExp match array where match[1] contains the integer string
 * @returns Parsed integer, or 0 if match[1] is undefined
 */
export function parseInt10(match: RegExpMatchArray): number {
  return parseInt(match[1] ?? '0', 10);
}

// ============================================================================
// FORMATTERS - Convert values to response strings
// ============================================================================

/**
 * Create a formatter that outputs a number with fixed decimal places.
 *
 * Note: The returned function accepts PropertyValue for compatibility with
 * the Property<T> interface, but is designed for numeric properties only.
 * The cast is safe when used exclusively with number-typed property definitions.
 *
 * @param decimals - Number of decimal places
 * @returns Formatter function
 *
 * @example
 * ```typescript
 * const format3 = formatFixed(3);
 * format3(1.5); // Returns '1.500'
 *
 * const format6 = formatFixed(6);
 * format6(0.001); // Returns '0.001000'
 * ```
 */
export function formatFixed(decimals: number): (value: PropertyValue) => string {
  return (value: PropertyValue): string => {
    // Safe cast: This function is only used with numeric properties
    return (value as number).toFixed(decimals);
  };
}

/**
 * Format a boolean value as ON/OFF.
 *
 * @param value - Boolean or truthy/falsy value
 * @returns 'ON' or 'OFF'
 */
export function formatBooleanState(value: PropertyValue): string {
  return value ? 'ON' : 'OFF';
}

/**
 * Format a string value as-is.
 *
 * Note: The function accepts PropertyValue for compatibility with the Property<T>
 * interface, but is designed for string properties only.
 *
 * @param value - String value
 * @returns The string value unchanged
 */
export function formatString(value: PropertyValue): string {
  // Safe cast: This function is only used with string properties
  return value as string;
}

// ============================================================================
// VALIDATORS - Check if values are within acceptable ranges
// ============================================================================

/**
 * Create a validator that checks if a numeric value is within a range.
 *
 * Note: The returned function accepts PropertyValue for compatibility with
 * the Property<T> interface, but is designed for numeric properties only.
 * The cast is safe when used exclusively with number-typed property definitions.
 *
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns Validator function that returns true if value is within range
 *
 * @example
 * ```typescript
 * const validateVoltage = validateRange(0, 30);
 * validateVoltage(12.5); // Returns true
 * validateVoltage(50);   // Returns false
 * ```
 */
export function validateRange(min: number, max: number): (value: PropertyValue) => boolean {
  return (value: PropertyValue): boolean => {
    // Safe cast: This validator is only used with numeric properties
    const num = value as number;
    return num >= min && num <= max;
  };
}
