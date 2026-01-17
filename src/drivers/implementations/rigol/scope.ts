/**
 * Rigol Generic Oscilloscope Driver.
 *
 * Supports DS1000Z, DS2000, and MSO5000 series oscilloscopes.
 * Provides common oscilloscope functionality with waveform capture.
 *
 * For DS1054Z-specific features, use the dedicated ds1054z driver.
 *
 * @packageDocumentation
 */

import { defineDriver } from '../../define-driver.js';
import { parseScpiNumber, parseScpiBool, formatScpiBool } from '../../parsers.js';
import type { DriverSpec, DriverContext } from '../../types.js';
import type { Result } from '../../../result.js';
import { Ok } from '../../../result.js';
import type {
  Oscilloscope,
  OscilloscopeChannel,
  BandwidthLimit,
  Coupling,
  TriggerSlope,
  TriggerMode,
  TriggerSource,
  TimebaseMode,
  AcquisitionMode,
  WaveformData,
} from '../../equipment/oscilloscope.js';

// ─────────────────────────────────────────────────────────────────
// Rigol Scope-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * Rigol oscilloscope channel - extends base with phase measurement.
 */
export interface RigolScopeChannel extends OscilloscopeChannel {
  /** Get phase measurement (not supported on all models, may timeout) */
  getMeasuredPhase(): Promise<Result<number, Error>>;
}

/**
 * Rigol oscilloscope interface with waveform capture.
 */
export interface RigolScope extends Oscilloscope {
  /** Access a specific channel (1-4 for most models) */
  channel(n: 1 | 2 | 3 | 4): RigolScopeChannel;

  // ─────────────────────────────────────────────────────────────────
  // Rigol-specific methods (waveform capture)
  // ─────────────────────────────────────────────────────────────────

  /** Capture waveform data from a channel */
  captureWaveform(channel: string): Promise<Result<WaveformData, Error>>;

  /** Capture screenshot as PNG image */
  captureScreenshot(): Promise<Result<Buffer, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Parse trigger slope from SCPI response.
 */
function parseTriggerSlope(s: string): TriggerSlope {
  const upper = s.trim().toUpperCase();
  if (upper === 'NEG' || upper === 'NEGATIVE' || upper === 'FALL') return 'FALLING';
  if (upper === 'RFAL' || upper === 'EITHER') return 'EITHER';
  return 'RISING'; // Default, matches POS/POSITIVE/RISE
}

/**
 * Format trigger slope for SCPI command.
 */
function formatTriggerSlope(slope: TriggerSlope): string {
  if (slope === 'FALLING') return 'NEG';
  if (slope === 'EITHER') return 'RFAL';
  return 'POS';
}

/**
 * Parse trigger mode from SCPI response.
 */
function parseTriggerMode(s: string): TriggerMode {
  const upper = s.trim().toUpperCase();
  if (upper === 'NORM' || upper === 'NORMAL') return 'NORMAL';
  if (upper === 'SING' || upper === 'SINGLE') return 'SINGLE';
  return 'AUTO';
}

/**
 * Parse running state from trigger status.
 */
function parseRunning(s: string): boolean {
  const upper = s.trim().toUpperCase();
  return upper !== 'STOP' && upper !== 'STOPPED';
}

/**
 * Parse coupling mode.
 */
function parseCoupling(s: string): Coupling {
  const upper = s.trim().toUpperCase();
  if (upper === 'AC') return 'AC';
  if (upper === 'GND') return 'GND';
  return 'DC';
}

/**
 * Parse bandwidth limit from SCPI response.
 * Rigol returns ON/OFF or 20M etc.
 */
function parseBandwidthLimit(s: string): BandwidthLimit {
  const upper = s.trim().toUpperCase();
  if (upper === 'OFF' || upper === '0') return 'OFF';
  if (upper === '20M' || upper === '20MHZ' || upper === 'ON' || upper === '1') return '20MHZ';
  if (upper === '100M' || upper === '100MHZ') return '100MHZ';
  if (upper === '200M' || upper === '200MHZ') return '200MHZ';
  return 'OFF';
}

/**
 * Format bandwidth limit for SCPI command.
 */
function formatBandwidthLimit(v: BandwidthLimit): string {
  if (v === 'OFF') return 'OFF';
  if (v === '20MHZ') return '20M';
  if (v === '100MHZ') return '100M';
  if (v === '200MHZ') return '200M';
  return 'OFF';
}

/**
 * Parse trigger source from SCPI response.
 */
function parseTriggerSource(s: string): TriggerSource {
  const upper = s.trim().toUpperCase();
  if (upper === 'CHAN1' || upper === 'CH1') return 'CH1';
  if (upper === 'CHAN2' || upper === 'CH2') return 'CH2';
  if (upper === 'CHAN3' || upper === 'CH3') return 'CH3';
  if (upper === 'CHAN4' || upper === 'CH4') return 'CH4';
  if (upper === 'EXT' || upper === 'EXTERNAL') return 'EXT';
  if (upper === 'EXT5') return 'EXT5';
  if (upper === 'LINE' || upper === 'AC' || upper === 'MAINS') return 'LINE';
  if (upper.startsWith('D') && /^D\d+$/.test(upper)) return upper as TriggerSource;
  return 'CH1';
}

/**
 * Parse timebase mode from SCPI response.
 */
function parseTimebaseMode(s: string): TimebaseMode {
  const upper = s.trim().toUpperCase();
  if (upper === 'MAIN') return 'MAIN';
  if (upper === 'WIND' || upper === 'WINDOW') return 'WINDOW';
  if (upper === 'XY') return 'XY';
  if (upper === 'ROLL') return 'ROLL';
  return 'MAIN';
}

/**
 * Parse acquisition mode from SCPI response.
 */
function parseAcquisitionMode(s: string): AcquisitionMode {
  const upper = s.trim().toUpperCase();
  if (upper === 'NORM' || upper === 'NORMAL') return 'NORMAL';
  if (upper === 'AVER' || upper === 'AVERAGE') return 'AVERAGE';
  if (upper === 'PEAK' || upper === 'PDET' || upper === 'PDETECT') return 'PEAK';
  if (upper === 'HRES' || upper === 'HIGHRES') return 'HIGHRES';
  return 'NORMAL';
}

/**
 * Parse a ratio value and convert to percentage.
 * Rigol returns duty cycle, overshoot, etc. as ratios (0.5 = 50%).
 */
function parsePercentage(s: string): number {
  const num = parseFloat(s.trim());
  if (!Number.isFinite(num)) return NaN;
  return num * 100;
}

// ─────────────────────────────────────────────────────────────────
// Waveform capture implementation
// ─────────────────────────────────────────────────────────────────

/**
 * Capture waveform data from a channel.
 */
async function captureWaveform(
  ctx: DriverContext,
  channel: string
): Promise<Result<WaveformData, Error>> {
  // Set waveform source
  let result = await ctx.write(`:WAV:SOUR ${channel}`);
  if (!result.ok) return result;

  // Set mode to NORM (screen data)
  result = await ctx.write(':WAV:MODE NORM');
  if (!result.ok) return result;

  // Set format to BYTE (binary, more efficient)
  result = await ctx.write(':WAV:FORM BYTE');
  if (!result.ok) return result;

  // Get preamble for scaling
  const preambleResult = await ctx.query(':WAV:PRE?');
  if (!preambleResult.ok) return preambleResult;
  const preambleParts = preambleResult.value.split(',').map((s) => parseFloat(s.trim()));
  const xIncrement = preambleParts[4] ?? 1e-6;
  const xOrigin = preambleParts[5] ?? 0;

  // Query yIncrement, yOrigin, yReference separately (DS1000Z format)
  const yIncResult = await ctx.query(':WAV:YINC?');
  if (!yIncResult.ok) return yIncResult;
  const yIncrement = parseScpiNumber(yIncResult.value);

  const yOrResult = await ctx.query(':WAV:YOR?');
  if (!yOrResult.ok) return yOrResult;
  const yOrigin = parseScpiNumber(yOrResult.value);

  const yRefResult = await ctx.query(':WAV:YREF?');
  if (!yRefResult.ok) return yRefResult;
  const yReference = parseScpiNumber(yRefResult.value);

  // Get waveform data (BYTE format)
  // queryBinary handles IEEE 488.2 block format and returns just the data
  const rawDataResult = await ctx.resource.queryBinary(':WAV:DATA?');
  if (!rawDataResult.ok) return rawDataResult;

  const waveformBytes = rawDataResult.value;

  // Convert bytes to voltage values
  // Formula: voltage = (rawValue - yOrigin - yReference) * yIncrement
  const points = new Float64Array(waveformBytes.length);
  for (let i = 0; i < waveformBytes.length; i++) {
    const rawValue = waveformBytes[i] ?? 0;
    points[i] = (rawValue - yOrigin - yReference) * yIncrement;
  }

  return Ok({
    points,
    xIncrement,
    xOrigin,
    yIncrement,
    yOrigin: yOrigin + yReference * yIncrement,
    xUnit: 's' as const,
    yUnit: 'V' as const,
  });
}

/**
 * Capture screenshot from oscilloscope.
 */
async function captureScreenshot(ctx: DriverContext): Promise<Result<Buffer, Error>> {
  // Screenshot capture can take several seconds on Rigol scopes
  // queryBinary handles IEEE 488.2 block format and returns just the data
  const rawDataResult = await ctx.resource.queryBinary(':DISP:DATA? ON,OFF,PNG');
  if (!rawDataResult.ok) return rawDataResult;

  return Ok(rawDataResult.value);
}

// ─────────────────────────────────────────────────────────────────
// Driver specification
// ─────────────────────────────────────────────────────────────────

/**
 * Rigol generic oscilloscope driver specification.
 */
const rigolScopeSpec: DriverSpec<RigolScope, RigolScopeChannel> = {
  type: 'oscilloscope',
  manufacturer: 'Rigol',
  models: [
    // DS1000Z series
    'DS1054Z',
    'DS1074Z',
    'DS1074Z-S',
    'DS1104Z',
    'DS1104Z-S',
    'DS1104Z-Plus',
    'DS1202Z-E',
    // DS2000 series
    'DS2072A',
    'DS2102A',
    'DS2202A',
    'DS2302A',
    // MSO5000 series
    'MSO5072',
    'MSO5074',
    'MSO5102',
    'MSO5104',
    'MSO5204',
    'MSO5354',
  ],

  properties: {
    // Timebase settings
    timebase: {
      get: ':TIM:SCAL?',
      set: ':TIM:SCAL {value}',
      parse: parseScpiNumber,
      unit: 's/div',
    },

    timebaseOffset: {
      get: ':TIM:OFFS?',
      set: ':TIM:OFFS {value}',
      parse: parseScpiNumber,
      unit: 's',
    },

    timebaseMode: {
      get: ':TIM:MODE?',
      set: ':TIM:MODE {value}',
      parse: parseTimebaseMode,
    },

    sampleRate: {
      get: ':ACQ:SRAT?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Sa/s',
    },

    recordLength: {
      get: ':ACQ:MDEP?',
      set: ':ACQ:MDEP {value}',
      parse: (s: string) => {
        const val = s.trim().toUpperCase();
        if (val === 'AUTO') return 0;
        return parseScpiNumber(val);
      },
      unit: 'pts',
    },

    // Trigger settings
    triggerSource: {
      get: ':TRIG:EDG:SOUR?',
      set: ':TRIG:EDG:SOUR {value}',
      parse: parseTriggerSource,
    },

    triggerLevel: {
      get: ':TRIG:EDG:LEV?',
      set: ':TRIG:EDG:LEV {value}',
      parse: parseScpiNumber,
      unit: 'V',
    },

    triggerSlope: {
      get: ':TRIG:EDG:SLOP?',
      set: ':TRIG:EDG:SLOP {value}',
      parse: parseTriggerSlope,
      format: formatTriggerSlope,
    },

    triggerMode: {
      get: ':TRIG:SWE?',
      set: ':TRIG:SWE {value}',
      parse: parseTriggerMode,
    },

    // Acquisition control
    acquisitionMode: {
      get: ':ACQ:TYPE?',
      set: ':ACQ:TYPE {value}',
      parse: parseAcquisitionMode,
    },

    running: {
      get: ':TRIG:STAT?',
      parse: parseRunning,
      readonly: true,
    },
  },

  commands: {
    run: { command: ':RUN' },
    stop: { command: ':STOP' },
    single: { command: ':SING' },
    autoScale: { command: ':AUT', delay: 3000 },
    forceTrigger: { command: ':TFOR' },
  },

  // Custom method implementations for waveform/screenshot
  methods: {
    captureWaveform: (ctx, channel: string) => captureWaveform(ctx, channel),
    captureScreenshot: (ctx) => captureScreenshot(ctx),
  },

  channels: {
    count: 4,
    indexStart: 1,
    properties: {
      enabled: {
        get: ':CHAN{ch}:DISP?',
        set: ':CHAN{ch}:DISP {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      scale: {
        get: ':CHAN{ch}:SCAL?',
        set: ':CHAN{ch}:SCAL {value}',
        parse: parseScpiNumber,
        unit: 'V/div',
      },

      offset: {
        get: ':CHAN{ch}:OFFS?',
        set: ':CHAN{ch}:OFFS {value}',
        parse: parseScpiNumber,
        unit: 'V',
      },

      coupling: {
        get: ':CHAN{ch}:COUP?',
        set: ':CHAN{ch}:COUP {value}',
        parse: parseCoupling,
      },

      probeAttenuation: {
        get: ':CHAN{ch}:PROB?',
        set: ':CHAN{ch}:PROB {value}',
        parse: parseScpiNumber,
      },

      bandwidthLimit: {
        get: ':CHAN{ch}:BWL?',
        set: ':CHAN{ch}:BWL {value}',
        parse: parseBandwidthLimit,
        format: formatBandwidthLimit,
      },

      inverted: {
        get: ':CHAN{ch}:INV?',
        set: ':CHAN{ch}:INV {value}',
        parse: parseScpiBool,
        format: formatScpiBool,
      },

      label: {
        get: ':CHAN{ch}:LAB?',
        set: ':CHAN{ch}:LAB {value}',
        parse: (s: string) => s.trim().replace(/^"|"$/g, ''),
      },

      // Measurements
      measuredFrequency: {
        get: ':MEAS:ITEM? FREQ,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'Hz',
      },

      measuredPeriod: {
        get: ':MEAS:ITEM? PER,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredVpp: {
        get: ':MEAS:ITEM? VPP,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVmax: {
        get: ':MEAS:ITEM? VMAX,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVmin: {
        get: ':MEAS:ITEM? VMIN,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVavg: {
        get: ':MEAS:ITEM? VAVG,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVrms: {
        get: ':MEAS:ITEM? VRMS,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      // Extended measurements
      measuredVtop: {
        get: ':MEAS:ITEM? VTOP,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVbase: {
        get: ':MEAS:ITEM? VBAS,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredVamp: {
        get: ':MEAS:ITEM? VAMP,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 'V',
      },

      measuredOvershoot: {
        get: ':MEAS:ITEM? OVER,CHAN{ch}',
        parse: parsePercentage,
        readonly: true,
        unit: '%',
      },

      measuredPreshoot: {
        get: ':MEAS:ITEM? PRES,CHAN{ch}',
        parse: parsePercentage,
        readonly: true,
        unit: '%',
      },

      measuredRiseTime: {
        get: ':MEAS:ITEM? RTIM,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredFallTime: {
        get: ':MEAS:ITEM? FTIM,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredPositiveWidth: {
        get: ':MEAS:ITEM? PWID,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredNegativeWidth: {
        get: ':MEAS:ITEM? NWID,CHAN{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: 's',
      },

      measuredPositiveDuty: {
        get: ':MEAS:ITEM? PDUT,CHAN{ch}',
        parse: parsePercentage,
        readonly: true,
        unit: '%',
      },

      measuredNegativeDuty: {
        get: ':MEAS:ITEM? NDUT,CHAN{ch}',
        parse: parsePercentage,
        readonly: true,
        unit: '%',
      },

      // Model-dependent measurements (may timeout on DS1202Z-E and others)
      measuredPhase: {
        get: ':MEASure:ITEM? RPHase,CHANnel{ch}',
        parse: parseScpiNumber,
        readonly: true,
        unit: '°',
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
 * Rigol generic oscilloscope driver.
 *
 * Works with DS1000Z, DS2000, and MSO5000 series oscilloscopes.
 * Provides common oscilloscope functionality with waveform capture.
 *
 * @example
 * ```typescript
 * import { rigolScope } from 'visa-ts/drivers/implementations/rigol/scope';
 *
 * const scope = await rigolScope.connect(resource);
 * if (scope.ok) {
 *   // Configure
 *   await scope.value.setTimebase(1e-3);  // 1ms/div
 *   await scope.value.channel(1).setScale(1.0);  // 1V/div
 *   await scope.value.run();
 *
 *   // Capture waveform
 *   const waveform = await scope.value.captureWaveform('CHAN1');
 *   if (waveform.ok) {
 *     console.log(`Captured ${waveform.value.points.length} points`);
 *   }
 *
 *   // Take screenshot
 *   const screenshot = await scope.value.captureScreenshot();
 *   if (screenshot.ok) {
 *     await fs.writeFile('screenshot.png', screenshot.value);
 *   }
 * }
 * ```
 */
export const rigolScope = defineDriver(rigolScopeSpec);
