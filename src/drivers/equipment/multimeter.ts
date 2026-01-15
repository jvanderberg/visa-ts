/**
 * Multimeter (DMM) interface and related types.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';

// ─────────────────────────────────────────────────────────────────
// Multimeter Types
// ─────────────────────────────────────────────────────────────────

/**
 * DMM measurement function.
 */
export type DmmFunction =
  // Voltage
  | 'VDC'
  | 'VAC'
  | 'VDC_AC'
  // Current
  | 'ADC'
  | 'AAC'
  | 'ADC_AC'
  // Resistance
  | 'RESISTANCE_2W'
  | 'RESISTANCE_4W'
  // Frequency/Period
  | 'FREQUENCY'
  | 'PERIOD'
  // Capacitance
  | 'CAPACITANCE'
  // Temperature
  | 'TEMPERATURE_RTD'
  | 'TEMPERATURE_TC'
  // Test modes
  | 'CONTINUITY'
  | 'DIODE';

/**
 * AC measurement bandwidth filter setting.
 *
 * Controls the low-frequency cutoff for AC measurements:
 * - SLOW: ~3 Hz (most accurate for low frequencies)
 * - MEDIUM: ~20 Hz (balanced)
 * - FAST: ~200 Hz (fastest response)
 */
export type AcBandwidth = 'SLOW' | 'MEDIUM' | 'FAST';

/**
 * Trigger source for measurements.
 */
export type DmmTriggerSource = 'IMMEDIATE' | 'EXTERNAL' | 'BUS' | 'INTERNAL';

/**
 * Measurement statistics from accumulated readings.
 */
export interface DmmStatistics {
  /** Minimum value */
  min: number;

  /** Maximum value */
  max: number;

  /** Average (mean) value */
  average: number;

  /** Standard deviation */
  stdDev: number;

  /** Number of samples */
  count: number;
}

// ─────────────────────────────────────────────────────────────────
// Multimeter Display
// ─────────────────────────────────────────────────────────────────

/**
 * Multimeter display interface.
 *
 * Some DMMs have dual displays that can show different measurements
 * simultaneously. Each display has independent function/range settings.
 */
export interface MultimeterDisplay {
  /** Display number (1 = primary, 2 = secondary) */
  readonly displayNumber: number;

  // ─────────────────────────────────────────────────────────────────
  // Function Selection
  // ─────────────────────────────────────────────────────────────────

  /** Get measurement function */
  getFunction(): Promise<Result<DmmFunction, Error>>;

  /** Set measurement function */
  setFunction(func: DmmFunction): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Range
  // ─────────────────────────────────────────────────────────────────

  /** Get measurement range (or 'AUTO') */
  getRange(): Promise<Result<number | 'AUTO', Error>>;

  /** Set measurement range (or 'AUTO') */
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;

  /** Get auto-range enabled state */
  getAutoRangeEnabled(): Promise<Result<boolean, Error>>;

  /** Set auto-range enabled state */
  setAutoRangeEnabled(on: boolean): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Measurement
  // ─────────────────────────────────────────────────────────────────

  /** Trigger a new measurement and return the result */
  measure(): Promise<Result<number, Error>>;

  /** Fetch the last measurement result (no new trigger) */
  fetch(): Promise<Result<number, Error>>;

  /** Read the current measurement value */
  read(): Promise<Result<number, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Resolution/Speed
  // ─────────────────────────────────────────────────────────────────

  /** Get integration time in power line cycles (0.001-100) */
  getNplc(): Promise<Result<number, Error>>;

  /** Set integration time in power line cycles */
  setNplc(nplc: number): Promise<Result<void, Error>>;

  /** Get aperture (integration time) in seconds */
  getAperture(): Promise<Result<number, Error>>;

  /** Set aperture in seconds */
  setAperture(seconds: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // AC Specific
  // ─────────────────────────────────────────────────────────────────

  /** Get AC bandwidth filter setting */
  getAcBandwidth(): Promise<Result<AcBandwidth, Error>>;

  /** Set AC bandwidth filter setting */
  setAcBandwidth(bw: AcBandwidth): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Null/Relative
  // ─────────────────────────────────────────────────────────────────

  /** Get null (relative) offset enabled state */
  getNullEnabled(): Promise<Result<boolean, Error>>;

  /** Set null offset enabled state */
  setNullEnabled(on: boolean): Promise<Result<void, Error>>;

  /** Get null offset value */
  getNullValue(): Promise<Result<number, Error>>;

  /** Set null offset value */
  setNullValue(value: number): Promise<Result<void, Error>>;

  /** Acquire null offset from current reading */
  acquireNull(): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Multimeter Interface
// ─────────────────────────────────────────────────────────────────

/**
 * Multimeter (DMM) instrument interface.
 *
 * Provides typed access to digital multimeter functionality including:
 * - Function and range selection
 * - Measurements (single, continuous, triggered)
 * - Statistics
 * - Null/relative offset
 *
 * For dual-display DMMs, access individual displays via display(n).
 * Convenience methods operate on the primary display.
 *
 * @example
 * ```typescript
 * // Configure measurement
 * await dmm.setFunction('VDC');
 * await dmm.setRange('AUTO');
 *
 * // Take a measurement
 * const voltage = await dmm.measure();
 *
 * // Get statistics after multiple measurements
 * const stats = await dmm.getStatistics();
 * ```
 */
export interface Multimeter extends BaseInstrument {
  // ─────────────────────────────────────────────────────────────────
  // Display System
  // ─────────────────────────────────────────────────────────────────

  /** Number of displays (1 or 2 for dual-display DMMs) */
  readonly displayCount: number;

  /** Access a specific display (1 = primary, 2 = secondary) */
  display(n: number): MultimeterDisplay;

  // ─────────────────────────────────────────────────────────────────
  // Convenience Methods (primary display)
  // ─────────────────────────────────────────────────────────────────

  /** Get measurement function (primary display) */
  getFunction(): Promise<Result<DmmFunction, Error>>;

  /** Set measurement function (primary display) */
  setFunction(func: DmmFunction): Promise<Result<void, Error>>;

  /** Get measurement range (primary display) */
  getRange(): Promise<Result<number | 'AUTO', Error>>;

  /** Set measurement range (primary display) */
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;

  /** Trigger a measurement and return result (primary display) */
  measure(): Promise<Result<number, Error>>;

  /** Fetch last measurement result (primary display) */
  fetch(): Promise<Result<number, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Triggering
  // ─────────────────────────────────────────────────────────────────

  /** Get trigger source */
  getTriggerSource(): Promise<Result<DmmTriggerSource | string, Error>>;

  /** Set trigger source */
  setTriggerSource(source: DmmTriggerSource): Promise<Result<void, Error>>;

  /** Get trigger delay in seconds (or 'AUTO') */
  getTriggerDelay(): Promise<Result<number | 'AUTO', Error>>;

  /** Set trigger delay in seconds (or 'AUTO') */
  setTriggerDelay(seconds: number | 'AUTO'): Promise<Result<void, Error>>;

  /** Initiate a measurement (arm trigger) */
  initiate(): Promise<Result<void, Error>>;

  /** Abort current measurement */
  abort(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────

  /** Get accumulated measurement statistics */
  getStatistics(): Promise<Result<DmmStatistics, Error>>;

  /** Clear accumulated statistics */
  clearStatistics(): Promise<Result<void, Error>>;
}
