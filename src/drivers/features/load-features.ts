/**
 * Electronic Load feature brands and types for granular type safety.
 *
 * Features are optional capabilities that vary between load models.
 * Base capabilities (CC, CV, CR, dynamic, slew, list, OCP, OVP, Von/Voff)
 * are on all loads and defined in the base interface.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';

// ─────────────────────────────────────────────────────────────────
// Feature Brand Tags (unique symbols for nominal typing)
// ─────────────────────────────────────────────────────────────────

declare const CpTag: unique symbol;
declare const BatteryTag: unique symbol;
declare const LedTag: unique symbol;
declare const ShortTag: unique symbol;
declare const OppTag: unique symbol;
declare const OcpTestTag: unique symbol;
declare const OppTestTag: unique symbol;
declare const CrccTag: unique symbol;

// ─────────────────────────────────────────────────────────────────
// Feature Brands (phantom types for compile-time checking)
// ─────────────────────────────────────────────────────────────────

/** Brand indicating CP (constant power) mode support */
export type HasCP = { readonly [CpTag]: true };

/** Brand indicating battery discharge testing support */
export type HasBattery = { readonly [BatteryTag]: true };

/** Brand indicating LED driver test mode support */
export type HasLED = { readonly [LedTag]: true };

/** Brand indicating electronic short circuit simulation support */
export type HasShort = { readonly [ShortTag]: true };

/** Brand indicating OPP (over-power protection) support */
export type HasOPP = { readonly [OppTag]: true };

/** Brand indicating automated OCP trip point testing support */
export type HasOCPTest = { readonly [OcpTestTag]: true };

/** Brand indicating automated OPP trip point testing support */
export type HasOPPTest = { readonly [OppTestTag]: true };

/** Brand indicating combined CR+CC mode support */
export type HasCRCC = { readonly [CrccTag]: true };

// ─────────────────────────────────────────────────────────────────
// Feature String Literals
// ─────────────────────────────────────────────────────────────────

/** Load feature string literal type */
export type LoadFeatureId =
  | 'cp'
  | 'battery'
  | 'led'
  | 'short'
  | 'opp'
  | 'ocpTest'
  | 'oppTest'
  | 'crcc';

// ─────────────────────────────────────────────────────────────────
// String → Brand Mapping
// ─────────────────────────────────────────────────────────────────

/** Maps Load feature string literals to their branded types */
export type LoadFeatureMap = {
  cp: HasCP;
  battery: HasBattery;
  led: HasLED;
  short: HasShort;
  opp: HasOPP;
  ocpTest: HasOCPTest;
  oppTest: HasOPPTest;
  crcc: HasCRCC;
};

// ─────────────────────────────────────────────────────────────────
// Feature Method Interfaces
// ─────────────────────────────────────────────────────────────────

/** CP mode methods added when 'cp' feature is present */
export interface CpMethods {
  getPower(): Promise<Result<number, Error>>;
  setPower(watts: number): Promise<Result<void, Error>>;
}

/** Battery test mode type */
export type BatteryMode = 'capacity' | 'time' | 'voltage';

/** Battery test methods added when 'battery' feature is present */
export interface BatteryMethods {
  getBatteryMode(): Promise<Result<BatteryMode, Error>>;
  setBatteryMode(mode: BatteryMode): Promise<Result<void, Error>>;
  getBatteryCutoffVoltage(): Promise<Result<number, Error>>;
  setBatteryCutoffVoltage(volts: number): Promise<Result<void, Error>>;
  getBatteryCutoffCapacity(): Promise<Result<number, Error>>;
  setBatteryCutoffCapacity(ah: number): Promise<Result<void, Error>>;
  getBatteryTimeout(): Promise<Result<number, Error>>;
  setBatteryTimeout(seconds: number): Promise<Result<void, Error>>;
  getBatteryAh(): Promise<Result<number, Error>>;
  getBatteryWh(): Promise<Result<number, Error>>;
  getBatteryTime(): Promise<Result<number, Error>>;
  startBatteryTest(): Promise<Result<void, Error>>;
  stopBatteryTest(): Promise<Result<void, Error>>;
}

/** LED test methods added when 'led' feature is present */
export interface LedMethods {
  getLedVf(): Promise<Result<number, Error>>;
  setLedVf(volts: number): Promise<Result<void, Error>>;
  getLedRd(): Promise<Result<number, Error>>;
  setLedRd(ohms: number): Promise<Result<void, Error>>;
}

/** Short circuit methods added when 'short' feature is present */
export interface ShortMethods {
  getShortEnabled(): Promise<Result<boolean, Error>>;
  setShortEnabled(enabled: boolean): Promise<Result<void, Error>>;
}

/** OPP methods added when 'opp' feature is present */
export interface OppMethods {
  getOppLevel(): Promise<Result<number, Error>>;
  setOppLevel(watts: number): Promise<Result<void, Error>>;
  getOppEnabled(): Promise<Result<boolean, Error>>;
  setOppEnabled(enabled: boolean): Promise<Result<void, Error>>;
}

/** OCP test result */
export interface OcpTestResult {
  tripCurrent: number;
  passed: boolean;
}

/** OCP test methods added when 'ocpTest' feature is present */
export interface OcpTestMethods {
  setOcpTestStart(amps: number): Promise<Result<void, Error>>;
  setOcpTestEnd(amps: number): Promise<Result<void, Error>>;
  setOcpTestStep(amps: number): Promise<Result<void, Error>>;
  runOcpTest(): Promise<Result<OcpTestResult, Error>>;
}

/** OPP test result */
export interface OppTestResult {
  tripPower: number;
  passed: boolean;
}

/** OPP test methods added when 'oppTest' feature is present */
export interface OppTestMethods {
  setOppTestStart(watts: number): Promise<Result<void, Error>>;
  setOppTestEnd(watts: number): Promise<Result<void, Error>>;
  setOppTestStep(watts: number): Promise<Result<void, Error>>;
  runOppTest(): Promise<Result<OppTestResult, Error>>;
}

/** CRCC (combined CR+CC) methods added when 'crcc' feature is present */
export interface CrccMethods {
  getCrccResistance(): Promise<Result<number, Error>>;
  setCrccResistance(ohms: number): Promise<Result<void, Error>>;
  getCrccCurrentLimit(): Promise<Result<number, Error>>;
  setCrccCurrentLimit(amps: number): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Feature Properties (for spec enforcement)
// ─────────────────────────────────────────────────────────────────

/** Maps Load features to their required property keys */
export type LoadFeatureProperties = {
  cp: 'power';
  battery:
    | 'batteryMode'
    | 'batteryCutoffVoltage'
    | 'batteryCutoffCapacity'
    | 'batteryTimeout'
    | 'batteryAh'
    | 'batteryWh'
    | 'batteryTime';
  led: 'ledVf' | 'ledRd';
  short: 'shortEnabled';
  opp: 'oppLevel' | 'oppEnabled';
  ocpTest: 'ocpTestStart' | 'ocpTestEnd' | 'ocpTestStep';
  oppTest: 'oppTestStart' | 'oppTestEnd' | 'oppTestStep';
  crcc: 'crccResistance' | 'crccCurrentLimit';
};
