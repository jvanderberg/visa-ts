/**
 * Simulated Digital Multimeter (DMM) device.
 *
 * A simulation of a programmable DMM with:
 * - DC/AC voltage measurement
 * - DC/AC current measurement
 * - Resistance measurement
 * - Auto/manual range selection
 *
 * @packageDocumentation
 */

import type { SimulatedDevice } from '../types.js';

type MeasureFunction = 'VOLT:DC' | 'VOLT:AC' | 'CURR:DC' | 'CURR:AC' | 'RES' | 'CONT';

/**
 * Create a simulated DMM device instance.
 *
 * The DMM observes the circuit without affecting it (high impedance).
 * It reads voltage and current from the bus via setMeasured().
 */
export function createSimulatedDmm(): SimulatedDevice {
  // Internal state
  let func: MeasureFunction = 'VOLT:DC';
  let range = 'AUTO';
  let busVoltage = 0;
  let busCurrent = 0;

  // Get the current measurement based on selected function
  function getMeasurement(): number {
    switch (func) {
      case 'VOLT:DC':
      case 'VOLT:AC':
        return busVoltage;
      case 'CURR:DC':
      case 'CURR:AC':
        return busCurrent;
      case 'RES':
      case 'CONT':
        // R = V/I, avoid division by zero
        return busCurrent > 1e-9 ? busVoltage / busCurrent : 9.9e37;
      default:
        return 0;
    }
  }

  return {
    device: {
      manufacturer: 'VISA-TS',
      model: 'SIM-DMM',
      serial: 'DMM001',
    },

    dialogues: [
      // Configure measurement function
      { pattern: /^CONF:VOLT:DC$/i, response: null },
      { pattern: /^CONF:VOLT:AC$/i, response: null },
      { pattern: /^CONF:CURR:DC$/i, response: null },
      { pattern: /^CONF:CURR:AC$/i, response: null },
      { pattern: /^CONF:RES$/i, response: null },
      { pattern: /^CONF:CONT$/i, response: null },
    ],

    properties: {
      function: {
        get: () => func,
        set: (v) => {
          func = v as MeasureFunction;
        },
        getter: { pattern: /^FUNC\??$/i, format: () => func },
        setter: {
          pattern: /^FUNC\s+(VOLT:DC|VOLT:AC|CURR:DC|CURR:AC|RES|CONT)$/i,
          parse: (m) => (m[1]?.toUpperCase() ?? 'VOLT:DC') as MeasureFunction,
        },
      },
      range: {
        get: () => range,
        set: (v) => {
          range = v as string;
        },
        getter: { pattern: /^RANG\??$/i, format: () => range },
        setter: {
          pattern: /^RANG\s+(.+)$/i,
          parse: (m) => m[1]?.toUpperCase() ?? 'AUTO',
        },
      },
      // READ? triggers a measurement and returns the value
      read: {
        get: () => getMeasurement(),
        getter: { pattern: /^READ\?$/i, format: (v) => (v as number).toExponential(6) },
      },
      // MEAS queries for convenience
      measVoltDc: {
        get: () => busVoltage,
        getter: { pattern: /^MEAS:VOLT:DC\?$/i, format: (v) => (v as number).toExponential(6) },
      },
      measVoltAc: {
        get: () => busVoltage * 0.707, // RMS approximation
        getter: { pattern: /^MEAS:VOLT:AC\?$/i, format: (v) => (v as number).toExponential(6) },
      },
      measCurrDc: {
        get: () => busCurrent,
        getter: { pattern: /^MEAS:CURR:DC\?$/i, format: (v) => (v as number).toExponential(6) },
      },
      measCurrAc: {
        get: () => busCurrent * 0.707,
        getter: { pattern: /^MEAS:CURR:AC\?$/i, format: (v) => (v as number).toExponential(6) },
      },
      measRes: {
        get: () => (busCurrent > 1e-9 ? busVoltage / busCurrent : 9.9e37),
        getter: { pattern: /^MEAS:RES\?$/i, format: (v) => (v as number).toExponential(6) },
      },
    },

    // DMM observes circuit without participating in physics simulation.
    // When connected to a bus, setMeasured is called by other devices' circuit updates.
    setMeasured(v: number, i: number) {
      busVoltage = v;
      busCurrent = i;
    },
  };
}
