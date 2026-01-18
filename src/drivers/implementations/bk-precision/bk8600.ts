/**
 * BK Precision 8600 Series Electronic Load Driver.
 *
 * Supports 8600, 8601, 8602, 8610, 8612, 8614, 8616 series electronic loads.
 * Features CC, CV, CR, CP, LED modes, short circuit, and programmable list mode.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec, DriverContext } from '../../types.js';
import type { Result } from '../../../result.js';
import { Ok, Err } from '../../../result.js';
import {
  LoadMode,
  type ListStep,
  type ListModeOptions,
  type LoadChannelWithFeatures,
  type LoadWithFeatures,
} from '../../equipment/electronic-load.js';
import type { LoadFeatureId } from '../../features/load-features.js';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

/** Conversion factor: A/µs to A/s */
const SLEW_RATE_FACTOR = 1_000_000;

// ─────────────────────────────────────────────────────────────────
// Features and Auto-Composed Types
// ─────────────────────────────────────────────────────────────────

/**
 * Features supported by BK8600.
 */
const bkFeatures = ['cp', 'short', 'led'] as const satisfies readonly LoadFeatureId[];

/**
 * BK8600 channel type - automatically includes ShortMethods and LedMethods.
 */
export type BK8600Channel = LoadChannelWithFeatures<typeof bkFeatures>;

/**
 * BK8600 electronic load type - automatically includes feature methods.
 */
export type BK8600Load = LoadWithFeatures<typeof bkFeatures>;

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Mode mapping: LoadMode values to SCPI commands.
 * Note: BK Precision uses no colon prefix.
 */
const MODE_TO_SCPI: Record<LoadMode, string> = {
  [LoadMode.ConstantCurrent]: 'CURR',
  [LoadMode.ConstantVoltage]: 'VOLT',
  [LoadMode.ConstantResistance]: 'RES',
  [LoadMode.ConstantPower]: 'POW',
};

/**
 * Parse load mode from SCPI response.
 */
function parseLoadMode(s: string): LoadMode {
  const upper = s.trim().toUpperCase();
  if (upper.includes('VOLT') || upper === 'CV') return LoadMode.ConstantVoltage;
  if (upper.includes('RES') || upper === 'CR') return LoadMode.ConstantResistance;
  if (upper.includes('POW') || upper === 'CP') return LoadMode.ConstantPower;
  return LoadMode.ConstantCurrent;
}

/**
 * Format load mode for SCPI command.
 */
function formatLoadMode(mode: LoadMode): string {
  return MODE_TO_SCPI[mode] ?? 'CURR';
}

/**
 * Parse input state.
 */
function parseInputState(s: string): boolean {
  return s.includes('ON') || s.trim() === '1';
}

// ─────────────────────────────────────────────────────────────────
// List mode implementation (array format)
// ─────────────────────────────────────────────────────────────────

/**
 * Upload a list sequence to the load using array format.
 */
async function uploadList(
  ctx: DriverContext,
  mode: LoadMode,
  steps: ListStep[],
  repeat = 0
): Promise<Result<boolean, Error>> {
  const scpiMode = MODE_TO_SCPI[mode];
  if (!scpiMode) {
    return Err(new Error(`Invalid mode for list: ${mode}`));
  }

  // Set list mode type
  let result = await ctx.write(`LIST:MODE ${scpiMode}`);
  if (!result.ok) return result;

  // Set step count
  result = await ctx.write(`LIST:STEP ${steps.length}`);
  if (!result.ok) return result;

  // Set cycle count (0 = infinite)
  result = await ctx.write(`LIST:COUN ${repeat}`);
  if (!result.ok) return result;

  // Upload values as array
  const values = steps.map((s) => s.value).join(',');
  switch (mode) {
    case LoadMode.ConstantCurrent:
      result = await ctx.write(`LIST:CURR ${values}`);
      break;
    case LoadMode.ConstantVoltage:
      result = await ctx.write(`LIST:VOLT ${values}`);
      break;
    case LoadMode.ConstantResistance:
      result = await ctx.write(`LIST:RES ${values}`);
      break;
    case LoadMode.ConstantPower:
      result = await ctx.write(`LIST:POW ${values}`);
      break;
  }
  if (!result.ok) return result;

  // Upload dwell times as array
  const dwells = steps.map((s) => s.duration).join(',');
  result = await ctx.write(`LIST:DWEL ${dwells}`);
  if (!result.ok) return result;

  // Upload slew rates as array if any step has slew defined
  const hasSlew = steps.some((s) => s.slew !== undefined);
  if (hasSlew) {
    const slews = steps
      .map((s) => (s.slew !== undefined ? s.slew / SLEW_RATE_FACTOR : 1))
      .join(',');
    result = await ctx.write(`LIST:SLEW ${slews}`);
    if (!result.ok) return result;
  }

  return Ok(true);
}

/**
 * Start list execution.
 */
async function startList(
  ctx: DriverContext,
  _options?: ListModeOptions
): Promise<Result<boolean, Error>> {
  // Enable list mode
  let result = await ctx.write('LIST ON');
  if (!result.ok) return result;

  // Enable input
  result = await ctx.write('INP ON');
  if (!result.ok) return result;

  return Ok(true);
}

/**
 * Stop list execution.
 */
async function stopList(
  ctx: DriverContext,
  _options?: ListModeOptions
): Promise<Result<boolean, Error>> {
  const result = await ctx.write('LIST OFF');
  if (!result.ok) return result;
  return Ok(true);
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * BK Precision 8600 driver specification.
 */
const bk8600Spec: DriverSpec<BK8600Load, BK8600Channel, typeof bkFeatures> = {
  type: 'electronic-load',
  manufacturer: 'BK Precision',
  models: ['8600', '8601', '8602', '8610', '8612', '8614', '8616'],
  features: bkFeatures,

  properties: {
    // No instrument-level properties beyond base
  },

  // Commands (no-arg void methods)
  commands: {
    enableAllInputs: {
      command: 'INP ON',
      description: 'Enable all inputs',
    },
    disableAllInputs: {
      command: 'INP OFF',
      description: 'Disable all inputs',
    },
    clearAllProtection: {
      command: 'VOLT:PROT:CLE;CURR:PROT:CLE;POW:PROT:CLE',
      description: 'Clear all protection trips',
    },
  },

  // Custom method implementations
  methods: {
    // List mode
    uploadList: (ctx, mode: LoadMode, steps: ListStep[], repeat?: number) =>
      uploadList(ctx, mode, steps, repeat),
    startList: (ctx, options?: ListModeOptions) => startList(ctx, options),
    stopList: (ctx, options?: ListModeOptions) => stopList(ctx, options),

    // State save/recall
    saveState: async (ctx, slot: number): Promise<Result<void, Error>> => {
      return ctx.write(`*SAV ${slot}`);
    },
    recallState: async (ctx, slot: number): Promise<Result<void, Error>> => {
      return ctx.write(`*RCL ${slot}`);
    },
  },

  channels: {
    count: 1,
    indexStart: 1,
    properties: {
      mode: {
        get: 'MODE?',
        set: 'MODE {value}',
        parse: parseLoadMode,
        format: formatLoadMode,
      },

      current: {
        get: 'CURR?',
        set: 'CURR {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      voltage: {
        get: 'VOLT?',
        set: 'VOLT {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      resistance: {
        get: 'RES?',
        set: 'RES {value}',
        parse: parseScpiNumber,
        unit: 'Ω',
      },

      power: {
        get: 'POW?',
        set: 'POW {value}',
        parse: parseScpiNumber,
        unit: 'W',
      },

      inputEnabled: {
        get: 'INP?',
        set: 'INP {value}',
        parse: parseInputState,
        format: formatScpiBool,
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

      measuredPower: {
        get: 'MEAS:POW?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'W',
      },

      measuredResistance: {
        // Calculated from V/I
        get: 'MEAS:RES?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'Ω',
      },

      // Ranges
      currentRange: {
        get: 'CURR:RANG?',
        set: 'CURR:RANG {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      voltageRange: {
        get: 'VOLT:RANG?',
        set: 'VOLT:RANG {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      // Slew rate (BK uses A/µs, interface uses A/s)
      slewRate: {
        get: 'CURR:SLEW?',
        set: 'CURR:SLEW {value}',
        parse: (s: string) => parseScpiNumber(s) * SLEW_RATE_FACTOR,
        format: (v: number) => String(v / SLEW_RATE_FACTOR),
        unit: 'A/s',
      },

      // Over-voltage protection (OVP)
      ovpLevel: {
        get: 'VOLT:PROT:LEV?',
        set: 'VOLT:PROT:LEV {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      ovpEnabled: {
        get: 'VOLT:PROT:STAT?',
        set: 'VOLT:PROT:STAT {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      ovpTripped: {
        get: 'VOLT:PROT:TRIP?',
        parse: parseScpiBool,
        readonly: true,
      },

      // Over-current protection (OCP)
      ocpLevel: {
        get: 'CURR:PROT:LEV?',
        set: 'CURR:PROT:LEV {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      ocpEnabled: {
        get: 'CURR:PROT:STAT?',
        set: 'CURR:PROT:STAT {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      ocpTripped: {
        get: 'CURR:PROT:TRIP?',
        parse: parseScpiBool,
        readonly: true,
      },

      // Von/Voff thresholds
      vonThreshold: {
        get: 'VOLT:ON?',
        set: 'VOLT:ON {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      voffThreshold: {
        get: 'VOLT:OFF?',
        set: 'VOLT:OFF {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      // Short circuit feature
      shortEnabled: {
        get: 'INP:SHOR?',
        set: 'INP:SHOR {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      // LED feature
      ledVf: {
        get: 'LED:VF?',
        set: 'LED:VF {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      ledRd: {
        get: 'LED:RD?',
        set: 'LED:RD {value}',
        parse: parseScpiNumber,
        unit: 'Ω',
      },
    },

    // Channel commands
    commands: {
      clearOvp: {
        command: 'VOLT:PROT:CLE',
        description: 'Clear OVP trip',
      },
      clearOcp: {
        command: 'CURR:PROT:CLE',
        description: 'Clear OCP trip',
      },
    },
  },

  settings: {
    postCommandDelay: 30,
    resetDelay: 1000,
  },
};

/**
 * BK Precision 8600 electronic load driver.
 *
 * Supports 8600, 8601, 8602, 8610, 8612, 8614, 8616 series.
 *
 * **Features:** CP mode, Short circuit, LED test mode
 *
 * **Note:** BK Precision commands don't use the colon prefix.
 *
 * @example
 * ```typescript
 * import { bkPrecision8600 } from 'visa-ts/drivers/implementations/bk-precision/bk8600';
 *
 * const load = await bkPrecision8600.connect(resource);
 * if (load.ok) {
 *   const ch = load.value.channel(1);
 *
 *   // Set CC mode at 2A
 *   await ch.setMode('CC');
 *   await ch.setCurrent(2.0);
 *   await ch.setInputEnabled(true);
 *
 *   // Use short circuit feature
 *   await ch.setShortEnabled(true);
 *
 *   // Use LED test mode
 *   await ch.setLedVf(3.0);
 *   await ch.setLedRd(1.5);
 * }
 * ```
 */
export const bkPrecision8600 = defineDriver(bk8600Spec);
