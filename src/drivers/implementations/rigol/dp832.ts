/**
 * Rigol DP832 Power Supply Driver.
 *
 * Supports DP832, DP832A, and similar 3-channel programmable DC power supplies.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec, PropertyDef } from '../../types.js';

/**
 * Parse regulation mode response.
 */
function parseRegulationMode(s: string): string {
  const val = s.trim().toUpperCase();
  if (val === 'CONSTANT VOLTAGE' || val === 'CV') return 'CV';
  if (val === 'CONSTANT CURRENT' || val === 'CC') return 'CC';
  if (val === 'UNREGULATED' || val === 'UR') return 'UR';
  return val;
}

/**
 * Rigol DP800 series driver specification.
 */
const dp832Spec: DriverSpec = {
  type: 'power-supply',
  manufacturer: 'Rigol',
  models: ['DP832', 'DP832A', 'DP831', 'DP831A', 'DP821', 'DP821A', 'DP811', 'DP811A'],

  properties: {
    allOutputEnabled: {
      get: ':OUTPut:ALL?',
      set: ':OUTPut:ALL {value}',
      parse: parseScpiBool,
      format: formatScpiBool,
    } as PropertyDef<boolean>,
  },

  commands: {},

  channels: {
    count: 3,
    indexStart: 1,
    properties: {
      voltage: {
        get: ':SOURce{ch}:VOLTage?',
        set: ':SOURce{ch}:VOLTage {value}',
        parse: parseScpiNumber,
        unit: 'V',
      } as PropertyDef<number>,

      current: {
        get: ':SOURce{ch}:CURRent?',
        set: ':SOURce{ch}:CURRent {value}',
        parse: parseScpiNumber,
        unit: 'A',
      } as PropertyDef<number>,

      outputEnabled: {
        get: ':OUTPut:STATe? CH{ch}',
        set: ':OUTPut:STATe CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      } as PropertyDef<boolean>,

      measuredVoltage: {
        get: ':MEASure:VOLTage? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      } as PropertyDef<number>,

      measuredCurrent: {
        get: ':MEASure:CURRent? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'A',
      } as PropertyDef<number>,

      measuredPower: {
        get: ':MEASure:POWer? CH{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'W',
      } as PropertyDef<number>,

      mode: {
        get: ':OUTPut:MODE? CH{ch}',
        parse: parseRegulationMode,
        readonly: true,
      } as PropertyDef<string>,

      ovpEnabled: {
        get: ':OUTPut:OVP? CH{ch}',
        set: ':OUTPut:OVP CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      } as PropertyDef<boolean>,

      ovpLevel: {
        get: ':OUTPut:OVP:VALue? CH{ch}',
        set: ':OUTPut:OVP:VALue CH{ch},{value}',
        parse: parseScpiNumber,
        unit: 'V',
      } as PropertyDef<number>,

      ocpEnabled: {
        get: ':OUTPut:OCP? CH{ch}',
        set: ':OUTPut:OCP CH{ch},{value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      } as PropertyDef<boolean>,

      ocpLevel: {
        get: ':OUTPut:OCP:VALue? CH{ch}',
        set: ':OUTPut:OCP:VALue CH{ch},{value}',
        parse: parseScpiNumber,
        unit: 'A',
      } as PropertyDef<number>,
    },
  },

  capabilities: ['ovp', 'ocp'],

  quirks: {
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
