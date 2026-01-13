/**
 * Simulated Digital Multimeter (DMM) device.
 *
 * A realistic simulation of a digital multimeter with:
 * - Voltage (AC/DC), Current (AC/DC), Resistance, Frequency measurements
 * - Range control (AUTO and manual)
 * - NPLC (resolution) control
 * - Trigger control
 * - Continuity and diode test modes
 *
 * @packageDocumentation
 */

import type { SimulatedDevice } from '../types.js';

// Helper type for Property value (matches Property<T> default type)
type PropertyValue = number | string | boolean;

/**
 * Parse a numeric value from a command match.
 */
function parseNumber(match: RegExpMatchArray): number {
  return parseFloat(match[1] ?? '0');
}

/**
 * Parse function name from command.
 */
function parseFunction(match: RegExpMatchArray): string {
  return (match[1] ?? '').toUpperCase();
}

/**
 * Parse range value from command (can be AUTO or numeric).
 *
 * Returns 'AUTO' normalized to uppercase, but preserves numeric values as-is
 * to maintain user-specified precision (e.g., '10' stays as '10', not '10.000').
 */
function parseRange(match: RegExpMatchArray): string {
  const val = (match[1] ?? '').toUpperCase();
  return val === 'AUTO' ? 'AUTO' : (match[1] ?? 'AUTO');
}

/**
 * Parse trigger source from command.
 */
function parseTriggerSource(match: RegExpMatchArray): string {
  return (match[1] ?? '').toUpperCase();
}

/**
 * Format a number with 3 decimal places.
 */
function formatNumber3(value: PropertyValue): string {
  return (value as number).toFixed(3);
}

/**
 * Format a number with 6 decimal places (for measurements).
 */
function formatNumber6(value: PropertyValue): string {
  return (value as number).toFixed(6);
}

/**
 * Format string value.
 */
function formatString(value: PropertyValue): string {
  return value as string;
}

/**
 * Validate NPLC value.
 */
function validateNplc(value: PropertyValue): boolean {
  const num = value as number;
  return num >= 0.001 && num <= 100;
}

/**
 * Simulated DMM device definition.
 *
 * Simulates a 6.5 digit digital multimeter.
 *
 * @example
 * ```typescript
 * import { createSimulationTransport } from 'visa-ts';
 * import { simulatedDmm } from 'visa-ts/simulation/devices/dmm';
 *
 * const transport = createSimulationTransport({ device: simulatedDmm });
 * await transport.open();
 *
 * // Configure for DC voltage measurement
 * await transport.write('FUNC VOLT:DC');
 * await transport.write('VOLT:DC:RANG AUTO');
 *
 * // Read measurement
 * const reading = await transport.query('READ?');
 * console.log(reading.value); // e.g., '1.234567'
 * ```
 */
export const simulatedDmm: SimulatedDevice = {
  device: {
    manufacturer: 'VISA-TS',
    model: 'SIM-DMM',
    serial: 'DMM001',
  },

  dialogues: [
    // Common SCPI commands
    { pattern: '*RST', response: null },
    { pattern: '*OPC?', response: '1' },
    { pattern: '*CLS', response: null },
    { pattern: '*WAI', response: null },

    // Immediate measurement queries - return simulated values
    {
      pattern: /^:?MEAS(?:URE)?:VOLT(?:AGE)?:DC\?$/i,
      response: () => (Math.random() * 10).toFixed(6),
    },
    {
      pattern: /^:?MEAS(?:URE)?:VOLT(?:AGE)?:AC\?$/i,
      response: () => (Math.random() * 10).toFixed(6),
    },
    {
      pattern: /^:?MEAS(?:URE)?:CURR(?:ENT)?:DC\?$/i,
      response: () => (Math.random() * 1).toFixed(6),
    },
    {
      pattern: /^:?MEAS(?:URE)?:CURR(?:ENT)?:AC\?$/i,
      response: () => (Math.random() * 1).toFixed(6),
    },
    {
      pattern: /^:?MEAS(?:URE)?:RES(?:ISTANCE)?\?$/i,
      response: () => (Math.random() * 10000).toFixed(2),
    },
    {
      pattern: /^:?MEAS(?:URE)?:FREQ(?:UENCY)?\?$/i,
      response: () => (1000 + Math.random() * 100).toFixed(3),
    },

    // READ? and FETCH? commands
    {
      pattern: /^:?READ\?$/i,
      response: () => (Math.random() * 10).toFixed(6),
    },
    {
      pattern: /^:?FETC(?:H)?\?$/i,
      response: () => (Math.random() * 10).toFixed(6),
    },

    // Initiate command
    { pattern: /^:?INIT(?:IATE)?$/i, response: null },
    { pattern: /^:?INIT(?:IATE)?:IMM(?:EDIATE)?$/i, response: null },
  ],

  properties: {
    // Measurement function
    measureFunction: {
      default: 'VOLT:DC',
      getter: {
        pattern: /^:?FUNC(?:TION)?\?$/i,
        format: formatString,
      },
      setter: {
        pattern:
          /^:?FUNC(?:TION)?\s+(VOLT:DC|VOLT:AC|CURR:DC|CURR:AC|RES|FRES|FREQ|PER|CONT|DIOD)$/i,
        parse: parseFunction,
      },
    },

    // DC Voltage range
    voltDcRange: {
      default: 'AUTO',
      getter: {
        pattern: /^:?VOLT(?:AGE)?:DC:RANG(?:E)?\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?VOLT(?:AGE)?:DC:RANG(?:E)?\s+(AUTO|[\d.eE+-]+)$/i,
        parse: parseRange,
      },
    },

    // DC Voltage NPLC
    voltDcNplc: {
      default: 1,
      getter: {
        pattern: /^:?VOLT(?:AGE)?:DC:NPLC\?$/i,
        format: formatNumber3,
      },
      setter: {
        pattern: /^:?VOLT(?:AGE)?:DC:NPLC\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
      validate: validateNplc,
    },

    // AC Voltage range
    voltAcRange: {
      default: 'AUTO',
      getter: {
        pattern: /^:?VOLT(?:AGE)?:AC:RANG(?:E)?\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?VOLT(?:AGE)?:AC:RANG(?:E)?\s+(AUTO|[\d.eE+-]+)$/i,
        parse: parseRange,
      },
    },

    // DC Current range
    currDcRange: {
      default: 'AUTO',
      getter: {
        pattern: /^:?CURR(?:ENT)?:DC:RANG(?:E)?\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?CURR(?:ENT)?:DC:RANG(?:E)?\s+(AUTO|[\d.eE+-]+)$/i,
        parse: parseRange,
      },
    },

    // Resistance range
    resRange: {
      default: 'AUTO',
      getter: {
        pattern: /^:?RES(?:ISTANCE)?:RANG(?:E)?\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?RES(?:ISTANCE)?:RANG(?:E)?\s+(AUTO|[\d.eE+-]+)$/i,
        parse: parseRange,
      },
    },

    // Trigger source
    triggerSource: {
      default: 'IMM',
      getter: {
        pattern: /^:?TRIG(?:GER)?:SOUR(?:CE)?\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?TRIG(?:GER)?:SOUR(?:CE)?\s+(IMM|BUS|EXT|INT)$/i,
        parse: parseTriggerSource,
      },
    },

    // Trigger delay
    triggerDelay: {
      default: 0,
      getter: {
        pattern: /^:?TRIG(?:GER)?:DEL(?:AY)?\?$/i,
        format: formatNumber6,
      },
      setter: {
        pattern: /^:?TRIG(?:GER)?:DEL(?:AY)?\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
    },

    // Sample count
    sampleCount: {
      default: 1,
      getter: {
        pattern: /^:?SAMP(?:LE)?:COUN(?:T)?\?$/i,
        format: (v: PropertyValue) => String(Math.round(v as number)),
      },
      setter: {
        pattern: /^:?SAMP(?:LE)?:COUN(?:T)?\s+(\d+)$/i,
        parse: (m: RegExpMatchArray) => parseInt(m[1] ?? '1', 10),
      },
    },
  },
};
