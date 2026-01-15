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

const MAX_VOLTAGE = 30;
const MAX_CURRENT = 5;
const DEFAULT_OVP = 33;
const DEFAULT_OCP = 5.5;

/**
 * Create a simulated PSU device instance.
 */
export function createSimulatedPsu(): SimulatedDevice {
  // Internal state
  let voltage = 0;
  let current = 0;
  let output = false;
  let ovp = DEFAULT_OVP;
  let ocp = DEFAULT_OCP;
  let measuredVoltage = 0;
  let measuredCurrent = 0;

  return {
    device: {
      manufacturer: 'VISA-TS',
      model: 'SIM-PSU',
      serial: 'PSU001',
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
      voltage: {
        get: () => voltage,
        set: (v) => {
          voltage = v as number;
        },
        getter: { pattern: 'VOLT?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^VOLT\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0 && (v as number) <= MAX_VOLTAGE,
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
      output: {
        get: () => output,
        set: (v) => {
          output = v as boolean;
        },
        getter: { pattern: 'OUTP?', format: (v) => (v ? 'ON' : 'OFF') },
        setter: {
          pattern: /^OUTP\s+(ON|OFF|1|0)$/i,
          parse: (m) => m[1]?.toUpperCase() === 'ON' || m[1] === '1',
        },
      },
      ovp: {
        get: () => ovp,
        set: (v) => {
          ovp = v as number;
        },
        getter: { pattern: 'VOLT:PROT?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^VOLT:PROT\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0 && (v as number) <= 36,
      },
      ocp: {
        get: () => ocp,
        set: (v) => {
          ocp = v as number;
        },
        getter: { pattern: 'CURR:PROT?', format: (v) => (v as number).toFixed(3) },
        setter: { pattern: /^CURR:PROT\s+([\d.]+)$/, parse: (m) => parseFloat(m[1] ?? '0') },
        validate: (v) => (v as number) >= 0 && (v as number) <= 6,
      },
    },

    getBehavior() {
      if (!output) {
        return { enabled: false, behavior: { type: 'open' as const } };
      }
      return {
        enabled: true,
        behavior: { type: 'voltage-source' as const, voltage, currentLimit: current },
      };
    },

    setMeasured(v: number, i: number) {
      measuredVoltage = v;
      measuredCurrent = i;
    },
  };
}
