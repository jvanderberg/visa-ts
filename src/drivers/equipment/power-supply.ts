/**
 * Power Supply interface and related types.
 *
 * Base interfaces define the minimum common denominator for all power supplies.
 * Device-specific drivers extend these interfaces to add additional features.
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
// Power Supply Channel (Base - Minimal)
// ─────────────────────────────────────────────────────────────────

/**
 * Base power supply channel interface.
 *
 * Defines the minimum functionality all PSU channels have:
 * - Output enable/disable
 * - Voltage setpoint
 * - Current limit
 *
 * Device-specific drivers extend this to add measurements, protection, etc.
 */
export interface PowerSupplyChannel {
  /** Channel number (1-based) */
  readonly channelNumber: number;

  /** Get output enabled state */
  getOutputEnabled(): Promise<Result<boolean, Error>>;

  /** Set output enabled state */
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  /** Get voltage setpoint in V */
  getVoltage(): Promise<Result<number, Error>>;

  /** Set voltage setpoint in V */
  setVoltage(volts: number): Promise<Result<void, Error>>;

  /** Get current limit in A */
  getCurrent(): Promise<Result<number, Error>>;

  /** Set current limit in A */
  setCurrent(amps: number): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Power Supply Interface (Base - Minimal)
// ─────────────────────────────────────────────────────────────────

/**
 * Base power supply instrument interface.
 *
 * Defines the minimum functionality all power supplies have:
 * - Channel access
 * - Channel count
 *
 * Device-specific drivers extend this to add global controls,
 * convenience methods, etc.
 *
 * @example
 * ```typescript
 * // Multi-channel usage
 * await psu.channel(1).setVoltage(3.3);
 * await psu.channel(1).setCurrent(0.5);
 * await psu.channel(1).setOutputEnabled(true);
 * ```
 */
export interface PowerSupply extends BaseInstrument {
  /** Number of output channels */
  readonly channelCount: number;

  /** Access a specific channel (1-indexed) */
  channel(n: number): PowerSupplyChannel;
}
