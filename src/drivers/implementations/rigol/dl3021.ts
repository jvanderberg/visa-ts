/**
 * Rigol DL3021 Electronic Load Driver.
 *
 * Supports DL3021 and similar DL3000 series electronic loads.
 * Features CC, CV, CR, CP modes and programmable list mode.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, formatScpiBool } from '../../parsers.js';
import type { DriverSpec, DriverContext } from '../../types.js';
import type { Result } from '../../../result.js';
import { Ok, Err } from '../../../result.js';
import {
  LoadMode,
  type ElectronicLoadWithListMode,
  type ElectronicLoadChannel,
  type ListStep,
  type ListModeOptions,
} from '../../equipment/electronic-load.js';

// ─────────────────────────────────────────────────────────────────
// DL3021-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * DL3021 electronic load interface with list mode support (single-channel).
 */
export interface DL3021Load extends ElectronicLoadWithListMode {
  /** Access channel 1 (the only channel) */
  channel(n: 1): ElectronicLoadChannel;
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

  // Set current range (4A range for currents up to 4A, 40 for up to 40A)
  result = await ctx.write(':SOUR:LIST:RANG 4');
  if (!result.ok) return result;

  // Set step count
  result = await ctx.write(`:SOUR:LIST:STEP ${steps.length}`);
  if (!result.ok) return result;

  // Set cycle count (0 = infinite)
  result = await ctx.write(`:SOUR:LIST:COUN ${repeat}`);
  if (!result.ok) return result;

  // Upload each step (0-indexed for SCPI)
  for (const [i, step] of steps.entries()) {
    result = await ctx.write(`:SOUR:LIST:LEV ${i},${step.value}`);
    if (!result.ok) return result;

    result = await ctx.write(`:SOUR:LIST:WID ${i},${step.duration}`);
    if (!result.ok) return result;

    if (step.slew !== undefined) {
      result = await ctx.write(`:SOUR:LIST:SLEW ${i},${step.slew}`);
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
  // Switch to list mode
  let result = await ctx.write(':SOUR:FUNC:MODE LIST');
  if (!result.ok) return result;

  // Set trigger source to BUS
  result = await ctx.write(':TRIG:SOUR BUS');
  if (!result.ok) return result;

  // Enable input
  result = await ctx.write(':SOUR:INP ON');
  if (!result.ok) return result;

  // Trigger
  result = await ctx.write(':TRIG');
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
  // Switch back to fixed mode
  const result = await ctx.write(':SOUR:FUNC:MODE FIX');
  if (!result.ok) return result;
  return Ok(true);
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * Rigol DL3021 driver specification.
 */
const dl3021Spec: DriverSpec<DL3021Load, ElectronicLoadChannel> = {
  type: 'electronic-load',
  manufacturer: 'Rigol',
  models: ['DL3021', 'DL3021A', 'DL3031', 'DL3031A'],

  properties: {
    // List mode methods are implemented via custom methods
  },

  // Custom method implementations for list mode
  methods: {
    uploadList: (ctx, mode: LoadMode, steps: ListStep[], repeat?: number) =>
      uploadList(ctx, mode, steps, repeat),
    startList: (ctx, options?: ListModeOptions) => startList(ctx, options),
    stopList: (ctx, options?: ListModeOptions) => stopList(ctx, options),
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
        get: ':SOUR:CURR:LEV?',
        set: ':SOUR:CURR:LEV {value}',
        parse: parseScpiNumber,
        unit: 'A',
      },

      voltage: {
        get: ':SOUR:VOLT:LEV?',
        set: ':SOUR:VOLT:LEV {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      resistance: {
        get: ':SOUR:RES:LEV?',
        set: ':SOUR:RES:LEV {value}',
        parse: parseScpiNumber,
        unit: 'Ω',
      },

      power: {
        get: ':SOUR:POW:LEV?',
        set: ':SOUR:POW:LEV {value}',
        parse: parseScpiNumber,
        unit: 'W',
      },

      inputEnabled: {
        get: ':SOUR:INP:STAT?',
        set: ':SOUR:INP:STAT {value}',
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
    },
  },

  settings: {
    postCommandDelay: 20,
    resetDelay: 1000,
  },
};

/**
 * Rigol DL3021 electronic load driver.
 *
 * @example
 * ```typescript
 * import { rigolDL3021 } from 'visa-ts/drivers/implementations/rigol/dl3021';
 *
 * const load = await rigolDL3021.connect(resource);
 * if (load.ok) {
 *   const ch = load.value.channel(1);
 *
 *   // Set CC mode at 2A
 *   await ch.setMode('CC');
 *   await ch.setCurrent(2.0);
 *   await ch.setInputEnabled(true);
 *
 *   // Measure
 *   const v = await ch.getMeasuredVoltage();
 *   const i = await ch.getMeasuredCurrent();
 *   const p = await ch.getMeasuredPower();
 *
 *   // List mode example
 *   await load.value.uploadList('CC', [
 *     { value: 1.0, duration: 1.0 },
 *     { value: 2.0, duration: 0.5 },
 *     { value: 0.5, duration: 2.0 },
 *   ], 10);  // Repeat 10 times
 *   await load.value.startList();
 * }
 * ```
 */
export const rigolDL3021 = defineDriver(dl3021Spec);
