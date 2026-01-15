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
import { Ok, Err } from '../../../result.js';
import type {
  Oscilloscope,
  OscilloscopeChannel,
  Coupling,
  TriggerSlope,
  TriggerMode,
  WaveformData,
} from '../../equipment/oscilloscope.js';
import { parseDefiniteLengthBlock } from '../../../util/scpi-parser.js';

// ─────────────────────────────────────────────────────────────────
// Rigol Scope-specific interfaces
// ─────────────────────────────────────────────────────────────────

/**
 * Rigol oscilloscope channel with extended features.
 */
export interface RigolScopeChannel extends OscilloscopeChannel {
  /** Get probe attenuation ratio */
  getProbeAttenuation(): Promise<Result<number, Error>>;

  /** Set probe attenuation ratio */
  setProbeAttenuation(ratio: number): Promise<Result<void, Error>>;

  /** Get bandwidth limit enabled state */
  getBandwidthLimit(): Promise<Result<boolean, Error>>;

  /** Set bandwidth limit enabled state */
  setBandwidthLimit(enabled: boolean): Promise<Result<void, Error>>;
}

/**
 * Rigol oscilloscope interface with waveform capture.
 */
export interface RigolScope extends Oscilloscope {
  /** Access a specific channel (1-4 for most models) */
  channel(n: 1 | 2 | 3 | 4): RigolScopeChannel;

  // Timebase extended
  getTimebaseOffset(): Promise<Result<number, Error>>;
  setTimebaseOffset(seconds: number): Promise<Result<void, Error>>;
  getSampleRate(): Promise<Result<number, Error>>;
  getMemoryDepth(): Promise<Result<number, Error>>;

  // Trigger settings
  getTriggerSource(): Promise<Result<string, Error>>;
  setTriggerSource(source: string): Promise<Result<void, Error>>;
  getTriggerLevel(): Promise<Result<number, Error>>;
  setTriggerLevel(volts: number): Promise<Result<void, Error>>;
  getTriggerSlope(): Promise<Result<TriggerSlope, Error>>;
  setTriggerSlope(slope: TriggerSlope): Promise<Result<void, Error>>;
  getTriggerMode(): Promise<Result<TriggerMode, Error>>;
  setTriggerMode(mode: TriggerMode): Promise<Result<void, Error>>;

  // Acquisition state
  getRunning(): Promise<Result<boolean, Error>>;

  // Commands
  single(): Promise<Result<void, Error>>;
  autoScale(): Promise<Result<void, Error>>;
  forceTrigger(): Promise<Result<void, Error>>;

  // Waveform capture (custom methods - named to avoid property extraction)
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
 * Format trigger mode for SCPI command.
 */
function formatTriggerMode(mode: TriggerMode): string {
  if (mode === 'NORMAL') return 'NORM';
  if (mode === 'SINGLE') return 'SING';
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

  // Get waveform data (BYTE format with TMC block header)
  const rawDataResult = await ctx.resource.queryBinary(':WAV:DATA?');
  if (!rawDataResult.ok) return rawDataResult;

  // Parse definite-length block format (#NDDDD...data)
  const blockResult = parseDefiniteLengthBlock(rawDataResult.value);
  if (!blockResult.ok) {
    return Err(blockResult.error);
  }
  // Extract data portion of the buffer using header info
  const waveformBytes = rawDataResult.value.subarray(
    blockResult.value.header,
    blockResult.value.header + blockResult.value.length
  );

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
  const rawDataResult = await ctx.resource.queryBinary(':DISP:DATA? ON,OFF,PNG');
  if (!rawDataResult.ok) return rawDataResult;

  // Try to parse as definite-length block, otherwise return raw
  const blockResult = parseDefiniteLengthBlock(rawDataResult.value);
  if (blockResult.ok) {
    // Extract data portion of the buffer using header info
    const data = rawDataResult.value.subarray(
      blockResult.value.header,
      blockResult.value.header + blockResult.value.length
    );
    return Ok(data);
  }

  // Not block format, return raw
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

    sampleRate: {
      get: ':ACQ:SRAT?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'Sa/s',
    },

    memoryDepth: {
      get: ':ACQ:MDEP?',
      parse: parseScpiNumber,
      readonly: true,
      unit: 'pts',
    },

    triggerSource: {
      get: ':TRIG:EDG:SOUR?',
      set: ':TRIG:EDG:SOUR {value}',
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
      format: formatTriggerMode,
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
        parse: parseScpiBool,
        format: formatScpiBool,
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
