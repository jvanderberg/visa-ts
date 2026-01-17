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
import type {
  Oscilloscope,
  OscilloscopeChannel,
  BandwidthLimit,
  TriggerSlope,
  TriggerMode,
  TriggerSource,
  TimebaseMode,
  AcquisitionMode,
  Coupling,
} from '../../equipment/oscilloscope.js';
import type { OscFeatureId } from '../../features/index.js';

// ─────────────────────────────────────────────────────────────────
// DS1054Z type aliases for 4-channel scope
// ─────────────────────────────────────────────────────────────────

/**
 * DS1054Z oscilloscope interface.
 * Uses the base Oscilloscope interface - all standard functionality is covered.
 */
export interface DS1054ZScope extends Oscilloscope {
  /** Access a specific channel (1-4). */
  channel(n: 1 | 2 | 3 | 4): OscilloscopeChannel;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Parse trigger slope response.
 */
function parseTriggerSlope(s: string): TriggerSlope {
  const val = s.trim().toUpperCase();
  if (val === 'POSITIVE' || val === 'POS') return 'RISING';
  if (val === 'NEGATIVE' || val === 'NEG') return 'FALLING';
  if (val === 'RFAL' || val === 'EITHER') return 'EITHER';
  return 'RISING'; // Default
}

/**
 * Format trigger slope for command.
 */
function formatTriggerSlope(slope: TriggerSlope): string {
  if (slope === 'RISING') return 'POSitive';
  if (slope === 'FALLING') return 'NEGative';
  if (slope === 'EITHER') return 'RFALl';
  return slope;
}

/**
 * Parse trigger mode response.
 */
function parseTriggerMode(s: string): TriggerMode {
  const val = s.trim().toUpperCase();
  if (val === 'SING' || val === 'SINGLE') return 'SINGLE';
  if (val === 'NORM' || val === 'NORMAL') return 'NORMAL';
  if (val === 'AUTO') return 'AUTO';
  return 'AUTO'; // Default
}

/**
 * Parse timebase mode response.
 */
function parseTimebaseMode(s: string): TimebaseMode {
  const val = s.trim().toUpperCase();
  if (val === 'MAIN') return 'MAIN';
  if (val === 'WIND' || val === 'WINDOW') return 'WINDOW';
  if (val === 'XY') return 'XY';
  if (val === 'ROLL') return 'ROLL';
  return 'MAIN'; // Default
}

/**
 * Parse trigger source response.
 */
function parseTriggerSource(s: string): TriggerSource {
  const val = s.trim().toUpperCase();
  // Channel sources
  if (val === 'CHAN1' || val === 'CH1') return 'CH1';
  if (val === 'CHAN2' || val === 'CH2') return 'CH2';
  if (val === 'CHAN3' || val === 'CH3') return 'CH3';
  if (val === 'CHAN4' || val === 'CH4') return 'CH4';
  // External sources
  if (val === 'EXT' || val === 'EXTERNAL') return 'EXT';
  if (val === 'EXT5') return 'EXT5';
  if (val === 'LINE' || val === 'AC' || val === 'MAINS') return 'LINE';
  // Digital channels
  if (val.startsWith('D') && /^D\d+$/.test(val)) return val as TriggerSource;
  return 'CH1'; // Default
}

/**
 * Parse acquisition mode response.
 */
function parseAcquisitionMode(s: string): AcquisitionMode {
  const val = s.trim().toUpperCase();
  if (val === 'NORM' || val === 'NORMAL') return 'NORMAL';
  if (val === 'AVER' || val === 'AVERAGE') return 'AVERAGE';
  if (val === 'PEAK' || val === 'PDET' || val === 'PDETECT') return 'PEAK';
  if (val === 'HRES' || val === 'HIGHRES') return 'HIGHRES';
  return 'NORMAL'; // Default
}

/**
 * Parse coupling mode response.
 */
function parseCoupling(s: string): Coupling {
  const val = s.trim().toUpperCase();
  if (val === 'AC') return 'AC';
  if (val === 'DC') return 'DC';
  if (val === 'GND') return 'GND';
  return 'DC'; // Default
}

/**
 * Parse bandwidth limit response.
 */
function parseBandwidthLimit(s: string): BandwidthLimit {
  if (parseScpiBool(s)) return '20MHZ';
  return 'OFF';
}

/**
 * Format bandwidth limit for command.
 */
function formatBandwidthLimit(v: BandwidthLimit): string {
  return v === 'OFF' ? 'OFF' : '20M';
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * DS1054Z supported features.
 * This is an entry-level scope - no optional features implemented.
 * (Decode is available via license but not implemented in this driver.)
 */
const ds1054zFeatures = [] as const satisfies readonly OscFeatureId[];

/**
 * Rigol DS1000Z series driver specification.
 */
const ds1054zSpec: DriverSpec<DS1054ZScope, OscilloscopeChannel, typeof ds1054zFeatures> = {
  type: 'oscilloscope',
  manufacturer: 'Rigol',
  models: ['DS1054Z', 'DS1104Z-Plus', 'DS1074Z', 'DS1074Z-Plus'],
  features: ds1054zFeatures,

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
      parse: parseTimebaseMode,
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
    },

    triggerSource: {
      get: ':TRIGger:EDGe:SOURce?',
      set: ':TRIGger:EDGe:SOURce {value}',
      parse: parseTriggerSource,
    },

    // Acquisition
    acquisitionMode: {
      get: ':ACQuire:TYPE?',
      set: ':ACQuire:TYPE {value}',
      parse: parseAcquisitionMode,
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
        parse: parseCoupling,
      },

      bandwidthLimit: {
        get: ':CHANnel{ch}:BWLimit?',
        set: ':CHANnel{ch}:BWLimit {value}',
        parse: parseBandwidthLimit,
        format: formatBandwidthLimit,
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

      // ─────────────────────────────────────────────────────────────────
      // Measurements (base interface)
      // ─────────────────────────────────────────────────────────────────

      measuredFrequency: {
        get: ':MEASure:ITEM? FREQuency,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'Hz',
      },

      measuredPeriod: {
        get: ':MEASure:ITEM? PERiod,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredVpp: {
        get: ':MEASure:ITEM? VPP,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVmax: {
        get: ':MEASure:ITEM? VMAX,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVmin: {
        get: ':MEASure:ITEM? VMIN,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVavg: {
        get: ':MEASure:ITEM? VAVerage,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVrms: {
        get: ':MEASure:ITEM? VRMS,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      // ─────────────────────────────────────────────────────────────────
      // Additional voltage and pulse measurements
      // ─────────────────────────────────────────────────────────────────

      measuredVtop: {
        get: ':MEASure:ITEM? VTOP,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVbase: {
        get: ':MEASure:ITEM? VBASe,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVamp: {
        get: ':MEASure:ITEM? VAMPlitude,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredOvershoot: {
        get: ':MEASure:ITEM? OVERshoot,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: '%',
      },

      measuredPreshoot: {
        get: ':MEASure:ITEM? PREShoot,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: '%',
      },

      measuredRiseTime: {
        get: ':MEASure:ITEM? RTIMe,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredFallTime: {
        get: ':MEASure:ITEM? FTIMe,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredPositiveWidth: {
        get: ':MEASure:ITEM? PWIDth,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredNegativeWidth: {
        get: ':MEASure:ITEM? NWIDth,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredPositiveDuty: {
        get: ':MEASure:ITEM? PDUTy,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: '%',
      },

      measuredNegativeDuty: {
        get: ':MEASure:ITEM? NDUTy,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: '%',
      },

      measuredCounter: {
        get: ':MEASure:COUNter:VALue? CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
      },
    },
  },

  settings: {
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
