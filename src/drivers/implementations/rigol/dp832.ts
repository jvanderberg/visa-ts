/**
 * Rigol DP832 Power Supply Driver.
 *
 * Supports DP832, DP832A, and similar 3-channel programmable DC power supplies.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec } from '../../types.js';
import type { Result } from '../../../result.js';
import type {
  PowerSupply,
  PowerSupplyChannel,
  RegulationMode,
} from '../../equipment/power-supply.js';

// ─────────────────────────────────────────────────────────────────
// DP832-specific interfaces (extend base)
// ─────────────────────────────────────────────────────────────────

/**
 * DP832 channel interface - extends base with measurements and protection.
 */
export interface DP832Channel extends PowerSupplyChannel {
  // Measurements
  getMeasuredVoltage(): Promise<Result<number, Error>>;
  getMeasuredCurrent(): Promise<Result<number, Error>>;
  getMeasuredPower(): Promise<Result<number, Error>>;

  // Status
  getMode(): Promise<Result<RegulationMode, Error>>;

  // Over-voltage protection
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(v: boolean): Promise<Result<void, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(v: number): Promise<Result<void, Error>>;

  // Over-current protection
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(v: boolean): Promise<Result<void, Error>>;
  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(v: number): Promise<Result<void, Error>>;
}

/**
 * DP832 power supply interface - extends base with global output control.
 */
export interface DP832PSU extends PowerSupply {
  /** Access a specific channel with DP832-specific features. */
  channel(n: 1 | 2 | 3): DP832Channel;

  /** Get global output enabled state (all channels) */
  getAllOutputEnabled(): Promise<Result<boolean, Error>>;

  /** Set global output enabled state (all channels) */
  setAllOutputEnabled(v: boolean): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Parse regulation mode response.
 */
function parseRegulationMode(s: string): RegulationMode {
  const val = s.trim().toUpperCase();
  if (val === 'CONSTANT VOLTAGE' || val === 'CV') return 'CV';
  if (val === 'CONSTANT CURRENT' || val === 'CC') return 'CC';
  if (val === 'UNREGULATED' || val === 'UR') return 'UR';
  return 'UR'; // Default to unregulated for unknown values
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * Rigol DP800 series driver specification.
 */
const dp832Spec: DriverSpec<DP832PSU, DP832Channel> = {
  type: 'power-supply',
  manufacturer: 'Rigol',
  models: ['DP832', 'DP832A', 'DP831', 'DP831A', 'DP821', 'DP821A', 'DP811', 'DP811A'],

  properties: {
    allOutputEnabled: {
      get: ':OUTPut:ALL?',
      set: ':OUTPut:ALL {value}',
      parse: parseScpiBool,
      format: formatScpiBool,
    },
  },

  channels: {
    count: 3,
    indexStart: 1,
    properties: {
      voltage: {
        get: ':SOURce{ch}:VOLTage?',
        set: ':SOURce{ch}:VOLTage {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      current: {
        get: ':SOURce{ch}:CURRent?',
        set: ':SOURce{ch}:CURRent {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      outputEnabled: {
        get: ':OUTPut:STATe? CH{ch}',
        set: ':OUTPut:STATe CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      measuredVoltage: {
        get: ':MEASure:VOLTage? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredCurrent: {
        get: ':MEASure:CURRent? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'A',
      },

      measuredPower: {
        get: ':MEASure:POWer? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'W',
      },

      mode: {
        get: ':OUTPut:MODE? CH{ch}',
        parse: parseRegulationMode,
        readonly: true,
      },

      ovpEnabled: {
        get: ':OUTPut:OVP? CH{ch}',
        set: ':OUTPut:OVP CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      ovpLevel: {
        get: ':OUTPut:OVP:VALue? CH{ch}',
        set: ':OUTPut:OVP:VALue CH{ch},{value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      ocpEnabled: {
        get: ':OUTPut:OCP? CH{ch}',
        set: ':OUTPut:OCP CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      ocpLevel: {
        get: ':OUTPut:OCP:VALue? CH{ch}',
        set: ':OUTPut:OCP:VALue CH{ch},{value}',
        parse: parseScpiNumber,
        unit: 'A',
      },
    },
  },

  settings: {
    postCommandDelay: 50,
    resetDelay: 1000,
  },
};

/**
 * Rigol DP832 power supply driver.
 *
 * @example
 * ```typescript
 * import { rigolDP832 } from 'visa-ts/drivers/implementations/rigol/dp832';
 *
 * const psu = await rigolDP832.connect(resource);
 * if (psu.ok) {
 *   // Configure channel 1
 *   await psu.value.channel(1).setVoltage(5.0);
 *   await psu.value.channel(1).setCurrent(1.0);
 *   await psu.value.channel(1).setOutputEnabled(true);
 *
 *   // Enable all outputs
 *   await psu.value.setAllOutputEnabled(true);
 *
 *   // Measure
 *   const v = await psu.value.channel(1).getMeasuredVoltage();
 *   const i = await psu.value.channel(1).getMeasuredCurrent();
 * }
 * ```
 */
export const rigolDP832 = defineDriver(dp832Spec);
