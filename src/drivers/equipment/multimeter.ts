/**
 * Multimeter (DMM) interface and related types.
 *
 * Base interfaces define the minimum common denominator for all multimeters.
 * Device-specific drivers extend these interfaces to add additional features.
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
// Multimeter Interface (Base - Minimal)
// ─────────────────────────────────────────────────────────────────

/**
 * Base multimeter (DMM) instrument interface.
 *
 * Defines the minimum functionality all DMMs have:
 * - Function selection
 * - Range selection
 * - Take a measurement
 *
 * Device-specific drivers extend this to add triggering,
 * statistics, null offset, etc.
 *
 * @example
 * ```typescript
 * // Configure measurement
 * await dmm.setFunction('VDC');
 * await dmm.setRange('AUTO');
 *
 * // Take a measurement
 * const voltage = await dmm.measure();
 * ```
 */
export interface Multimeter extends BaseInstrument {
  /** Get measurement function */
  getFunction(): Promise<Result<DmmFunction, Error>>;

  /** Set measurement function */
  setFunction(func: DmmFunction): Promise<Result<void, Error>>;

  /** Get measurement range */
  getRange(): Promise<Result<number | 'AUTO', Error>>;

  /** Set measurement range */
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;

  /** Trigger a measurement and return result */
  measure(): Promise<Result<number, Error>>;
}
