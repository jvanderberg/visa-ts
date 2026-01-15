/**
 * Base instrument interface that all equipment types extend.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';
import type { MessageBasedResource } from '../../resources/message-based-resource.js';

/**
 * Identity information from *IDN? response.
 *
 * Standard format: <manufacturer>,<model>,<serial>,<firmware>
 */
export interface InstrumentIdentity {
  /** Manufacturer name (e.g., "Rigol", "Keysight") */
  manufacturer: string;

  /** Model number (e.g., "DS1054Z", "34465A") */
  model: string;

  /** Serial number */
  serialNumber: string;

  /** Firmware version */
  firmwareVersion: string;
}

/**
 * SCPI error structure from :SYST:ERR? query.
 *
 * Standard format: <code>,"<message>"
 * Example: -100,"Command error"
 * No error: 0,"No error"
 */
export interface InstrumentError {
  /** SCPI error code (0 means no error, negative numbers are standard errors) */
  code: number;

  /** Error message */
  message: string;
}

/**
 * Base interface for all instrument types.
 *
 * Provides common operations available on all SCPI instruments:
 * - Identity information
 * - Reset and clear operations
 * - Self-test
 * - Error query
 * - Capability checking
 * - Raw resource access (escape hatch)
 *
 * @example
 * ```typescript
 * // All instruments support these operations
 * await instr.reset();
 * await instr.clear();
 * const passed = await instr.selfTest();
 * const error = await instr.getError();
 * ```
 */
export interface BaseInstrument {
  // ─────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────

  /** VISA resource string used to connect */
  readonly resourceString: string;

  /** Manufacturer name from *IDN? */
  readonly manufacturer: string;

  /** Model number from *IDN? */
  readonly model: string;

  /** Serial number from *IDN? */
  readonly serialNumber: string;

  /** Firmware version from *IDN? */
  readonly firmwareVersion: string;

  // ─────────────────────────────────────────────────────────────────
  // Raw Access
  // ─────────────────────────────────────────────────────────────────

  /**
   * Access to the underlying MessageBasedResource for escape hatch operations.
   *
   * Use this when the typed API doesn't support what you need:
   * @example
   * ```typescript
   * const result = await instr.resource.query(':CUSTOM:VENDOR:CMD?');
   * ```
   */
  readonly resource: MessageBasedResource;

  // ─────────────────────────────────────────────────────────────────
  // Capabilities
  // ─────────────────────────────────────────────────────────────────

  /** List of capabilities this instrument supports */
  readonly capabilities: readonly string[];

  /**
   * Check if this instrument has a specific capability.
   *
   * @param capability - The capability to check for
   * @returns true if the capability is supported
   *
   * @example
   * ```typescript
   * if (scope.hasCapability('protocol-decode')) {
   *   await scope.configureDecoder('i2c', { sda: 1, scl: 2 });
   * }
   * ```
   */
  hasCapability(capability: string): boolean;

  // ─────────────────────────────────────────────────────────────────
  // Common Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Reset the instrument to its default state.
   *
   * Sends the *RST command.
   */
  reset(): Promise<Result<void, Error>>;

  /**
   * Clear the instrument's status and error registers.
   *
   * Sends the *CLS command.
   */
  clear(): Promise<Result<void, Error>>;

  /**
   * Run the instrument's internal self-test.
   *
   * Sends the *TST? query and interprets the result.
   *
   * @returns true if self-test passed, false if failed
   */
  selfTest(): Promise<Result<boolean, Error>>;

  /**
   * Query the instrument's error queue.
   *
   * Sends the :SYST:ERR? query.
   *
   * @returns The next error from the queue, or null if no errors
   */
  getError(): Promise<Result<InstrumentError | null, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Connection
  // ─────────────────────────────────────────────────────────────────

  /**
   * Close the connection to this instrument.
   *
   * After calling close(), the instrument should not be used.
   */
  close(): Promise<Result<void, Error>>;
}

/**
 * Parse *IDN? response into InstrumentIdentity.
 *
 * Standard format: <manufacturer>,<model>,<serial>,<firmware>
 *
 * @param response - The raw *IDN? response
 * @returns Parsed identity information
 */
export function parseIdentity(response: string): InstrumentIdentity {
  const parts = response.trim().split(',');

  return {
    manufacturer: parts[0]?.trim() || 'Unknown',
    model: parts[1]?.trim() || 'Unknown',
    serialNumber: parts[2]?.trim() || 'Unknown',
    firmwareVersion: parts[3]?.trim() || 'Unknown',
  };
}

/**
 * Parse :SYST:ERR? response into InstrumentError or null.
 *
 * Standard format: <code>,"<message>"
 * Example: -100,"Command error"
 * No error: 0,"No error"
 *
 * @param response - The raw :SYST:ERR? response
 * @returns Error object or null if no error
 */
export function parseError(response: string): InstrumentError | null {
  const trimmed = response.trim();

  // Match pattern: number,"message" or number,'message' or just number,message
  const match = trimmed.match(/^(-?\d+)\s*,\s*["']?(.*)["']?$/);

  if (!match) {
    return { code: -1, message: `Failed to parse error: ${trimmed}` };
  }

  const code = parseInt(match[1]!, 10);
  const message = match[2]!.replace(/["']$/, '').trim();

  // SCPI standard: 0 means no error
  if (code === 0) {
    return null;
  }

  return { code, message };
}
