/**
 * Oscilloscope interface and related types.
 *
 * Base interfaces define the minimum common denominator for all oscilloscopes.
 * Device-specific drivers extend these interfaces to add additional features.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';

// ─────────────────────────────────────────────────────────────────
// Oscilloscope Types
// ─────────────────────────────────────────────────────────────────

/** Timebase display mode */
export type TimebaseMode = 'MAIN' | 'WINDOW' | 'XY' | 'ROLL';

/** Trigger source selection */
export type TriggerSource =
  | 'CH1'
  | 'CH2'
  | 'CH3'
  | 'CH4'
  | 'EXT'
  | 'EXT5'
  | 'LINE'
  | 'D0'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D5'
  | 'D6'
  | 'D7'
  | 'D8'
  | 'D9'
  | 'D10'
  | 'D11'
  | 'D12'
  | 'D13'
  | 'D14'
  | 'D15';

/** Trigger edge slope */
export type TriggerSlope = 'RISING' | 'FALLING' | 'EITHER';

/** Trigger mode */
export type TriggerMode = 'AUTO' | 'NORMAL' | 'SINGLE';

/** Acquisition mode */
export type AcquisitionMode = 'NORMAL' | 'AVERAGE' | 'PEAK' | 'HIGHRES';

/** Channel coupling mode */
export type Coupling = 'AC' | 'DC' | 'GND';

/** Channel bandwidth limit setting */
export type BandwidthLimit = 'OFF' | '20MHZ' | '100MHZ' | '200MHZ';

/** Automatic measurement types */
export type MeasurementType =
  // Frequency/Timing
  | 'FREQUENCY'
  | 'PERIOD'
  | 'COUNTER'
  // Voltage
  | 'VMAX'
  | 'VMIN'
  | 'VPP'
  | 'VTOP'
  | 'VBASE'
  | 'VAMP'
  | 'VAVG'
  | 'VRMS'
  | 'VAVG_CYCLE'
  | 'VRMS_CYCLE'
  // Pulse
  | 'OVERSHOOT'
  | 'PRESHOOT'
  | 'RISE'
  | 'FALL'
  | 'PWIDTH'
  | 'NWIDTH'
  | 'DUTY_POS'
  | 'DUTY_NEG'
  // Phase/Delay
  | 'DELAY_RISE'
  | 'DELAY_FALL'
  | 'PHASE';

/** Protocol decode types */
export type Protocol = 'I2C' | 'SPI' | 'UART' | 'CAN' | 'LIN' | 'I2S' | 'FLEXRAY' | '1WIRE';

// ─────────────────────────────────────────────────────────────────
// Waveform Data
// ─────────────────────────────────────────────────────────────────

/**
 * Waveform data with scaling information.
 *
 * To convert raw points to physical values:
 * - time[i] = xOrigin + (i * xIncrement)
 * - voltage[i] = yOrigin + (points[i] * yIncrement)
 */
export interface WaveformData {
  /** Raw waveform points */
  points: Float64Array;

  /** Time between samples in seconds */
  xIncrement: number;

  /** Time of first sample in seconds */
  xOrigin: number;

  /** Voltage per point unit */
  yIncrement: number;

  /** Voltage offset */
  yOrigin: number;

  /** Time unit (always 's') */
  xUnit: 's';

  /** Voltage unit (always 'V') */
  yUnit: 'V';
}

// ─────────────────────────────────────────────────────────────────
// Oscilloscope Channel (Base - Minimal)
// ─────────────────────────────────────────────────────────────────

/**
 * Base oscilloscope channel interface.
 *
 * Defines the minimum functionality all scope channels have:
 * - Enable/disable display
 * - Vertical scale
 * - Vertical offset
 * - Input coupling
 * - Basic measurements
 *
 * Device-specific drivers extend this to add probe settings, bandwidth limit, etc.
 */
export interface OscilloscopeChannel {
  /** Channel number (1-based) */
  readonly channelNumber: number;

  /** Get channel display enabled state */
  getEnabled(): Promise<Result<boolean, Error>>;

  /** Set channel display enabled state */
  setEnabled(on: boolean): Promise<Result<void, Error>>;

  /** Get vertical scale in V/div */
  getScale(): Promise<Result<number, Error>>;

  /** Set vertical scale in V/div */
  setScale(voltsPerDiv: number): Promise<Result<void, Error>>;

  /** Get vertical offset in V */
  getOffset(): Promise<Result<number, Error>>;

  /** Set vertical offset in V */
  setOffset(volts: number): Promise<Result<void, Error>>;

  /** Get input coupling mode */
  getCoupling(): Promise<Result<Coupling, Error>>;

  /** Set input coupling mode */
  setCoupling(coupling: Coupling): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Measurements (common to all oscilloscopes)
  // ─────────────────────────────────────────────────────────────────

  /** Measure signal frequency in Hz */
  getMeasuredFrequency(): Promise<Result<number, Error>>;

  /** Measure signal period in seconds */
  getMeasuredPeriod(): Promise<Result<number, Error>>;

  /** Measure peak-to-peak voltage in V */
  getMeasuredVpp(): Promise<Result<number, Error>>;

  /** Measure maximum voltage in V */
  getMeasuredVmax(): Promise<Result<number, Error>>;

  /** Measure minimum voltage in V */
  getMeasuredVmin(): Promise<Result<number, Error>>;

  /** Measure average voltage in V */
  getMeasuredVavg(): Promise<Result<number, Error>>;

  /** Measure RMS voltage in V */
  getMeasuredVrms(): Promise<Result<number, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Oscilloscope Interface (Base - Minimal)
// ─────────────────────────────────────────────────────────────────

/**
 * Base oscilloscope instrument interface.
 *
 * Defines the minimum functionality all oscilloscopes have:
 * - Channel access
 * - Timebase control
 * - Run/stop
 *
 * Device-specific drivers extend this to add trigger settings,
 * waveform capture, measurements, etc.
 *
 * @example
 * ```typescript
 * // Configure scope
 * await scope.setTimebase(1e-3);  // 1ms/div
 * await scope.channel(1).setEnabled(true);
 * await scope.channel(1).setScale(1.0);  // 1V/div
 * await scope.run();
 * ```
 */
export interface Oscilloscope extends BaseInstrument {
  /** Number of analog channels */
  readonly channelCount: number;

  /** Access a specific analog channel (1-indexed). Throws if channel out of range. */
  channel(n: number): OscilloscopeChannel;

  /** Get horizontal scale in s/div */
  getTimebase(): Promise<Result<number, Error>>;

  /** Set horizontal scale in s/div */
  setTimebase(secPerDiv: number): Promise<Result<void, Error>>;

  /** Start acquisition (run) */
  run(): Promise<Result<void, Error>>;

  /** Stop acquisition */
  stop(): Promise<Result<void, Error>>;
}
