/**
 * Power Supply feature brands and types for granular type safety.
 *
 * Features are optional capabilities that vary between PSU models.
 * The runtime `features` array is the single source of truth,
 * and TypeScript derives compile-time types from it automatically.
 *
 * @packageDocumentation
 */

import type { Result } from '../../result.js';

// ─────────────────────────────────────────────────────────────────
// Feature Brand Tags (unique symbols for nominal typing)
// ─────────────────────────────────────────────────────────────────

declare const OvpTag: unique symbol;
declare const OcpTag: unique symbol;
declare const OppTag: unique symbol;
declare const SlewTag: unique symbol;
declare const SenseTag: unique symbol;
declare const SequenceTag: unique symbol;
declare const TrackingTag: unique symbol;
declare const TriggerTag: unique symbol;
declare const DatalogTag: unique symbol;
declare const AnalyzerTag: unique symbol;

// ─────────────────────────────────────────────────────────────────
// Feature Brands (phantom types for compile-time checking)
// ─────────────────────────────────────────────────────────────────

/** Brand indicating OVP (over-voltage protection) support */
export type HasOvp = { readonly [OvpTag]: true };

/** Brand indicating OCP (over-current protection) support */
export type HasOcp = { readonly [OcpTag]: true };

/** Brand indicating OPP (over-power protection) support */
export type HasOpp = { readonly [OppTag]: true };

/** Brand indicating slew rate control support */
export type HasSlew = { readonly [SlewTag]: true };

/** Brand indicating remote sensing (4-wire) support */
export type HasSense = { readonly [SenseTag]: true };

/** Brand indicating sequence/list mode support */
export type HasSequence = { readonly [SequenceTag]: true };

/** Brand indicating channel tracking support */
export type HasTracking = { readonly [TrackingTag]: true };

/** Brand indicating triggered step mode support */
export type HasTrigger = { readonly [TriggerTag]: true };

/** Brand indicating data logging support */
export type HasDatalog = { readonly [DatalogTag]: true };

/** Brand indicating power analyzer function support */
export type HasAnalyzer = { readonly [AnalyzerTag]: true };

// ─────────────────────────────────────────────────────────────────
// Feature String Literals
// ─────────────────────────────────────────────────────────────────

/** PSU feature string literal type */
export type PsuFeatureId =
  | 'ovp'
  | 'ocp'
  | 'opp'
  | 'slew'
  | 'sense'
  | 'sequence'
  | 'tracking'
  | 'trigger'
  | 'datalog'
  | 'analyzer';

// ─────────────────────────────────────────────────────────────────
// String → Brand Mapping
// ─────────────────────────────────────────────────────────────────

/** Maps PSU feature string literals to their branded types */
export type PsuFeatureMap = {
  ovp: HasOvp;
  ocp: HasOcp;
  opp: HasOpp;
  slew: HasSlew;
  sense: HasSense;
  sequence: HasSequence;
  tracking: HasTracking;
  trigger: HasTrigger;
  datalog: HasDatalog;
  analyzer: HasAnalyzer;
};

// ─────────────────────────────────────────────────────────────────
// Feature Method Interfaces
// ─────────────────────────────────────────────────────────────────

/** OVP methods added to channels when 'ovp' feature is present */
export interface OvpMethods {
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
}

/** OCP methods added to channels when 'ocp' feature is present */
export interface OcpMethods {
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(amps: number): Promise<Result<void, Error>>;
}

/** OPP methods added to channels when 'opp' feature is present */
export interface OppMethods {
  getOppEnabled(): Promise<Result<boolean, Error>>;
  setOppEnabled(enabled: boolean): Promise<Result<void, Error>>;
  getOppLevel(): Promise<Result<number, Error>>;
  setOppLevel(watts: number): Promise<Result<void, Error>>;
}

/** Slew rate methods added to channels when 'slew' feature is present */
export interface SlewMethods {
  getVoltageSlewRate(): Promise<Result<number, Error>>;
  setVoltageSlewRate(voltsPerSec: number): Promise<Result<void, Error>>;
  getCurrentSlewRate(): Promise<Result<number, Error>>;
  setCurrentSlewRate(ampsPerSec: number): Promise<Result<void, Error>>;
}

/** Sense mode type */
export type SenseMode = 'internal' | 'external';

/** Remote sensing methods added to channels when 'sense' feature is present */
export interface SenseMethods {
  getSenseMode(): Promise<Result<SenseMode, Error>>;
  setSenseMode(mode: SenseMode): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Instrument-Level Feature Methods
// ─────────────────────────────────────────────────────────────────

/** Tracking mode type */
export type TrackingMode = 'independent' | 'series' | 'parallel';

/** Tracking methods added to PSU when 'tracking' feature is present */
export interface TrackingMethods {
  getTrackingMode(): Promise<Result<TrackingMode, Error>>;
  setTrackingMode(mode: TrackingMode): Promise<Result<void, Error>>;
}

/** Sequence step definition */
export interface SequenceStep {
  voltage: number;
  current: number;
  duration: number;
}

/** Sequence methods added to PSU when 'sequence' feature is present */
export interface SequenceMethods {
  uploadSequence(steps: SequenceStep[], repeat?: number): Promise<Result<void, Error>>;
  startSequence(): Promise<Result<void, Error>>;
  stopSequence(): Promise<Result<void, Error>>;
  getSequenceRunning(): Promise<Result<boolean, Error>>;
}

/** Trigger methods added to PSU when 'trigger' feature is present */
export interface TriggerMethods {
  setTriggerVoltage(volts: number): Promise<Result<void, Error>>;
  setTriggerCurrent(amps: number): Promise<Result<void, Error>>;
  trigger(): Promise<Result<void, Error>>;
}

/** Datalog methods added to PSU when 'datalog' feature is present */
export interface DatalogMethods {
  startDatalog(intervalMs: number): Promise<Result<void, Error>>;
  stopDatalog(): Promise<Result<void, Error>>;
  getDatalogRunning(): Promise<Result<boolean, Error>>;
}

/** Analyzer methods added to PSU when 'analyzer' feature is present */
export interface AnalyzerMethods {
  getAnalyzerEnabled(): Promise<Result<boolean, Error>>;
  setAnalyzerEnabled(enabled: boolean): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Feature Properties (for spec enforcement)
// ─────────────────────────────────────────────────────────────────

/** Maps PSU features to their required channel property keys */
export type PsuChannelFeatureProperties = {
  ovp: 'ovpEnabled' | 'ovpLevel';
  ocp: 'ocpEnabled' | 'ocpLevel';
  opp: 'oppEnabled' | 'oppLevel';
  slew: 'voltageSlewRate' | 'currentSlewRate';
  sense: 'senseMode';
};

/** Maps PSU features to their required instrument property keys */
export type PsuInstrumentFeatureProperties = {
  tracking: 'trackingMode';
  datalog: 'datalogInterval' | 'datalogRunning';
  analyzer: 'analyzerEnabled';
};
