/**
 * Electronic Load equipment interface.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';
import type { UnionToIntersection } from '../features/utils.js';
import type { LoadFeatureId, LoadChannelFeatureMethodMap } from '../features/load-features.js';

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

// ─────────────────────────────────────────────────────────────────
// Automatic Type Composition from Features
// ─────────────────────────────────────────────────────────────────

/**
 * Channel-level feature IDs (excludes instrument-level features like 'opp').
 */
type ChannelFeatureId = keyof LoadChannelFeatureMethodMap;

/**
 * Converts a tuple of load feature IDs to an intersection of their CHANNEL-level method interfaces.
 * Instrument-level features (like 'opp') are filtered out automatically.
 *
 * @typeParam F - A readonly array of feature IDs
 *
 * @example
 * ```typescript
 * type Methods = LoadMethodsFromFeatures<['short', 'led', 'opp']>;
 * // Methods = ShortMethods & LedMethods (opp is filtered out)
 * ```
 */
export type LoadMethodsFromFeatures<F extends readonly LoadFeatureId[]> = UnionToIntersection<
  LoadChannelFeatureMethodMap[Extract<F[number], ChannelFeatureId>]
>;

/**
 * Electronic load channel with feature methods automatically composed.
 *
 * Use this instead of declaring explicit interfaces. The channel type is
 * automatically computed from the features array.
 *
 * @typeParam F - A readonly tuple of feature IDs (use `as const`)
 *
 * @example
 * ```typescript
 * const features = ['short', 'led'] as const;
 *
 * // Automatically becomes: ElectronicLoadChannel & ShortMethods & LedMethods
 * type MyChannel = LoadChannelWithFeatures<typeof features>;
 * ```
 */
export type LoadChannelWithFeatures<F extends readonly LoadFeatureId[]> = ElectronicLoadChannel &
  LoadMethodsFromFeatures<F>;

/**
 * Electronic load with feature methods and typed channel accessor.
 *
 * Use this to get a fully typed load interface from a features array.
 *
 * @typeParam F - A readonly tuple of feature IDs (use `as const`)
 *
 * @example
 * ```typescript
 * const features = ['cp', 'short', 'led'] as const;
 *
 * // Load with typed channel accessor that includes feature methods
 * type MyLoad = LoadWithFeatures<typeof features>;
 * ```
 */
export type LoadWithFeatures<F extends readonly LoadFeatureId[]> = ElectronicLoad & {
  /** Access a channel with feature methods included */
  channel(n: number): LoadChannelWithFeatures<F>;
  /** Features supported by this driver */
  readonly features: F;
};
