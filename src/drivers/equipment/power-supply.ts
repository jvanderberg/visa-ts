/**
 * Power Supply interface and related types.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';

// ─────────────────────────────────────────────────────────────────
// Power Supply Types
// ─────────────────────────────────────────────────────────────────

/**
 * Output regulation mode.
 *
 * - CV: Constant Voltage - output is voltage-regulated
 * - CC: Constant Current - output is current-limited
 * - UR: Unregulated - neither CV nor CC (transitional state)
 */
export type RegulationMode = 'CV' | 'CC' | 'UR';

/**
 * Channel tracking mode for multi-channel PSUs.
 *
 * - INDEPENDENT: Each channel operates independently
 * - SERIES: Channels combine in series (voltages add)
 * - PARALLEL: Channels combine in parallel (currents add)
 */
export type TrackingMode = 'INDEPENDENT' | 'SERIES' | 'PARALLEL';

/**
 * Channel combination mode (alias for TrackingMode).
 */
export type CombineMode = 'INDEPENDENT' | 'SERIES' | 'PARALLEL';

/**
 * Voltage range selection for auto-ranging PSUs.
 */
export type VoltageRange = 'HIGH' | 'LOW' | 'AUTO';

/**
 * Power supply-specific capabilities.
 */
export type PowerSupplyCapability =
  | 'tracking'
  | 'series-parallel'
  | 'sequencing'
  | 'ovp'
  | 'ocp'
  | 'opp'
  | 'otp'
  | 'remote-sense';

// ─────────────────────────────────────────────────────────────────
// Power Supply Channel
// ─────────────────────────────────────────────────────────────────

/**
 * Power supply channel interface.
 *
 * Each channel has independent output control, voltage/current settings,
 * measurements, and protection features.
 */
export interface PowerSupplyChannel {
  /** Channel number (1-based) */
  readonly channelNumber: number;

  // ─────────────────────────────────────────────────────────────────
  // Output Control
  // ─────────────────────────────────────────────────────────────────

  /** Get output enabled state */
  getOutputEnabled(): Promise<Result<boolean, Error>>;

  /** Set output enabled state */
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Voltage
  // ─────────────────────────────────────────────────────────────────

  /** Get voltage setpoint in V */
  getVoltage(): Promise<Result<number, Error>>;

  /** Set voltage setpoint in V */
  setVoltage(volts: number): Promise<Result<void, Error>>;

  /** Get voltage limit (max settable) in V */
  getVoltageLimit(): Promise<Result<number, Error>>;

  /** Set voltage limit in V */
  setVoltageLimit(volts: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Current
  // ─────────────────────────────────────────────────────────────────

  /** Get current limit (setpoint) in A */
  getCurrent(): Promise<Result<number, Error>>;

  /** Set current limit in A */
  setCurrent(amps: number): Promise<Result<void, Error>>;

  /** Get current limit (max settable) in A */
  getCurrentLimit(): Promise<Result<number, Error>>;

  /** Set current limit (max settable) in A */
  setCurrentLimit(amps: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Measurements
  // ─────────────────────────────────────────────────────────────────

  /** Measure actual output voltage in V */
  measureVoltage(): Promise<Result<number, Error>>;

  /** Measure actual output current in A */
  measureCurrent(): Promise<Result<number, Error>>;

  /** Measure actual output power in W (V * I) */
  measurePower(): Promise<Result<number, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────────────────────────

  /** Get current regulation mode (CV, CC, or UR) */
  getMode(): Promise<Result<RegulationMode, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Protection
  // ─────────────────────────────────────────────────────────────────

  /** Get OVP (over-voltage protection) enabled state */
  getOvpEnabled(): Promise<Result<boolean, Error>>;

  /** Set OVP enabled state */
  setOvpEnabled(on: boolean): Promise<Result<void, Error>>;

  /** Get OVP trip level in V */
  getOvpLevel(): Promise<Result<number, Error>>;

  /** Set OVP trip level in V */
  setOvpLevel(volts: number): Promise<Result<void, Error>>;

  /** Get OCP (over-current protection) enabled state */
  getOcpEnabled(): Promise<Result<boolean, Error>>;

  /** Set OCP enabled state */
  setOcpEnabled(on: boolean): Promise<Result<void, Error>>;

  /** Get OCP trip level in A */
  getOcpLevel(): Promise<Result<number, Error>>;

  /** Set OCP trip level in A */
  setOcpLevel(amps: number): Promise<Result<void, Error>>;

  /** Clear protection trip status */
  clearProtection(): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Power Supply Interface
// ─────────────────────────────────────────────────────────────────

/**
 * Power supply instrument interface.
 *
 * Provides typed access to power supply functionality including:
 * - Multi-channel output control
 * - Voltage and current settings
 * - Measurements
 * - Protection features
 *
 * Convenience methods (getVoltage, setVoltage, etc.) delegate to channel(1)
 * for easy use with single-channel supplies.
 *
 * @example
 * ```typescript
 * // Multi-channel usage
 * await psu.channel(1).setVoltage(3.3);
 * await psu.channel(1).setCurrent(0.5);
 * await psu.channel(2).setVoltage(5.0);
 * await psu.setAllOutputEnabled(true);
 *
 * // Measure
 * const v1 = await psu.channel(1).measureVoltage();
 * const i1 = await psu.channel(1).measureCurrent();
 *
 * // Single-channel convenience
 * await psu.setVoltage(12.0);  // Same as psu.channel(1).setVoltage(12.0)
 * ```
 */
export interface PowerSupply extends BaseInstrument {
  // ─────────────────────────────────────────────────────────────────
  // Channel System
  // ─────────────────────────────────────────────────────────────────

  /** Number of output channels */
  readonly channelCount: number;

  /** Access a specific channel (1-indexed) */
  channel(n: number): PowerSupplyChannel;

  // ─────────────────────────────────────────────────────────────────
  // Global Controls
  // ─────────────────────────────────────────────────────────────────

  /** Get global output enabled state (all channels) */
  getAllOutputEnabled(): Promise<Result<boolean, Error>>;

  /** Set global output enabled state (all channels) */
  setAllOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────────
  // Convenience Methods (delegate to channel 1)
  // ─────────────────────────────────────────────────────────────────

  /** Get voltage setpoint (channel 1) */
  getVoltage(): Promise<Result<number, Error>>;

  /** Set voltage setpoint (channel 1) */
  setVoltage(volts: number): Promise<Result<void, Error>>;

  /** Get current limit (channel 1) */
  getCurrent(): Promise<Result<number, Error>>;

  /** Set current limit (channel 1) */
  setCurrent(amps: number): Promise<Result<void, Error>>;

  /** Get output enabled state (channel 1) */
  getOutputEnabled(): Promise<Result<boolean, Error>>;

  /** Set output enabled state (channel 1) */
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  /** Measure actual voltage (channel 1) */
  measureVoltage(): Promise<Result<number, Error>>;

  /** Measure actual current (channel 1) */
  measureCurrent(): Promise<Result<number, Error>>;

  /** Measure actual power (channel 1) */
  measurePower(): Promise<Result<number, Error>>;
}
