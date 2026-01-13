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

/**
 * Parse a numeric value from a command match.
 */
function parseNumber(match: RegExpMatchArray): number {
  return parseFloat(match[1] ?? '0');
}

/**
 * Parse output state from command (ON/OFF/1/0).
 */
function parseOutputState(match: RegExpMatchArray): boolean {
  const val = (match[1] ?? '').toUpperCase();
  return val === 'ON' || val === '1';
}

// Helper type for Property value (matches Property<T> default type)
type PropertyValue = number | string | boolean;

/**
 * Format a number with 3 decimal places.
 *
 * Note: Type signature uses PropertyValue for compatibility with Property<T> interface,
 * but this function is designed for numeric properties only. The cast is safe when
 * used exclusively with number-typed property definitions.
 */
function formatNumber(value: PropertyValue): string {
  // Safe cast: This function is only used with numeric properties
  return (value as number).toFixed(3);
}

/**
 * Format boolean output state as ON/OFF.
 */
function formatOutputState(value: PropertyValue): string {
  return value ? 'ON' : 'OFF';
}

/**
 * Create a validator for numeric values within a range.
 *
 * Note: Type signature uses PropertyValue for compatibility with Property<T> interface,
 * but this function is designed for numeric properties only. The cast is safe when
 * used exclusively with number-typed property definitions.
 */
function validateRange(min: number, max: number): (value: PropertyValue) => boolean {
  // Safe cast: This validator is only used with numeric properties
  return (v) => {
    const num = v as number;
    return num >= min && num <= max;
  };
}

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
        format: formatNumber,
      },
    },

    measuredCurrent: {
      default: 0,
      getter: {
        pattern: 'MEAS:CURR?',
        format: formatNumber,
      },
    },

    voltage: {
      default: 0,
      getter: {
        pattern: 'VOLT?',
        format: formatNumber,
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
        format: formatNumber,
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
        format: formatOutputState,
      },
      setter: {
        pattern: /^OUTP\s+(ON|OFF|1|0)$/i,
        parse: parseOutputState,
      },
    },

    ovp: {
      default: DEFAULT_OVP,
      getter: {
        pattern: 'VOLT:PROT?',
        format: formatNumber,
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
        format: formatNumber,
      },
      setter: {
        pattern: /^CURR:PROT\s+([\d.]+)$/,
        parse: parseNumber,
      },
      validate: validateRange(0, 6),
    },
  },
};
