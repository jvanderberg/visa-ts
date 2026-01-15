/**
 * Keysight 34465A Digital Multimeter Driver.
 *
 * Supports 34460A, 34461A, 34465A, 34470A and similar TrueVolt DMMs.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import { Ok } from '../../../result.js';
import type { DriverSpec, DriverContext } from '../../types.js';
import type { Result } from '../../../result.js';

// ─────────────────────────────────────────────────────────────────
// 34465A-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * Keysight 34465A DMM interface - defines what this driver implements.
 */
export interface Keysight34465ADMM {
  // Properties
  getFunction(): Promise<Result<string, Error>>;
  setFunction(v: string): Promise<Result<void, Error>>;
  getRange(): Promise<Result<number, Error>>;
  setRange(v: number): Promise<Result<void, Error>>;
  getAutoRange(): Promise<Result<boolean, Error>>;
  setAutoRange(v: boolean): Promise<Result<void, Error>>;
  getNplc(): Promise<Result<number, Error>>;
  setNplc(v: number): Promise<Result<void, Error>>;
  getTriggerSource(): Promise<Result<string, Error>>;
  setTriggerSource(v: string): Promise<Result<void, Error>>;
  getTriggerDelay(): Promise<Result<number, Error>>;
  setTriggerDelay(v: number): Promise<Result<void, Error>>;
  getTriggerCount(): Promise<Result<number, Error>>;
  setTriggerCount(v: number): Promise<Result<void, Error>>;
  getSampleCount(): Promise<Result<number, Error>>;
  setSampleCount(v: number): Promise<Result<void, Error>>;

  // Methods
  measure(): Promise<Result<number, Error>>;
  read(): Promise<Result<number, Error>>;
  fetch(): Promise<Result<number, Error>>;

  // Commands
  initiate(): Promise<Result<void, Error>>;
  abort(): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Map of DMM function names to SCPI function strings.
 */
const FUNCTION_MAP: Record<string, string> = {
  VDC: 'VOLTage:DC',
  VAC: 'VOLTage:AC',
  VDC_AC: 'VOLTage:DC:ACDC',
  ADC: 'CURRent:DC',
  AAC: 'CURRent:AC',
  ADC_AC: 'CURRent:DC:ACDC',
  RESISTANCE_2W: 'RESistance',
  RESISTANCE_4W: 'FRESistance',
  FREQUENCY: 'FREQuency',
  PERIOD: 'PERiod',
  CAPACITANCE: 'CAPacitance',
  TEMPERATURE_RTD: 'TEMPerature:RTD',
  TEMPERATURE_TC: 'TEMPerature:TC',
  CONTINUITY: 'CONTinuity',
  DIODE: 'DIODe',
};

/**
 * Map of SCPI function strings to DMM function names.
 */
const FUNCTION_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FUNCTION_MAP).map(([k, v]) => [v.toUpperCase(), k])
);

/**
 * Parse DMM function response.
 */
function parseDmmFunction(s: string): string {
  // Remove quotes and normalize
  const val = s.trim().replace(/^"|"$/g, '').toUpperCase();
  return FUNCTION_REVERSE_MAP[val] ?? val;
}

/**
 * Format DMM function for command.
 */
function formatDmmFunction(func: string): string {
  const scpiFunc = FUNCTION_MAP[func];
  return scpiFunc ? `"${scpiFunc}"` : func;
}

/**
 * Parse trigger source response.
 */
function parseTriggerSource(s: string): string {
  const val = s.trim().toUpperCase();
  if (val === 'IMMEDIATE' || val === 'IMM') return 'IMMEDIATE';
  if (val === 'EXTERNAL' || val === 'EXT') return 'EXTERNAL';
  return val;
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * Keysight 34465A driver specification.
 */
const keysight34465ASpec: DriverSpec<Keysight34465ADMM> = {
  type: 'multimeter',
  manufacturer: 'Keysight',
  models: ['34460A', '34461A', '34465A', '34470A'],

  properties: {
    // Function selection
    function: {
      get: ':SENSe:FUNCtion?',
      set: ':SENSe:FUNCtion {value}',
      parse: parseDmmFunction,
      format: formatDmmFunction,
    },

    // Range (for DC voltage as default)
    range: {
      get: ':SENSe:VOLTage:DC:RANGe?',
      set: ':SENSe:VOLTage:DC:RANGe {value}',
      parse: parseScpiNumber,
    },

    autoRange: {
      get: ':SENSe:VOLTage:DC:RANGe:AUTO?',
      set: ':SENSe:VOLTage:DC:RANGe:AUTO {value}',
      parse: parseScpiBool,
      format: formatScpiBool,
    },

    // Resolution (NPLC)
    nplc: {
      get: ':SENSe:VOLTage:DC:NPLC?',
      set: ':SENSe:VOLTage:DC:NPLC {value}',
      parse: parseScpiNumber,
    },

    // Trigger
    triggerSource: {
      get: ':TRIGger:SOURce?',
      set: ':TRIGger:SOURce {value}',
      parse: parseTriggerSource,
    },

    triggerDelay: {
      get: ':TRIGger:DELay?',
      set: ':TRIGger:DELay {value}',
      parse: parseScpiNumber,
    },

    triggerCount: {
      get: ':TRIGger:COUNt?',
      set: ':TRIGger:COUNt {value}',
      parse: parseScpiNumber,
    },

    // Sample
    sampleCount: {
      get: ':SAMPle:COUNt?',
      set: ':SAMPle:COUNt {value}',
      parse: parseScpiNumber,
    },
  },

  methods: {
    // Measurement methods - these trigger actual measurements
    async measure(ctx: DriverContext): Promise<Result<number, Error>> {
      const result = await ctx.query(':MEASure:VOLTage:DC?');
      if (!result.ok) return result;
      return Ok(parseScpiNumber(result.value));
    },

    async read(ctx: DriverContext): Promise<Result<number, Error>> {
      const result = await ctx.query(':READ?');
      if (!result.ok) return result;
      return Ok(parseScpiNumber(result.value));
    },

    async fetch(ctx: DriverContext): Promise<Result<number, Error>> {
      const result = await ctx.query(':FETCh?');
      if (!result.ok) return result;
      return Ok(parseScpiNumber(result.value));
    },
  },

  commands: {
    initiate: { command: ':INITiate', description: 'Initiate measurement' },
    abort: { command: ':ABORt', description: 'Abort measurement' },
  },

  capabilities: ['data-logging', 'histogram', 'math', 'trend-chart'],

  quirks: {
    postQueryDelay: 10,
    resetDelay: 1000,
  },
};

/**
 * Keysight 34465A digital multimeter driver.
 *
 * @example
 * ```typescript
 * import { keysight34465A } from 'visa-ts/drivers/implementations/keysight/34465a';
 *
 * const dmm = await keysight34465A.connect(resource);
 * if (dmm.ok) {
 *   // Configure for DC voltage measurement
 *   await dmm.value.setFunction('VDC');
 *   await dmm.value.setAutoRange(true);
 *   await dmm.value.setNplc(10);
 *
 *   // Take a measurement
 *   const reading = await dmm.value.measure();
 *   console.log(`Voltage: ${reading.value} V`);
 * }
 * ```
 */
export const keysight34465A = defineDriver(keysight34465ASpec);
