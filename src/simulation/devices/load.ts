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

const MAX_CURRENT = 30;
const MAX_VOLTAGE = 150;
const MIN_RESISTANCE = 0.1;
const MAX_RESISTANCE = 10000;
const DEFAULT_RESISTANCE = 1000;
const MAX_POWER = 300;
const DEFAULT_SLEW_RATE = 1;
const INTERNAL_MIN_RESISTANCE = 0.001;

type LoadMode = 'CC' | 'CV' | 'CR' | 'CP';

/**
 * Create a simulated electronic load device instance.
 */
export function createSimulatedLoad(): SimulatedDevice {
  // Internal state
  let mode: LoadMode = 'CC';
  let input = false;
  let current = 0;
  let voltage = 0;
  let resistance = DEFAULT_RESISTANCE;
  let power = 0;
  let slewRate = DEFAULT_SLEW_RATE;
  let measuredVoltage = 0;
  let measuredCurrent = 0;
  let measuredPower = 0;

  return {
    device: {
      manufacturer: 'VISA-TS',
      model: 'SIM-LOAD',
      serial: 'LOAD001',
    },

    properties: {
      measuredVoltage: {
        get: () => measuredVoltage,
        getter: { pattern: 'MEAS:VOLT?', format: (v) => (v as number).toFixed(3) },
      },
      measuredCurrent: {
        get: () => measuredCurrent,
        getter: { pattern: 'MEAS:CURR?', format: (v) => (v as number).toFixed(3) },
      },
      measuredPower: {
        get: () => measuredPower,
        getter: { pattern: 'MEAS:POW?', format: (v) => (v as number).toFixed(3) },
      },
      mode: {
        get: () => mode,
        set: (v) => {
          mode = v as LoadMode;
        },
        getter: { pattern: 'MODE?', format: (v) => v as string },
        setter: { pattern: /^MODE\s+(CC|CV|CR|CP)$/i, parse: (m) => (m[1] ?? 'CC').toUpperCase() },
      },
      input: {
        get: () => input,
        set: (v) => {
          input = v as boolean;
        },
        getter: { pattern: 'INP?', format: (v) => (v ? 'ON' : 'OFF') },
        setter: {
          pattern: /^INP\s+(ON|OFF|1|0)$/i,
          parse: (m) => m[1]?.toUpperCase() === 'ON' || m[1] === '1',
        },
      },
      current: {
        get: () => current,
        set: (v) => {
          current = v as number;
        },
        getter: { pattern: 'CURR?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^CURR\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0 && (v as number) <= MAX_CURRENT,
      },
      voltage: {
        get: () => voltage,
        set: (v) => {
          voltage = v as number;
        },
        getter: { pattern: 'VOLT?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^VOLT\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0 && (v as number) <= MAX_VOLTAGE,
      },
      resistance: {
        get: () => resistance,
        set: (v) => {
          resistance = v as number;
        },
        getter: { pattern: 'RES?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^RES\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= MIN_RESISTANCE && (v as number) <= MAX_RESISTANCE,
      },
      power: {
        get: () => power,
        set: (v) => {
          power = v as number;
        },
        getter: { pattern: 'POW?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^POW\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0 && (v as number) <= MAX_POWER,
      },
      slewRate: {
        get: () => slewRate,
        set: (v) => {
          slewRate = v as number;
        },
        getter: { pattern: 'CURR:SLEW?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^CURR:SLEW\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0.001 && (v as number) <= 10,
      },
    },

    getBehavior() {
      if (!input) {
        return { enabled: false, behavior: { type: 'open' as const } };
      }
      switch (mode) {
        case 'CC':
          return {
            enabled: true,
            behavior: {
              type: 'current-sink' as const,
              current,
              minResistance: INTERNAL_MIN_RESISTANCE,
            },
          };
        case 'CR':
          return {
            enabled: true,
            behavior: { type: 'resistance' as const, resistance },
          };
        case 'CP':
          return {
            enabled: true,
            behavior: { type: 'power-sink' as const, power },
          };
        default:
          return { enabled: true, behavior: { type: 'open' as const } };
      }
    },

    setMeasured(v: number, i: number) {
      measuredVoltage = v;
      measuredCurrent = i;
      measuredPower = v * i;
    },
  };
}
