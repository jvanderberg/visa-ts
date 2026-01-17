/**
 * Electronic Load equipment interface.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';

/**
 * Electronic load operating modes.
 *
 * Use the LoadMode constant for readable code:
 * @example
 * ```typescript
 * await ch.setMode(LoadMode.ConstantCurrent);
 * await ch.setMode(LoadMode.ConstantVoltage);
 * ```
 */
export const LoadMode = {
  /** Constant Current - load sinks a fixed current */
  ConstantCurrent: 'CC',
  /** Constant Voltage - load maintains a fixed voltage */
  ConstantVoltage: 'CV',
  /** Constant Resistance - load acts as a fixed resistance */
  ConstantResistance: 'CR',
  /** Constant Power - load sinks a fixed power */
  ConstantPower: 'CP',
} as const;

/** Electronic load operating mode type */
// eslint-disable-next-line no-redeclare
export type LoadMode = (typeof LoadMode)[keyof typeof LoadMode];

/**
 * List mode step definition.
 */
export interface ListStep {
  /** Value for this step (units depend on mode) */
  value: number;
  /** Duration in seconds */
  duration: number;
  /** Slew rate (optional, units depend on mode) */
  slew?: number;
}

/**
 * Electronic load channel interface.
 */
export interface ElectronicLoadChannel {
  readonly channelNumber: number;

  // Mode
  getMode(): Promise<Result<LoadMode, Error>>;
  setMode(mode: LoadMode): Promise<Result<void, Error>>;

  // Setpoints (mode-dependent)
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getResistance(): Promise<Result<number, Error>>;
  setResistance(ohms: number): Promise<Result<void, Error>>;
  getPower(): Promise<Result<number, Error>>;
  setPower(watts: number): Promise<Result<void, Error>>;

  // Input control (loads use "input" not "output")
  getInputEnabled(): Promise<Result<boolean, Error>>;
  setInputEnabled(enabled: boolean): Promise<Result<void, Error>>;

  // Measurements
  getMeasuredVoltage(): Promise<Result<number, Error>>;
  getMeasuredCurrent(): Promise<Result<number, Error>>;
  getMeasuredPower(): Promise<Result<number, Error>>;
  getMeasuredResistance(): Promise<Result<number, Error>>;
}

/**
 * List mode configuration options.
 */
export interface ListModeOptions {
  /** Trigger source (default: BUS) */
  triggerSource?: 'BUS' | 'MANUAL' | 'EXTERNAL';
}

/**
 * Electronic load instrument interface.
 */
export interface ElectronicLoad extends BaseInstrument {
  readonly channelCount: number;

  /** Access a specific channel */
  channel(n: number): ElectronicLoadChannel;

  // List mode (standard on all loads)
  /** Upload a list sequence. Returns true on success. */
  uploadList(mode: LoadMode, steps: ListStep[], repeat?: number): Promise<Result<boolean, Error>>;

  /** Start list execution. Returns true on success. */
  startList(options?: ListModeOptions): Promise<Result<boolean, Error>>;

  /** Stop list execution and return to fixed mode. Returns true on success. */
  stopList(options?: ListModeOptions): Promise<Result<boolean, Error>>;
}
