/**
 * ITECH IT8812 Electronic Load Driver.
 *
 * Supports IT8800 series electronic loads (IT8811, IT8812, IT8812B, IT8813, etc.).
 * Features CC, CV, CR, CP, LED modes, short circuit, and programmable list mode.
 *
 * **Note:** ITECH uses A/s for slew rate (not A/µs like other manufacturers).
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
  type ElectronicLoad,
  type ElectronicLoadChannel,
  type ListStep,
  type ListModeOptions,
} from '../../equipment/electronic-load.js';
import type { LoadFeatureId, ShortMethods, LedMethods } from '../../features/load-features.js';

// ─────────────────────────────────────────────────────────────────
// IT8812-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * IT8812 channel interface with feature methods.
 */
export interface IT8812Channel extends ElectronicLoadChannel, ShortMethods, LedMethods {}

/**
 * IT8812 electronic load interface with features.
 */
export interface IT8812Load extends ElectronicLoad {
  /** Access channel 1 (single channel load) */
  channel(n: 1): IT8812Channel;

  /** Features supported by this driver */
  readonly features: typeof itechFeatures;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Mode mapping: LoadMode values to SCPI commands.
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
// List mode implementation
// ─────────────────────────────────────────────────────────────────

/**
 * Upload a list sequence to the load.
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

  // Upload each step (1-indexed)
  for (const [i, step] of steps.entries()) {
    const stepNum = i + 1;

    switch (mode) {
      case LoadMode.ConstantCurrent:
        result = await ctx.write(`LIST:CURR ${stepNum},${step.value}`);
        break;
      case LoadMode.ConstantVoltage:
        result = await ctx.write(`LIST:VOLT ${stepNum},${step.value}`);
        break;
      case LoadMode.ConstantResistance:
        result = await ctx.write(`LIST:RES ${stepNum},${step.value}`);
        break;
      case LoadMode.ConstantPower:
        result = await ctx.write(`LIST:POW ${stepNum},${step.value}`);
        break;
    }
    if (!result.ok) return result;

    result = await ctx.write(`LIST:WID ${stepNum},${step.duration}`);
    if (!result.ok) return result;

    if (step.slew !== undefined) {
      // ITECH uses A/s - no conversion needed!
      result = await ctx.write(`LIST:SLEW ${stepNum},${step.slew}`);
      if (!result.ok) return result;
    }
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
  let result = await ctx.write('LIST ON');
  if (!result.ok) return result;

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
 * Features supported by IT8812.
 */
const itechFeatures = ['cp', 'short', 'led'] as const satisfies readonly LoadFeatureId[];

/**
 * ITECH IT8812 driver specification.
 */
const it8812Spec: DriverSpec<IT8812Load, IT8812Channel, typeof itechFeatures> = {
  type: 'electronic-load',
  manufacturer: 'ITECH',
  models: [
    'IT8811',
    'IT8812',
    'IT8812B',
    'IT8813',
    'IT8814',
    'IT8815',
    'IT8816',
    'IT8817',
    'IT8818',
  ],
  features: itechFeatures,

  properties: {},

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

  methods: {
    uploadList: (ctx, mode: LoadMode, steps: ListStep[], repeat?: number) =>
      uploadList(ctx, mode, steps, repeat),
    startList: (ctx, options?: ListModeOptions) => startList(ctx, options),
    stopList: (ctx, options?: ListModeOptions) => stopList(ctx, options),

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
      // Mode uses FUNC command on ITECH
      mode: {
        get: 'FUNC?',
        set: 'FUNC {value}',
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
        get: 'MEAS:RES?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'Ω',
      },

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

      // ITECH uses A/s natively - no conversion needed!
      slewRate: {
        get: 'CURR:SLEW?',
        set: 'CURR:SLEW {value}',
        parse: parseScpiNumber,
        unit: 'A/s',
      },

      ovpLevel: {
        get: 'VOLT:PROT?',
        set: 'VOLT:PROT {value}',
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

      ocpLevel: {
        get: 'CURR:PROT?',
        set: 'CURR:PROT {value}',
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

      shortEnabled: {
        get: 'INP:SHOR?',
        set: 'INP:SHOR {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

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
    postCommandDelay: 20,
    resetDelay: 1000,
  },
};

/**
 * ITECH IT8812 electronic load driver.
 *
 * Supports IT8800 series (IT8811, IT8812, IT8812B, IT8813, IT8814, IT8815, IT8816, IT8817, IT8818).
 *
 * **Features:** CP mode, Short circuit, LED test mode
 *
 * **Note:** ITECH uses A/s for slew rate (not A/µs like other manufacturers).
 *
 * @example
 * ```typescript
 * import { itechIT8812 } from 'visa-ts/drivers/implementations/itech/it8812';
 *
 * const load = await itechIT8812.connect(resource);
 * if (load.ok) {
 *   const ch = load.value.channel(1);
 *
 *   // Set CC mode at 2A
 *   await ch.setMode('CC');
 *   await ch.setCurrent(2.0);
 *   await ch.setSlewRate(1000); // 1000 A/s (native units!)
 *   await ch.setInputEnabled(true);
 * }
 * ```
 */
export const itechIT8812 = defineDriver(it8812Spec);
