/**
 * Matrix WPS300S Power Supply Driver.
 *
 * A basic single-channel programmable DC power supply.
 *
 * Note: This PSU uses simple SCPI-like commands over USB-Serial (CH340).
 * - Does NOT support *IDN? query
 * - Mode is auto-detected (CV/CC) based on load conditions - cannot be queried
 * - Default baud rate: 115200
 * - Requires 30-50ms delay between commands
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber } from '../../parsers.js';
import type { DriverSpec } from '../../types.js';
import type { PowerSupply, PowerSupplyChannel } from '../../equipment/power-supply.js';
import type { PsuFeatureId } from '../../features/index.js';

// ─────────────────────────────────────────────────────────────────
// WPS300S-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * WPS300S power supply interface (single-channel).
 */
export interface WPS300SPSU extends PowerSupply {
  /** Access channel 1 (the only channel) */
  channel(n: 1): PowerSupplyChannel;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Parse output state response.
 * Matrix PSU returns "0" or "1" instead of "ON"/"OFF".
 */
function parseOutputState(s: string): boolean {
  return s.trim() === '1';
}

/**
 * Format output state for command.
 */
function formatOutputState(enabled: boolean): string {
  return enabled ? 'ON' : 'OFF';
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/** WPS300S supported features (none - basic PSU) */
const wps300sFeatures = [] as const satisfies readonly PsuFeatureId[];

/**
 * Matrix WPS300S driver specification.
 */
const wps300sSpec: DriverSpec<WPS300SPSU, PowerSupplyChannel, typeof wps300sFeatures> = {
  type: 'power-supply',
  manufacturer: 'Matrix',
  models: ['WPS300S', 'WPS3010'],
  features: wps300sFeatures,

  // This device does NOT support *IDN? - use static identity with probe
  identity: {
    static: true,
    manufacturer: 'Matrix',
    model: 'WPS300S',
    // Probe with VOLT? to verify device is responding
    probeCommand: 'VOLT?',
  },

  properties: {
    // No global properties for this simple PSU
  },

  channels: {
    count: 1,
    indexStart: 1,
    properties: {
      voltage: {
        get: 'VOLT?',
        set: 'VOLT {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      current: {
        get: 'CURR?',
        set: 'CURR {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      outputEnabled: {
        get: 'OUTP?',
        set: 'OUTP {value}',
        parse: parseOutputState,
        format: formatOutputState,
      },

      measuredVoltage: {
        get: 'MEAS:VOLT?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredCurrent: {
        get: 'MEAS:CURR?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'A',
      },
      // Note: measuredPower not available - calculate from V * I if needed
    },
  },

  settings: {
    postCommandDelay: 50, // Device needs settling time between commands
    postQueryDelay: 100, // Slow serial device needs delay after queries too
  },
};

/**
 * Matrix WPS300S power supply driver.
 *
 * @example
 * ```typescript
 * import { matrixWPS300S } from 'visa-ts/drivers/implementations/matrix/wps300s';
 *
 * // Open serial connection (115200 baud recommended)
 * const resource = await rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
 *   transport: { baudRate: 115200 }
 * });
 *
 * const psu = await matrixWPS300S.connect(resource.value);
 * if (psu.ok) {
 *   await psu.value.channel(1).setVoltage(12.0);
 *   await psu.value.channel(1).setCurrent(2.0);
 *   await psu.value.channel(1).setOutputEnabled(true);
 *
 *   const v = await psu.value.channel(1).getMeasuredVoltage();
 *   const i = await psu.value.channel(1).getMeasuredCurrent();
 * }
 * ```
 */
export const matrixWPS300S = defineDriver(wps300sSpec);
