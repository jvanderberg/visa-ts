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
 *
 * Contains all standard functionality that every electronic load has:
 * - Mode selection (CC/CV/CR/CP)
 * - Setpoints for each mode
 * - Input enable/disable
 * - Measurements (V/I/P/R)
 * - Range selection
 * - Slew rate control
 * - Protection (OVP/OCP)
 * - Operating voltage window (Von/Voff)
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

  // Ranges (all loads have selectable ranges)
  getCurrentRange(): Promise<Result<number, Error>>;
  setCurrentRange(maxAmps: number): Promise<Result<void, Error>>;
  getVoltageRange(): Promise<Result<number, Error>>;
  setVoltageRange(maxVolts: number): Promise<Result<void, Error>>;

  // Slew rate (standard on all programmable loads, in A/s)
  getSlewRate(): Promise<Result<number, Error>>;
  setSlewRate(ampsPerSecond: number): Promise<Result<void, Error>>;

  // Over-voltage protection (OVP)
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getOvpTripped(): Promise<Result<boolean, Error>>;
  clearOvp(): Promise<Result<void, Error>>;

  // Over-current protection (OCP)
  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(amps: number): Promise<Result<void, Error>>;
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getOcpTripped(): Promise<Result<boolean, Error>>;
  clearOcp(): Promise<Result<void, Error>>;

  // Von/Voff operating voltage window thresholds
  getVonThreshold(): Promise<Result<number, Error>>;
  setVonThreshold(volts: number): Promise<Result<void, Error>>;
  getVoffThreshold(): Promise<Result<number, Error>>;
  setVoffThreshold(volts: number): Promise<Result<void, Error>>;
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
 *
 * Contains all standard functionality that every electronic load has:
 * - Channel access
 * - List mode (sequence programming)
 * - Global input control
 * - State save/recall
 * - Protection clear
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

  // Global input control (for multi-channel loads)
  /** Enable all channel inputs simultaneously */
  enableAllInputs(): Promise<Result<void, Error>>;

  /** Disable all channel inputs simultaneously */
  disableAllInputs(): Promise<Result<void, Error>>;

  // State save/recall (universal *SAV/*RCL)
  /** Save current state to memory slot (typically 1-10) */
  saveState(slot: number): Promise<Result<void, Error>>;

  /** Recall state from memory slot */
  recallState(slot: number): Promise<Result<void, Error>>;

  // Protection clear
  /** Clear all protection trips (OVP, OCP, OPP, etc.) on all channels */
  clearAllProtection(): Promise<Result<void, Error>>;
}
