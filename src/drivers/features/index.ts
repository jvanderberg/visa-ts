/**
 * Granular feature system for type-safe driver capabilities.
 *
 * This module provides branded types and utility types that enable
 * compile-time checking of feature availability. The runtime `features`
 * array is the single source of truth, and TypeScript derives the
 * compile-time types from it automatically.
 *
 * @example
 * ```typescript
 * import { defineDriver, type PsuFeatureId, type HasOvp, type HasOcp } from 'visa-ts';
 *
 * const dp832 = defineDriver({
 *   features: ['ovp', 'ocp'] as const,  // Single source of truth
 *   // ...
 * });
 *
 * const psu = await dp832.connect(resource);
 * const ch = psu.channel(1);
 *
 * ch.getVoltage();   // ✓ Always available
 * ch.getOvpLevel();  // ✓ Available because 'ovp' in features
 * ch.getSlewRate();  // ✗ Error: 'slew' not in features
 * ```
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────────
// Utility Types
// ─────────────────────────────────────────────────────────────────

export type {
  UnionToIntersection,
  FeaturesFromArray,
  RequiredPropsFromFeatures,
  IfHasFeature,
  ChannelWithFeatures,
} from './utils.js';

// ─────────────────────────────────────────────────────────────────
// Power Supply Features
// ─────────────────────────────────────────────────────────────────

export {
  // Brands
  type HasOvp,
  type HasOcp,
  type HasOpp,
  type HasSlew,
  type HasSense,
  type HasSequence,
  type HasTracking,
  type HasTrigger,
  type HasDatalog,
  type HasAnalyzer,
  // Feature ID type
  type PsuFeatureId,
  // Feature map
  type PsuFeatureMap,
  // Method interfaces
  type OvpMethods,
  type OcpMethods,
  type OppMethods,
  type SlewMethods,
  type SenseMethods,
  type TrackingMethods,
  type SequenceMethods,
  type TriggerMethods,
  type DatalogMethods,
  type AnalyzerMethods,
  // Supporting types
  type SenseMode,
  type TrackingMode,
  type SequenceStep,
  // Property mappings
  type PsuChannelFeatureProperties,
  type PsuInstrumentFeatureProperties,
} from './psu-features.js';

// ─────────────────────────────────────────────────────────────────
// Electronic Load Features
// ─────────────────────────────────────────────────────────────────

export {
  // Brands
  type HasCP,
  type HasBattery,
  type HasLED,
  type HasShort,
  type HasOPP,
  type HasOCPTest,
  type HasOPPTest,
  type HasCRCC,
  // Feature ID type
  type LoadFeatureId,
  // Feature map
  type LoadFeatureMap,
  // Method interfaces
  type CpMethods,
  type BatteryMethods,
  type LedMethods,
  type ShortMethods,
  type OppMethods as LoadOppMethods,
  type OcpTestMethods,
  type OppTestMethods,
  type CrccMethods,
  // Supporting types
  type BatteryMode,
  type OcpTestResult,
  type OppTestResult,
  // Property mappings
  type LoadFeatureProperties,
} from './load-features.js';

// ─────────────────────────────────────────────────────────────────
// Oscilloscope Features
// ─────────────────────────────────────────────────────────────────

export {
  // Brands
  type HasDecode,
  type HasDigital,
  type HasMask,
  type HasHistogram,
  type HasSegmented,
  type HasWavegen,
  type HasSearch,
  type HasBode,
  type HasPower,
  type HasJitter,
  // Feature ID type
  type OscFeatureId,
  // Feature map
  type OscFeatureMap,
  // Method interfaces
  type DecodeMethods,
  type DigitalMethods,
  type MaskMethods,
  type HistogramMethods,
  type SegmentedMethods,
  type WavegenMethods,
  type SearchMethods,
  type BodeMethods,
  type PowerMethods,
  type JitterMethods,
  // Supporting types
  type Protocol,
  type DigitalChannel,
  type MaskTestResult,
  type HistogramAxis,
  type WavegenFunction,
  type SearchType,
  type SearchMark,
  type PowerAnalysisType,
  type JitterMeasurement,
  // Property mappings
  type OscFeatureProperties,
} from './osc-features.js';

// ─────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────

export {
  // PSU type guards
  hasPsuFeature,
  hasOvp,
  hasOcp,
  hasPsuOpp,
  hasSlew,
  hasSense,
  hasSequence,
  hasTracking,
  hasTrigger,
  hasDatalog,
  hasAnalyzer,
  // Load type guards
  hasLoadFeature,
  hasCp,
  hasBattery,
  hasLed,
  hasShort,
  hasLoadOpp,
  hasOcpTest,
  hasOppTest,
  hasCrcc,
  // Oscilloscope type guards
  hasOscFeature,
  hasDecode,
  hasDigital,
  hasMask,
  hasHistogram,
  hasSegmented,
  hasWavegen,
  hasSearch,
  hasBode,
  hasPower,
  hasJitter,
} from './type-guards.js';
