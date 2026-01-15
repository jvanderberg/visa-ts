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
 * Defines common measurements that most DMMs support.
 * Device-specific drivers extend this to add capabilities like
 * 4-wire resistance, capacitance, temperature, triggering, statistics, etc.
 *
 * @example
 * ```typescript
 * // DC measurements
 * const vdc = await dmm.getMeasuredVoltageDC();
 * const adc = await dmm.getMeasuredCurrentDC();
 *
 * // AC measurements
 * const vac = await dmm.getMeasuredVoltageAC();
 * const aac = await dmm.getMeasuredCurrentAC();
 *
 * // Other
 * const ohms = await dmm.getMeasuredResistance();
 * const hz = await dmm.getMeasuredFrequency();
 * ```
 */
export interface Multimeter extends BaseInstrument {
  // Voltage
  /** Measure DC voltage in V */
  getMeasuredVoltageDC(): Promise<Result<number, Error>>;
  /** Measure AC voltage in V */
  getMeasuredVoltageAC(): Promise<Result<number, Error>>;

  // Current
  /** Measure DC current in A */
  getMeasuredCurrentDC(): Promise<Result<number, Error>>;
  /** Measure AC current in A */
  getMeasuredCurrentAC(): Promise<Result<number, Error>>;

  // Resistance
  /** Measure resistance (2-wire) in Ω */
  getMeasuredResistance(): Promise<Result<number, Error>>;

  // Frequency
  /** Measure frequency in Hz */
  getMeasuredFrequency(): Promise<Result<number, Error>>;

  // Test modes
  /** Test continuity - returns resistance if continuous, high value if open */
  getMeasuredContinuity(): Promise<Result<number, Error>>;
  /** Test diode - returns forward voltage drop in V */
  getMeasuredDiode(): Promise<Result<number, Error>>;
}
