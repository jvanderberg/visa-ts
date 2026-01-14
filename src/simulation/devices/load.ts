/**
 * Simulated Electronic Load device.
 *
 * A realistic simulation of a programmable electronic load with:
 * - CC (Constant Current) mode - 0-30A
 * - CV (Constant Voltage) mode - 0-150V
 * - CR (Constant Resistance) mode - 0.1-10000 ohms
 * - CP (Constant Power) mode - 0-300W
 * - Input enable/disable
 * - Slew rate control
 * - Measurement queries
 *
 * @packageDocumentation
 */

import type { SimulatedDevice } from '../types.js';

/**
 * Maximum current in amps
 */
const MAX_CURRENT = 30;

/**
 * Maximum voltage in volts
 */
const MAX_VOLTAGE = 150;

/**
 * Minimum resistance in ohms
 */
const MIN_RESISTANCE = 0.1;

/**
 * Maximum resistance in ohms
 */
const MAX_RESISTANCE = 10000;

/**
 * Default resistance in ohms
 */
const DEFAULT_RESISTANCE = 1000;

/**
 * Maximum power in watts
 */
const MAX_POWER = 300;

/**
 * Default slew rate in A/us
 */
const DEFAULT_SLEW_RATE = 1;

/**
 * Valid operating modes
 */
const LOAD_MODES = ['CC', 'CV', 'CR', 'CP'] as const;
type LoadMode = (typeof LOAD_MODES)[number];

function isLoadMode(value: string): value is LoadMode {
  return LOAD_MODES.includes(value as LoadMode);
}

/**
 * Parse a numeric value from a command match.
 */
function parseNumber(match: RegExpMatchArray): number {
  return parseFloat(match[1] ?? '0');
}

/**
 * Parse input state from command (ON/OFF/1/0).
 */
function parseInputState(match: RegExpMatchArray): boolean {
  const val = (match[1] ?? '').toUpperCase();
  return val === 'ON' || val === '1';
}

/**
 * Parse mode from command.
 */
function parseMode(match: RegExpMatchArray): LoadMode {
  const val = (match[1] ?? '').toUpperCase();
  if (isLoadMode(val)) {
    return val;
  }
  return 'CC';
}

/**
 * Format a number with 3 decimal places.
 */
function formatValue(value: number | string | boolean): string {
  return (value as number).toFixed(3);
}

/**
 * Format input state as ON/OFF.
 */
function formatInputState(value: number | string | boolean): string {
  return value ? 'ON' : 'OFF';
}

/**
 * Format mode.
 */
function formatMode(value: number | string | boolean): string {
  return value as string;
}

/**
 * Validate a numeric value is within range.
 */
function validateRange(min: number, max: number): (value: number | string | boolean) => boolean {
  return (v) => (v as number) >= min && (v as number) <= max;
}

/**
 * Simulated Electronic Load device definition.
 *
 * Simulates a 150V/30A/300W programmable electronic load.
 *
 * @example
 * ```typescript
 * import { createSimulationTransport } from 'visa-ts';
 * import { simulatedLoad } from 'visa-ts/simulation/devices/load';
 *
 * const transport = createSimulationTransport({ device: simulatedLoad });
 * await transport.open();
 *
 * // Set to constant current mode and draw 2A
 * await transport.write('MODE CC');
 * await transport.write('CURR 2');
 * await transport.write('INP ON');
 *
 * const current = await transport.query('CURR?');
 * console.log(current.value); // '2.000'
 * ```
 */
export const simulatedLoad: SimulatedDevice = {
  device: {
    manufacturer: 'VISA-TS',
    model: 'SIM-LOAD',
    serial: 'LOAD001',
  },

  properties: {
    // Measured values - in this simple simulation, return default 0
    measuredVoltage: {
      default: 0,
      getter: {
        pattern: 'MEAS:VOLT?',
        format: formatValue,
      },
    },

    measuredCurrent: {
      default: 0,
      getter: {
        pattern: 'MEAS:CURR?',
        format: formatValue,
      },
    },

    measuredPower: {
      default: 0,
      getter: {
        pattern: 'MEAS:POW?',
        format: formatValue,
      },
    },

    // Operating mode
    mode: {
      default: 'CC' as LoadMode,
      getter: {
        pattern: 'MODE?',
        format: formatMode,
      },
      setter: {
        pattern: /^MODE\s+(CC|CV|CR|CP)$/i,
        parse: parseMode,
      },
    },

    // Input state
    input: {
      default: false,
      getter: {
        pattern: 'INP?',
        format: formatInputState,
      },
      setter: {
        pattern: /^INP\s+(ON|OFF|1|0)$/i,
        parse: parseInputState,
      },
    },

    // CC mode - current setting
    current: {
      default: 0,
      getter: {
        pattern: 'CURR?',
        format: formatValue,
      },
      setter: {
        pattern: /^CURR\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_CURRENT),
    },

    // CV mode - voltage setting
    voltage: {
      default: 0,
      getter: {
        pattern: 'VOLT?',
        format: formatValue,
      },
      setter: {
        pattern: /^VOLT\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_VOLTAGE),
    },

    // CR mode - resistance setting
    resistance: {
      default: DEFAULT_RESISTANCE,
      getter: {
        pattern: 'RES?',
        format: formatValue,
      },
      setter: {
        pattern: /^RES\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(MIN_RESISTANCE, MAX_RESISTANCE),
    },

    // CP mode - power setting
    power: {
      default: 0,
      getter: {
        pattern: 'POW?',
        format: formatValue,
      },
      setter: {
        pattern: /^POW\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_POWER),
    },

    // Slew rate control
    slewRate: {
      default: DEFAULT_SLEW_RATE,
      getter: {
        pattern: 'CURR:SLEW?',
        format: formatValue,
      },
      setter: {
        pattern: /^CURR:SLEW\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0.001, 10),
    },
  },
};
