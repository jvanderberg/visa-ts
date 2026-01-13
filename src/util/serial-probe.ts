/**
 * Serial port auto-baud detection utility
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';
import { createSerialTransport } from '../transports/serial.js';

/**
 * Default baud rates to try during auto-detection (most common first)
 */
const DEFAULT_BAUD_RATES = [115200, 9600, 57600, 38400, 19200];

/**
 * Default probe command (IEEE 488.2 identification query)
 */
const DEFAULT_PROBE_COMMAND = '*IDN?';

/**
 * Default probe timeout in milliseconds (shorter for fast iteration)
 */
const DEFAULT_PROBE_TIMEOUT = 500;

/**
 * Default command delay in milliseconds
 */
const DEFAULT_COMMAND_DELAY = 50;

/**
 * Options for serial port probing
 */
export interface SerialProbeOptions {
  /** Baud rates to try (default: [115200, 9600, 57600, 38400, 19200]) */
  baudRates?: number[];
  /** Command to send for probing (default: '*IDN?') */
  probeCommand?: string;
  /** Timeout for each probe attempt in ms (default: 500) */
  probeTimeout?: number;
  /** Delay between commands in ms (default: 50) */
  commandDelay?: number;
  /** Data bits (default: 8) */
  dataBits?: 5 | 6 | 7 | 8;
  /** Stop bits (default: 1) */
  stopBits?: 1 | 1.5 | 2;
  /** Parity (default: 'none') */
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  /** Flow control (default: 'none') */
  flowControl?: 'none' | 'hardware' | 'software';
}

/**
 * Result of a successful serial port probe
 */
export interface SerialProbeResult {
  /** The baud rate that worked */
  baudRate: number;
  /** The response from the probe command */
  response: string;
}

/**
 * Probes a serial port to detect the working baud rate.
 *
 * Tries each baud rate in sequence, sending a probe command and waiting for a response.
 * Returns the first baud rate that receives a valid response.
 *
 * @param path - The serial port path (e.g., '/dev/ttyUSB0', 'COM3')
 * @param options - Probe options
 * @returns Result containing the detected baud rate and response, or an error
 *
 * @example
 * ```typescript
 * const result = await probeSerialPort('/dev/ttyUSB0');
 * if (result.ok) {
 *   console.log(`Detected baud rate: ${result.value.baudRate}`);
 *   console.log(`Device: ${result.value.response}`);
 * }
 * ```
 */
export async function probeSerialPort(
  path: string,
  options?: SerialProbeOptions
): Promise<Result<SerialProbeResult, Error>> {
  const baudRates = options?.baudRates ?? DEFAULT_BAUD_RATES;
  const probeCommand = options?.probeCommand ?? DEFAULT_PROBE_COMMAND;
  const probeTimeout = options?.probeTimeout ?? DEFAULT_PROBE_TIMEOUT;
  const commandDelay = options?.commandDelay ?? DEFAULT_COMMAND_DELAY;

  const errors: string[] = [];

  for (const baudRate of baudRates) {
    const transport = createSerialTransport({
      path,
      baudRate,
      timeout: probeTimeout,
      commandDelay,
      dataBits: options?.dataBits,
      stopBits: options?.stopBits,
      parity: options?.parity,
      flowControl: options?.flowControl,
    });

    const openResult = await transport.open();
    if (!openResult.ok) {
      // If port can't be opened, no point trying other baud rates
      // (port not found, busy, etc.)
      return Err(openResult.error);
    }

    try {
      const queryResult = await transport.query(probeCommand);

      if (queryResult.ok) {
        // Success! Close and return the result
        await transport.close();
        return Ok({
          baudRate,
          response: queryResult.value,
        });
      }

      // Query failed (likely timeout), try next baud rate
      errors.push(`${baudRate}: ${queryResult.error.message}`);
    } finally {
      // Always close the transport
      await transport.close();
    }
  }

  // None of the baud rates worked
  return Err(
    new Error(
      `No working baud rate found for ${path}. Tried: ${baudRates.join(', ')}. Errors: ${errors.join('; ')}`
    )
  );
}
