/**
 * Simulated Power Supply Unit (PSU) device.
 *
 * A realistic simulation of a programmable DC power supply with:
 * - Voltage control (0-30V)
 * - Current limit control (0-5A)
 * - Output enable/disable
 * - OVP/OCP protection settings
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
  validateRange,
} from './helpers.js';

/**
 * Maximum voltage in volts
 */
const MAX_VOLTAGE = 30;

/**
 * Maximum current in amps
 */
const MAX_CURRENT = 5;

/**
 * Default OVP level (10% above max)
 */
const DEFAULT_OVP = 33;

/**
 * Default OCP level (10% above max)
 */
const DEFAULT_OCP = 5.5;

// Create formatters with specific decimal places
const formatNumber3 = formatFixed(3);

/**
 * Simulated PSU device definition.
 *
 * Simulates a 30V/5A programmable DC power supply.
 *
 * @example
 * ```typescript
 * import { createSimulationTransport } from 'visa-ts';
 * import { simulatedPsu } from 'visa-ts/simulation/devices/psu';
 *
 * const transport = createSimulationTransport({ device: simulatedPsu });
 * await transport.open();
 *
 * await transport.write('VOLT 12.5');
 * await transport.write('CURR 2');
 * await transport.write('OUTP ON');
 *
 * const voltage = await transport.query('MEAS:VOLT?');
 * console.log(voltage.value); // '12.500'
 * ```
 */
export const simulatedPsu: SimulatedDevice = {
  device: {
    manufacturer: 'VISA-TS',
    model: 'SIM-PSU',
    serial: 'PSU001',
  },

  properties: {
    // Measured values - in this simple simulation, MEAS returns the set value
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

    voltage: {
      default: 0,
      getter: {
        pattern: 'VOLT?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^VOLT\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_VOLTAGE),
    },

    current: {
      default: 0,
      getter: {
        pattern: 'CURR?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^CURR\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, MAX_CURRENT),
    },

    output: {
      default: false,
      getter: {
        pattern: 'OUTP?',
        format: formatBooleanState,
      },
      setter: {
        pattern: /^OUTP\s+(ON|OFF|1|0)$/i,
        parse: parseBooleanState,
      },
    },

    ovp: {
      default: DEFAULT_OVP,
      getter: {
        pattern: 'VOLT:PROT?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^VOLT:PROT\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, 36),
    },

    ocp: {
      default: DEFAULT_OCP,
      getter: {
        pattern: 'CURR:PROT?',
        format: formatNumber3,
      },
      setter: {
        pattern: /^CURR:PROT\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, 6),
    },
  },
};
