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
import type { Multimeter, DmmTriggerSource } from '../../equipment/multimeter.js';

// ─────────────────────────────────────────────────────────────────
// 34465A-specific interfaces (extend base)
// ─────────────────────────────────────────────────────────────────

/**
 * Keysight 34465A DMM interface - extends base with advanced features.
 */
export interface Keysight34465ADMM extends Multimeter {
  // Additional measurements (beyond base)
  /** Measure 4-wire resistance in Ω */
  getMeasuredResistance4W(): Promise<Result<number, Error>>;
  /** Measure capacitance in F */
  getMeasuredCapacitance(): Promise<Result<number, Error>>;
  /** Measure period in s */
  getMeasuredPeriod(): Promise<Result<number, Error>>;
  /** Measure temperature via RTD in °C */
  getMeasuredTemperatureRTD(): Promise<Result<number, Error>>;
  /** Measure temperature via thermocouple in °C */
  getMeasuredTemperatureTC(): Promise<Result<number, Error>>;

  // Auto range
  getAutoRange(): Promise<Result<boolean, Error>>;
  setAutoRange(v: boolean): Promise<Result<void, Error>>;

  // Resolution (NPLC)
  getNplc(): Promise<Result<number, Error>>;
  setNplc(v: number): Promise<Result<void, Error>>;

  // Triggering
  getTriggerSource(): Promise<Result<DmmTriggerSource, Error>>;
  setTriggerSource(v: DmmTriggerSource): Promise<Result<void, Error>>;
  getTriggerDelay(): Promise<Result<number, Error>>;
  setTriggerDelay(v: number): Promise<Result<void, Error>>;
  getTriggerCount(): Promise<Result<number, Error>>;
  setTriggerCount(v: number): Promise<Result<void, Error>>;

  // Sampling
  getSampleCount(): Promise<Result<number, Error>>;
  setSampleCount(v: number): Promise<Result<void, Error>>;

  // Additional measurement methods (preconfigured measurement + trigger + fetch)
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
 * Parse trigger source response.
 */
function parseTriggerSource(s: string): DmmTriggerSource {
  const val = s.trim().toUpperCase();
  if (val === 'IMMEDIATE' || val === 'IMM') return 'IMMEDIATE';
  if (val === 'EXTERNAL' || val === 'EXT') return 'EXTERNAL';
  if (val === 'BUS') return 'BUS';
  if (val === 'INTERNAL' || val === 'INT') return 'INTERNAL';
  return 'IMMEDIATE'; // Default
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
    // ─────────────────────────────────────────────────────────────────
    // Base interface measurements (readonly)
    // ─────────────────────────────────────────────────────────────────

    // Voltage
    measuredVoltageDC: {
      get: ':MEASure:VOLTage:DC?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'V',
    },
    measuredVoltageAC: {
      get: ':MEASure:VOLTage:AC?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'V',
    },

    // Current
    measuredCurrentDC: {
      get: ':MEASure:CURRent:DC?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'A',
    },
    measuredCurrentAC: {
      get: ':MEASure:CURRent:AC?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'A',
    },

    // Resistance (2-wire)
    measuredResistance: {
      get: ':MEASure:RESistance?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Ω',
    },

    // Frequency
    measuredFrequency: {
      get: ':MEASure:FREQuency?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Hz',
    },

    // Test modes
    measuredContinuity: {
      get: ':MEASure:CONTinuity?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Ω',
    },
    measuredDiode: {
      get: ':MEASure:DIODe?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'V',
    },

    // ─────────────────────────────────────────────────────────────────
    // Device-specific measurements (readonly)
    // ─────────────────────────────────────────────────────────────────

    // 4-wire resistance
    measuredResistance4W: {
      get: ':MEASure:FRESistance?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Ω',
    },

    // Capacitance
    measuredCapacitance: {
      get: ':MEASure:CAPacitance?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'F',
    },

    // Period
    measuredPeriod: {
      get: ':MEASure:PERiod?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 's',
    },

    // Temperature
    measuredTemperatureRTD: {
      get: ':MEASure:TEMPerature:RTD?',
      parse: parseScpiNumber,
      readonly: true,
      unit: '°C',
    },
    measuredTemperatureTC: {
      get: ':MEASure:TEMPerature:TCouple?',
      parse: parseScpiNumber,
      readonly: true,
      unit: '°C',
    },

    // ─────────────────────────────────────────────────────────────────
    // Configuration properties
    // ─────────────────────────────────────────────────────────────────

    // Auto range
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
    // Additional measurement methods (read last configured, fetch last reading)
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

  settings: {
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
 *   // Base measurements (all DMMs)
 *   const vdc = await dmm.value.getMeasuredVoltageDC();
 *   const vac = await dmm.value.getMeasuredVoltageAC();
 *   const adc = await dmm.value.getMeasuredCurrentDC();
 *   const ohms = await dmm.value.getMeasuredResistance();
 *   const hz = await dmm.value.getMeasuredFrequency();
 *
 *   // 34465A-specific measurements
 *   const ohms4w = await dmm.value.getMeasuredResistance4W();
 *   const cap = await dmm.value.getMeasuredCapacitance();
 *   const temp = await dmm.value.getMeasuredTemperatureRTD();
 *
 *   // Configure settings
 *   await dmm.value.setAutoRange(true);
 *   await dmm.value.setNplc(10);  // Higher = slower but more accurate
 * }
 * ```
 */
export const keysight34465A = defineDriver(keysight34465ASpec);
