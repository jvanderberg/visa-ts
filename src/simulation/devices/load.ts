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
import {
  parseNumber,
  parseBooleanState,
  formatFixed,
  formatBooleanState,
  formatString,
  validateRange,
} from './helpers.js';

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
 * Parse mode from command (device-specific parser with validation).
 */
function parseMode(match: RegExpMatchArray): LoadMode {
  const val = (match[1] ?? '').toUpperCase();
  if (isLoadMode(val)) {
    return val;
  }
  return 'CC';
}

// Create formatters with specific decimal places
const formatNumber3 = formatFixed(3);

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
        format: formatNumber3,
      },
    },

    measuredCurrent: {
      default: 0,
      getter: {
        pattern: 'MEAS:CURR?',
        format: formatNumber3,
      },
    },

    measuredPower: {
      default: 0,
      getter: {
        pattern: 'MEAS:POW?',
        format: formatNumber3,
      },
    },

    // Operating mode
    mode: {
      default: 'CC' as LoadMode,
      getter: {
        pattern: 'MODE?',
        format: formatString,
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
        format: formatBooleanState,
      },
      setter: {
        pattern: /^INP\s+(ON|OFF|1|0)$/i,
        parse: parseBooleanState,
      },
    },

    // CC mode - current setting
    current: {
      default: 0,
      getter: {
        pattern: 'CURR?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^CURR\s+([\d.]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_CURRENT),
    },

    // CV mode - voltage setting
    voltage: {
      default: 0,
      getter: {
        pattern: 'VOLT?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^VOLT\s+([\d.]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_VOLTAGE),
    },

    // CR mode - resistance setting
    resistance: {
      default: DEFAULT_RESISTANCE,
      getter: {
        pattern: 'RES?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^RES\s+([\d.]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(MIN_RESISTANCE, MAX_RESISTANCE),
    },

    // CP mode - power setting
    power: {
      default: 0,
      getter: {
        pattern: 'POW?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^POW\s+([\d.]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_POWER),
    },

    // Slew rate control
    slewRate: {
      default: DEFAULT_SLEW_RATE,
      getter: {
        pattern: 'CURR:SLEW?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^CURR:SLEW\s+([\d.]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(0.001, 10),
    },
  },
};
