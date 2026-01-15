/**
 * Rigol DS1054Z Oscilloscope Driver.
 *
 * Supports DS1054Z and DS1104Z-Plus 4-channel oscilloscopes.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec } from '../../types.js';
import type { Result } from '../../../result.js';

// ─────────────────────────────────────────────────────────────────
// DS1054Z-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * DS1054Z channel interface - defines what this driver implements.
 */
export interface DS1054ZChannel {
  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(v: boolean): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;
  setScale(v: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;
  setOffset(v: number): Promise<Result<void, Error>>;
  getCoupling(): Promise<Result<string, Error>>;
  setCoupling(v: string): Promise<Result<void, Error>>;
  getBandwidthLimit(): Promise<Result<string, Error>>;
  setBandwidthLimit(v: string): Promise<Result<void, Error>>;
  getProbeAttenuation(): Promise<Result<number, Error>>;
  setProbeAttenuation(v: number): Promise<Result<void, Error>>;
  getInverted(): Promise<Result<boolean, Error>>;
  setInverted(v: boolean): Promise<Result<void, Error>>;
  getLabel(): Promise<Result<string, Error>>;
  setLabel(v: string): Promise<Result<void, Error>>;
}

/**
 * DS1054Z oscilloscope interface - defines what this driver implements.
 */
export interface DS1054ZScope {
  // Timebase
  getTimebase(): Promise<Result<number, Error>>;
  setTimebase(v: number): Promise<Result<void, Error>>;
  getTimebaseOffset(): Promise<Result<number, Error>>;
  setTimebaseOffset(v: number): Promise<Result<void, Error>>;
  getTimebaseMode(): Promise<Result<string, Error>>;
  setTimebaseMode(v: string): Promise<Result<void, Error>>;
  getSampleRate(): Promise<Result<number, Error>>;
  getRecordLength(): Promise<Result<number, Error>>;
  setRecordLength(v: number): Promise<Result<void, Error>>;

  // Trigger
  getTriggerLevel(): Promise<Result<number, Error>>;
  setTriggerLevel(v: number): Promise<Result<void, Error>>;
  getTriggerSlope(): Promise<Result<string, Error>>;
  setTriggerSlope(v: string): Promise<Result<void, Error>>;
  getTriggerMode(): Promise<Result<string, Error>>;
  setTriggerMode(v: string): Promise<Result<void, Error>>;
  getTriggerSource(): Promise<Result<string, Error>>;
  setTriggerSource(v: string): Promise<Result<void, Error>>;

  // Acquisition
  getAcquisitionMode(): Promise<Result<string, Error>>;
  setAcquisitionMode(v: string): Promise<Result<void, Error>>;
  getRunning(): Promise<Result<boolean, Error>>;

  // Commands
  run(): Promise<Result<void, Error>>;
  stop(): Promise<Result<void, Error>>;
  single(): Promise<Result<void, Error>>;
  autoScale(): Promise<Result<void, Error>>;
  forceTrigger(): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Parse trigger slope response.
 */
function parseTriggerSlope(s: string): string {
  const val = s.trim().toUpperCase();
  if (val === 'POSITIVE' || val === 'POS') return 'RISING';
  if (val === 'NEGATIVE' || val === 'NEG') return 'FALLING';
  if (val === 'RFAL' || val === 'EITHER') return 'EITHER';
  return val;
}

/**
 * Format trigger slope for command.
 */
function formatTriggerSlope(slope: string): string {
  if (slope === 'RISING') return 'POSitive';
  if (slope === 'FALLING') return 'NEGative';
  if (slope === 'EITHER') return 'RFALl';
  return slope;
}

/**
 * Parse trigger mode response.
 */
function parseTriggerMode(s: string): string {
  const val = s.trim().toUpperCase();
  if (val === 'SING') return 'SINGLE';
  if (val === 'NORM') return 'NORMAL';
  return val;
}

/**
 * Format trigger mode for command.
 */
function formatTriggerMode(mode: string): string {
  if (mode === 'SINGLE') return 'SINGle';
  if (mode === 'NORMAL') return 'NORMal';
  return mode;
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * Rigol DS1000Z series driver specification.
 */
const ds1054zSpec: DriverSpec<DS1054ZScope, DS1054ZChannel> = {
  type: 'oscilloscope',
  manufacturer: 'Rigol',
  models: ['DS1054Z', 'DS1104Z-Plus', 'DS1074Z', 'DS1074Z-Plus'],

  properties: {
    // Timebase
    timebase: {
      get: ':TIMebase:MAIN:SCALe?',
      set: ':TIMebase:MAIN:SCALe {value}',
      parse: parseScpiNumber,
      unit: 's/div',
    },

    timebaseOffset: {
      get: ':TIMebase:MAIN:OFFSet?',
      set: ':TIMebase:MAIN:OFFSet {value}',
      parse: parseScpiNumber,
      unit: 's',
    },

    timebaseMode: {
      get: ':TIMebase:MODE?',
      set: ':TIMebase:MODE {value}',
      parse: (s: string) => s.trim().toUpperCase(),
    },

    sampleRate: {
      get: ':ACQuire:SRATe?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Sa/s',
    },

    recordLength: {
      get: ':ACQuire:MDEPth?',
      set: ':ACQuire:MDEPth {value}',
      parse: (s: string) => {
        const val = s.trim().toUpperCase();
        if (val === 'AUTO') return 0;
        return parseScpiNumber(val);
      },
      unit: 'points',
    },

    // Trigger
    triggerLevel: {
      get: ':TRIGger:EDGe:LEVel?',
      set: ':TRIGger:EDGe:LEVel {value}',
      parse: parseScpiNumber,
      unit: 'V',
    },

    triggerSlope: {
      get: ':TRIGger:EDGe:SLOPe?',
      set: ':TRIGger:EDGe:SLOPe {value}',
      parse: parseTriggerSlope,
      format: formatTriggerSlope,
    },

    triggerMode: {
      get: ':TRIGger:SWEep?',
      set: ':TRIGger:SWEep {value}',
      parse: parseTriggerMode,
      format: formatTriggerMode,
    },

    triggerSource: {
      get: ':TRIGger:EDGe:SOURce?',
      set: ':TRIGger:EDGe:SOURce {value}',
      parse: (s: string) => s.trim().toUpperCase(),
    },

    // Acquisition
    acquisitionMode: {
      get: ':ACQuire:TYPE?',
      set: ':ACQuire:TYPE {value}',
      parse: (s: string) => s.trim().toUpperCase(),
    },

    running: {
      get: ':TRIGger:STATus?',
      parse: (s: string) => {
        const status = s.trim().toUpperCase();
        return status === 'RUN' || status === 'WAIT' || status === 'AUTO';
      },
      readonly: true,
    },
  },

  commands: {
    run: { command: ':RUN', description: 'Start acquisition' },
    stop: { command: ':STOP', description: 'Stop acquisition' },
    single: { command: ':SINGle', description: 'Single trigger' },
    autoScale: { command: ':AUToscale', delay: 3000, description: 'Auto scale all channels' },
    forceTrigger: { command: ':TFORce', description: 'Force trigger' },
  },

  channels: {
    count: 4,
    indexStart: 1,
    properties: {
      enabled: {
        get: ':CHANnel{ch}:DISPlay?',
        set: ':CHANnel{ch}:DISPlay {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      scale: {
        get: ':CHANnel{ch}:SCALe?',
        set: ':CHANnel{ch}:SCALe {value}',
        parse: parseScpiNumber,
        unit: 'V/div',
      },

      offset: {
        get: ':CHANnel{ch}:OFFSet?',
        set: ':CHANnel{ch}:OFFSet {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      coupling: {
        get: ':CHANnel{ch}:COUPling?',
        set: ':CHANnel{ch}:COUPling {value}',
        parse: (s: string) => s.trim().toUpperCase(),
      },

      bandwidthLimit: {
        get: ':CHANnel{ch}:BWLimit?',
        set: ':CHANnel{ch}:BWLimit {value}',
        parse: (s: string) => (parseScpiBool(s) ? '20MHZ' : 'OFF'),
        format: (v: string) => (v === 'OFF' ? 'OFF' : '20M'),
      },

      probeAttenuation: {
        get: ':CHANnel{ch}:PROBe?',
        set: ':CHANnel{ch}:PROBe {value}',
        parse: parseScpiNumber,
      },

      inverted: {
        get: ':CHANnel{ch}:INVert?',
        set: ':CHANnel{ch}:INVert {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      label: {
        get: ':CHANnel{ch}:LABel?',
        set: ':CHANnel{ch}:LABel {value}',
        parse: (s: string) => s.trim().replace(/^"|"$/g, ''),
      },
    },
  },

  capabilities: ['fft', 'math-channels'],

  quirks: {
    postCommandDelay: 20,
    resetDelay: 2000,
  },
};

/**
 * Rigol DS1054Z oscilloscope driver.
 *
 * @example
 * ```typescript
 * import { rigolDS1054Z } from 'visa-ts/drivers/implementations/rigol/ds1054z';
 *
 * const scope = await rigolDS1054Z.connect(resource);
 * if (scope.ok) {
 *   await scope.value.setTimebase(1e-3);
 *   await scope.value.channel(1).setEnabled(true);
 *   await scope.value.run();
 * }
 * ```
 */
export const rigolDS1054Z = defineDriver(ds1054zSpec);
