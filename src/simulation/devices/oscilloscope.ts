/**
 * Simulated Oscilloscope device.
 *
 * A realistic simulation of a digital oscilloscope with:
 * - 4 analog channels
 * - Channel control (display, scale, offset, coupling)
 * - Timebase control
 * - Trigger control (source, level, mode)
 * - Acquisition commands
 *
 * @packageDocumentation
 */

import type { SimulatedDevice } from '../types.js';
import {
  parseNumber,
  parseBooleanState,
  parseString,
  formatFixed,
  formatBooleanState,
  formatString,
  validateRange,
} from './helpers.js';

// Create formatters with specific decimal places
const formatNumber3 = formatFixed(3);
const formatNumber6 = formatFixed(6);

/**
 * Simulated Oscilloscope device definition.
 *
 * Simulates a 4-channel digital oscilloscope.
 *
 * @example
 * ```typescript
 * import { createSimulationTransport } from 'visa-ts';
 * import { simulatedOscilloscope } from 'visa-ts/simulation/devices/oscilloscope';
 *
 * const transport = createSimulationTransport({ device: simulatedOscilloscope });
 * await transport.open();
 *
 * // Query channel settings
 * const scale = await transport.query('CHAN1:SCAL?');
 * console.log(scale.value); // '1.000'
 *
 * // Set trigger level
 * await transport.write('TRIG:LEV 0.5');
 * ```
 */
export const simulatedOscilloscope: SimulatedDevice = {
  device: {
    manufacturer: 'VISA-TS',
    model: 'SIM-OSC',
    serial: 'OSC001',
  },

  dialogues: [
    // Common SCPI commands
    { pattern: '*RST', response: null },
    { pattern: '*OPC?', response: '1' },
    { pattern: '*CLS', response: null },

    // Acquisition commands
    { pattern: 'SING', response: null },
    { pattern: 'RUN', response: null },
    { pattern: 'STOP', response: null },
    { pattern: /^:?SINGLE$/i, response: null },
    { pattern: /^:?RUN$/i, response: null },
    { pattern: /^:?STOP$/i, response: null },
  ],

  properties: {
    // Channel 1 properties
    chan1Display: {
      default: true,
      getter: {
        pattern: /^:?CHAN1:DISP\?$/i,
        format: formatBooleanState,
      },
      setter: {
        pattern: /^:?CHAN1:DISP\s+(ON|OFF|1|0)$/i,
        parse: parseBooleanState,
      },
    },

    chan1Scale: {
      default: 1,
      getter: {
        pattern: /^:?CHAN1:SCAL\?$/i,
        format: formatNumber3,
      },
      setter: {
        pattern: /^:?CHAN1:SCAL\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(0.001, 10),
    },

    chan1Offset: {
      default: 0,
      getter: {
        pattern: /^:?CHAN1:OFFS\?$/i,
        format: formatNumber3,
      },
      setter: {
        pattern: /^:?CHAN1:OFFS\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(-100, 100),
    },

    chan1Coupling: {
      default: 'DC',
      getter: {
        pattern: /^:?CHAN1:COUP\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?CHAN1:COUP\s+(AC|DC|GND)$/i,
        parse: parseString,
      },
    },

    // Timebase properties
    timebaseScale: {
      default: 0.0001, // 100us
      getter: {
        pattern: /^:?TIM(?:EBASE)?:SCAL\?$/i,
        format: formatNumber6,
      },
      setter: {
        pattern: /^:?TIM(?:EBASE)?:SCAL\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(0.000000001, 50),
    },

    timebaseOffset: {
      default: 0,
      getter: {
        pattern: /^:?TIM(?:EBASE)?:OFFS\?$/i,
        format: formatNumber6,
      },
      setter: {
        pattern: /^:?TIM(?:EBASE)?:OFFS\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
    },

    // Trigger properties
    triggerSource: {
      default: 'CHAN1',
      getter: {
        pattern: /^:?TRIG(?:GER)?:(?:EDGE:)?SOUR\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?TRIG(?:GER)?:(?:EDGE:)?SOUR\s+(CHAN[1-4]|EXT|LINE)$/i,
        parse: parseString,
      },
    },

    triggerLevel: {
      default: 0,
      getter: {
        pattern: /^:?TRIG(?:GER)?:(?:EDGE:)?LEV\?$/i,
        format: formatNumber3,
      },
      setter: {
        pattern: /^:?TRIG(?:GER)?:(?:EDGE:)?LEV\s+([\d.eE+-]+)$/i,
        parse: parseNumber,
      },
      validate: validateRange(-100, 100),
    },

    triggerMode: {
      default: 'EDGE',
      getter: {
        pattern: /^:?TRIG(?:GER)?:MODE\?$/i,
        format: formatString,
      },
      setter: {
        pattern: /^:?TRIG(?:GER)?:MODE\s+(EDGE|PULS|SLOP|VID|PATT|RS232|I2C|SPI)$/i,
        parse: parseString,
      },
    },

    triggerStatus: {
      default: 'STOP',
      getter: {
        pattern: /^:?TRIG(?:GER)?:STAT(?:US)?\?$/i,
        format: formatString,
      },
    },
  },
};
