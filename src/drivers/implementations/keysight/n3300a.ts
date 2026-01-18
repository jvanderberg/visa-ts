/**
 * Keysight N3300A Electronic Load Driver.
 *
 * Supports N3300A mainframe with modules (N3302A-N3307A) and EL34243A bench load.
 * Features CC, CV, CR modes, multi-channel, and programmable list mode.
 *
 * **Note:** Keysight loads do not have CP (Constant Power) mode via SCPI.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec, DriverContext } from '../../types.js';
import type { Result } from '../../../result.js';
import { Ok } from '../../../result.js';
import {
  LoadMode,
  type ElectronicLoadChannel,
  type ListStep,
  type ListModeOptions,
  type LoadWithFeatures,
} from '../../equipment/electronic-load.js';
import type { LoadFeatureId } from '../../features/load-features.js';

// ─────────────────────────────────────────────────────────────────
// Features and Auto-Composed Types
// ─────────────────────────────────────────────────────────────────

/**
 * Features supported by N3300A (none - no CP, short, or LED modes).
 */
const n3300Features = [] as const satisfies readonly LoadFeatureId[];

/**
 * N3300A channel type - base interface only, no extra feature methods.
 */
export type N3300AChannel = ElectronicLoadChannel;

/**
 * N3300A electronic load type with multi-channel selection.
 * Note: Can have 1-6 channels depending on installed modules.
 */
export type N3300ALoad = LoadWithFeatures<typeof n3300Features> & {
  /** Select a channel for subsequent commands (N3300A multi-channel) */
  selectChannel(channel: number): Promise<Result<void, Error>>;
};

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Mode mapping: LoadMode values to SCPI commands.
 * Note: Keysight does not have CP mode.
 */
const MODE_TO_SCPI: Record<LoadMode, string> = {
  [LoadMode.ConstantCurrent]: 'CURR',
  [LoadMode.ConstantVoltage]: 'VOLT',
  [LoadMode.ConstantResistance]: 'RES',
  [LoadMode.ConstantPower]: 'CURR', // Fall back to CC for CP (not supported)
};

/**
 * Parse load mode from SCPI response.
 */
function parseLoadMode(s: string): LoadMode {
  const upper = s.trim().toUpperCase();
  if (upper.includes('VOLT') || upper === 'CV') return LoadMode.ConstantVoltage;
  if (upper.includes('RES') || upper === 'CR') return LoadMode.ConstantResistance;
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
  // Note: Keysight doesn't have a separate LIST:MODE command
  // The mode is determined by which LIST:xxx command is used

  // Set step count
  let result = await ctx.write(`LIST:STEP ${steps.length}`);
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
      // Fall back to CC (CP not supported)
      result = await ctx.write(`LIST:CURR ${values}`);
      break;
  }
  if (!result.ok) return result;

  // Upload dwell times as array
  const dwells = steps.map((s) => s.duration).join(',');
  result = await ctx.write(`LIST:DWEL ${dwells}`);
  if (!result.ok) return result;

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
 * Keysight N3300A driver specification.
 */
const n3300aSpec: DriverSpec<N3300ALoad, N3300AChannel, typeof n3300Features> = {
  type: 'electronic-load',
  manufacturer: 'Keysight',
  models: ['N3300A', 'N3302A', 'N3303A', 'N3304A', 'N3305A', 'N3306A', 'N3307A', 'EL34243A'],
  features: n3300Features,

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
      command: 'INP:PROT:CLE',
      description: 'Clear all protection trips',
    },
  },

  methods: {
    uploadList: (ctx, mode: LoadMode, steps: ListStep[], repeat?: number) =>
      uploadList(ctx, mode, steps, repeat),
    startList: (ctx, options?: ListModeOptions) => startList(ctx, options),
    stopList: (ctx, options?: ListModeOptions) => stopList(ctx, options),

    // State save/recall (0-3 for Keysight)
    saveState: async (ctx, slot: number): Promise<Result<void, Error>> => {
      return ctx.write(`*SAV ${slot}`);
    },
    recallState: async (ctx, slot: number): Promise<Result<void, Error>> => {
      return ctx.write(`*RCL ${slot}`);
    },

    // Channel selection for multi-channel operation
    selectChannel: async (ctx, channel: number): Promise<Result<void, Error>> => {
      return ctx.write(`INST:SEL CH${channel}`);
    },
  },

  channels: {
    count: 1, // EL34243A is single channel; N3300A with modules is more
    indexStart: 1,
    properties: {
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
        // No dedicated power setpoint - return 0
        get: 'MEAS:POW?',
        parse: parseScpiNumber,
        readonly: true,
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

      // Keysight uses A/s natively - no conversion needed
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
        get: 'STAT:QUES:COND?',
        parse: (s: string) => (parseInt(s.trim(), 10) & 1) !== 0,
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
        get: 'STAT:QUES:COND?',
        parse: (s: string) => (parseInt(s.trim(), 10) & 2) !== 0,
        readonly: true,
      },

      // Keysight doesn't have Von/Voff - use notSupported pattern
      vonThreshold: {
        notSupported: true,
      },

      voffThreshold: {
        notSupported: true,
      },
    },

    commands: {
      clearOvp: {
        command: 'INP:PROT:CLE',
        description: 'Clear protection trip',
      },
      clearOcp: {
        command: 'INP:PROT:CLE',
        description: 'Clear protection trip',
      },
    },
  },

  settings: {
    postCommandDelay: 20,
    resetDelay: 1000,
  },
};

/**
 * Keysight N3300A electronic load driver.
 *
 * Supports N3300A mainframe with modules and EL34243A bench load.
 *
 * **Note:** Keysight loads do not have CP (Constant Power), Short circuit, or LED modes.
 *
 * @example
 * ```typescript
 * import { keysightN3300A } from 'visa-ts/drivers/implementations/keysight/n3300a';
 *
 * const load = await keysightN3300A.connect(resource);
 * if (load.ok) {
 *   const ch = load.value.channel(1);
 *
 *   // Set CC mode at 2A
 *   await ch.setMode('CC');
 *   await ch.setCurrent(2.0);
 *   await ch.setSlewRate(1000); // 1000 A/s (native units)
 *   await ch.setInputEnabled(true);
 *
 *   // For multi-channel N3300A
 *   await load.value.selectChannel(2);
 *   await ch.setCurrent(3.0);
 * }
 * ```
 */
export const keysightN3300A = defineDriver(n3300aSpec);
