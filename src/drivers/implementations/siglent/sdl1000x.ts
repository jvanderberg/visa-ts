/**
 * Siglent SDL1000X Series Electronic Load Driver.
 *
 * Supports SDL1020X, SDL1020X-E, SDL1030X, SDL1030X-E series electronic loads.
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
import type { LoadFeatureId, OppMethods } from '../../features/load-features.js';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

/** Conversion factor: A/µs to A/s */
const SLEW_RATE_FACTOR = 1_000_000;

// ─────────────────────────────────────────────────────────────────
// Features and Auto-Composed Types
// ─────────────────────────────────────────────────────────────────

/**
 * Features supported by SDL1000X series.
 */
const sdlFeatures = ['cp', 'short', 'led', 'opp'] as const satisfies readonly LoadFeatureId[];

/**
 * SDL1000X channel type - automatically includes ShortMethods and LedMethods.
 */
export type SDL1000XChannel = LoadChannelWithFeatures<typeof sdlFeatures>;

/**
 * SDL1000X electronic load type - includes feature methods plus instrument-level OPP.
 * Note: OPP is an instrument-level feature (not per-channel).
 */
export type SDL1000XLoad = LoadWithFeatures<typeof sdlFeatures> & OppMethods;

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
  // Default to CC (matches CURR or CC)
  return LoadMode.ConstantCurrent;
}

/**
 * Format load mode for SCPI command.
 */
function formatLoadMode(mode: LoadMode): string {
  return MODE_TO_SCPI[mode] ?? 'CURR';
}

/**
 * Parse input state (load uses "input" not "output").
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
  let result = await ctx.write(`:SOUR:LIST:MODE ${scpiMode}`);
  if (!result.ok) return result;

  // Set step count
  result = await ctx.write(`:SOUR:LIST:STEP ${steps.length}`);
  if (!result.ok) return result;

  // Set cycle count (0 = infinite)
  result = await ctx.write(`:SOUR:LIST:COUN ${repeat}`);
  if (!result.ok) return result;

  // Upload each step (1-indexed for Siglent)
  for (const [i, step] of steps.entries()) {
    const stepNum = i + 1;

    // Use the appropriate command based on mode
    switch (mode) {
      case LoadMode.ConstantCurrent:
        result = await ctx.write(`:SOUR:LIST:CURR ${stepNum},${step.value}`);
        break;
      case LoadMode.ConstantVoltage:
        result = await ctx.write(`:SOUR:LIST:VOLT ${stepNum},${step.value}`);
        break;
      case LoadMode.ConstantResistance:
        result = await ctx.write(`:SOUR:LIST:RES ${stepNum},${step.value}`);
        break;
      case LoadMode.ConstantPower:
        result = await ctx.write(`:SOUR:LIST:POW ${stepNum},${step.value}`);
        break;
    }
    if (!result.ok) return result;

    result = await ctx.write(`:SOUR:LIST:WID ${stepNum},${step.duration}`);
    if (!result.ok) return result;

    if (step.slew !== undefined) {
      // Convert A/s to A/µs for Siglent
      const slewMicro = step.slew / SLEW_RATE_FACTOR;
      result = await ctx.write(`:SOUR:LIST:SLEW ${stepNum},${slewMicro}`);
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
  // Enable list mode
  let result = await ctx.write(':SOUR:LIST ON');
  if (!result.ok) return result;

  // Enable input
  result = await ctx.write(':INP ON');
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
  // Disable list mode
  const result = await ctx.write(':SOUR:LIST OFF');
  if (!result.ok) return result;
  return Ok(true);
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * Siglent SDL1000X series driver specification.
 */
const sdl1000xSpec: DriverSpec<SDL1000XLoad, SDL1000XChannel, typeof sdlFeatures> = {
  type: 'electronic-load',
  manufacturer: 'Siglent',
  models: ['SDL1020X', 'SDL1020X-E', 'SDL1030X', 'SDL1030X-E'],
  features: sdlFeatures,

  properties: {
    // OPP feature properties (on instrument level)
    oppLevel: {
      get: ':SOUR:POW:PROT?',
      set: ':SOUR:POW:PROT {value}',
      parse: parseScpiNumber,
      unit: 'W',
    },

    oppEnabled: {
      get: ':SOUR:POW:PROT:STAT?',
      set: ':SOUR:POW:PROT:STAT {value}',
      parse: parseScpiBool,
      format: formatScpiBool,
    },
  },

  // Commands (no-arg void methods)
  commands: {
    enableAllInputs: {
      command: ':INP ON',
      description: 'Enable all inputs',
    },
    disableAllInputs: {
      command: ':INP OFF',
      description: 'Disable all inputs',
    },
    clearAllProtection: {
      command: ':SOUR:VOLT:PROT:CLE;:SOUR:CURR:PROT:CLE;:SOUR:POW:PROT:CLE',
      description: 'Clear all protection trips',
    },
  },

  // Custom method implementations (methods with parameters)
  methods: {
    // List mode
    uploadList: (ctx, mode: LoadMode, steps: ListStep[], repeat?: number) =>
      uploadList(ctx, mode, steps, repeat),
    startList: (ctx, options?: ListModeOptions) => startList(ctx, options),
    stopList: (ctx, options?: ListModeOptions) => stopList(ctx, options),

    // State save/recall (using standard IEEE 488.2 commands)
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
        get: ':SOUR:FUNC?',
        set: ':SOUR:FUNC {value}',
        parse: parseLoadMode,
        format: formatLoadMode,
      },

      current: {
        get: ':SOUR:CURR?',
        set: ':SOUR:CURR {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      voltage: {
        get: ':SOUR:VOLT?',
        set: ':SOUR:VOLT {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      resistance: {
        get: ':SOUR:RES?',
        set: ':SOUR:RES {value}',
        parse: parseScpiNumber,
        unit: 'Ω',
      },

      power: {
        get: ':SOUR:POW?',
        set: ':SOUR:POW {value}',
        parse: parseScpiNumber,
        unit: 'W',
      },

      inputEnabled: {
        get: ':INP?',
        set: ':INP {value}',
        parse: parseInputState,
        format: formatScpiBool,
      },

      measuredVoltage: {
        get: ':MEAS:VOLT?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredCurrent: {
        get: ':MEAS:CURR?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'A',
      },

      measuredPower: {
        get: ':MEAS:POW?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'W',
      },

      measuredResistance: {
        get: ':MEAS:RES?',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'Ω',
      },

      // Ranges
      currentRange: {
        get: ':SOUR:CURR:RANG?',
        set: ':SOUR:CURR:RANG {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      voltageRange: {
        get: ':SOUR:VOLT:RANG?',
        set: ':SOUR:VOLT:RANG {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      // Slew rate (SDL uses A/µs, interface uses A/s)
      slewRate: {
        get: ':SOUR:CURR:SLEW?',
        set: ':SOUR:CURR:SLEW {value}',
        parse: (s: string) => parseScpiNumber(s) * SLEW_RATE_FACTOR,
        format: (v: number) => String(v / SLEW_RATE_FACTOR),
        unit: 'A/s',
      },

      // Over-voltage protection (OVP)
      ovpLevel: {
        get: ':SOUR:VOLT:PROT?',
        set: ':SOUR:VOLT:PROT {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      ovpEnabled: {
        get: ':SOUR:VOLT:PROT:STAT?',
        set: ':SOUR:VOLT:PROT:STAT {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      ovpTripped: {
        get: ':STAT:QUES:COND?',
        parse: (s: string) => (parseInt(s.trim(), 10) & 1) !== 0, // Bit 0 = OVP
        readonly: true,
      },

      // Over-current protection (OCP)
      ocpLevel: {
        get: ':SOUR:CURR:PROT?',
        set: ':SOUR:CURR:PROT {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      ocpEnabled: {
        get: ':SOUR:CURR:PROT:STAT?',
        set: ':SOUR:CURR:PROT:STAT {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      ocpTripped: {
        get: ':STAT:QUES:COND?',
        parse: (s: string) => (parseInt(s.trim(), 10) & 2) !== 0, // Bit 1 = OCP
        readonly: true,
      },

      // Von/Voff thresholds (operating voltage window)
      vonThreshold: {
        get: ':SOUR:VOLT:ON?',
        set: ':SOUR:VOLT:ON {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      voffThreshold: {
        get: ':SOUR:VOLT:OFF?',
        set: ':SOUR:VOLT:OFF {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      // Short circuit feature
      shortEnabled: {
        get: ':SOUR:SHOR?',
        set: ':SOUR:SHOR {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      // LED feature
      ledVf: {
        get: ':SOUR:LED:VD?',
        set: ':SOUR:LED:VD {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      ledRd: {
        get: ':SOUR:LED:RD?',
        set: ':SOUR:LED:RD {value}',
        parse: parseScpiNumber,
        unit: 'Ω',
      },
    },

    // Channel commands
    commands: {
      clearOvp: {
        command: ':SOUR:VOLT:PROT:CLE',
        description: 'Clear OVP trip',
      },
      clearOcp: {
        command: ':SOUR:CURR:PROT:CLE',
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
 * Siglent SDL1000X series electronic load driver.
 *
 * Supports SDL1020X, SDL1020X-E, SDL1030X, SDL1030X-E models.
 *
 * **Features:** CP mode, Short circuit, LED test mode, OPP protection
 *
 * @example
 * ```typescript
 * import { siglentSDL1000X } from 'visa-ts/drivers/implementations/siglent/sdl1000x';
 *
 * const load = await siglentSDL1000X.connect(resource);
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
 *
 *   // Measure
 *   const v = await ch.getMeasuredVoltage();
 *   const i = await ch.getMeasuredCurrent();
 * }
 * ```
 */
export const siglentSDL1000X = defineDriver(sdl1000xSpec);
