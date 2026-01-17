/**
 * Runtime type guards for feature detection.
 *
 * These functions check if a driver/channel has a specific feature at runtime
 * and narrow the TypeScript type accordingly.
 *
 * @example
 * ```typescript
 * import { hasPsuFeature, type HasOvp } from 'visa-ts';
 *
 * const psu = await driver.connect(resource);
 *
 * if (hasPsuFeature(psu, 'ovp')) {
 *   // TypeScript knows psu has OVP methods
 *   const ch = psu.channel(1);
 *   await ch.getOvpLevel();  // ✓ No error
 * }
 * ```
 *
 * @packageDocumentation
 */

import type {
  HasOvp,
  HasOcp,
  HasOpp,
  HasSlew,
  HasSense,
  HasSequence,
  HasTracking,
  HasTrigger,
  HasDatalog,
  HasAnalyzer,
  PsuFeatureId,
  PsuFeatureMap,
} from './psu-features.js';

import type {
  HasCP,
  HasBattery,
  HasLED,
  HasShort,
  HasOPP,
  HasOCPTest,
  HasOPPTest,
  HasCRCC,
  LoadFeatureId,
  LoadFeatureMap,
} from './load-features.js';

import type {
  HasDecode,
  HasDigital,
  HasMask,
  HasHistogram,
  HasSegmented,
  HasWavegen,
  HasSearch,
  HasBode,
  HasPower,
  HasJitter,
  OscFeatureId,
  OscFeatureMap,
} from './osc-features.js';

// ─────────────────────────────────────────────────────────────────
// Base interfaces for type guards
// ─────────────────────────────────────────────────────────────────

/** Minimal interface for instruments with features */
interface WithFeatures<F extends string> {
  readonly features: readonly F[];
}

// ─────────────────────────────────────────────────────────────────
// Power Supply Type Guards
// ─────────────────────────────────────────────────────────────────

/**
 * Check if a PSU has a specific feature.
 *
 * @param psu - The power supply instance
 * @param feature - The feature to check for
 * @returns True if the feature is present
 *
 * @example
 * ```typescript
 * if (hasPsuFeature(psu, 'ovp')) {
 *   await psu.channel(1).getOvpLevel();
 * }
 * ```
 */
export function hasPsuFeature<T extends WithFeatures<PsuFeatureId>, F extends PsuFeatureId>(
  psu: T,
  feature: F
): psu is T & PsuFeatureMap[F] {
  return psu.features.includes(feature);
}

/** Type guard for OVP feature */
export function hasOvp<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasOvp {
  return hasPsuFeature(psu, 'ovp');
}

/** Type guard for OCP feature */
export function hasOcp<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasOcp {
  return hasPsuFeature(psu, 'ocp');
}

/** Type guard for OPP feature */
export function hasPsuOpp<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasOpp {
  return hasPsuFeature(psu, 'opp');
}

/** Type guard for slew rate feature */
export function hasSlew<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasSlew {
  return hasPsuFeature(psu, 'slew');
}

/** Type guard for remote sense feature */
export function hasSense<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasSense {
  return hasPsuFeature(psu, 'sense');
}

/** Type guard for sequence feature */
export function hasSequence<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasSequence {
  return hasPsuFeature(psu, 'sequence');
}

/** Type guard for tracking feature */
export function hasTracking<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasTracking {
  return hasPsuFeature(psu, 'tracking');
}

/** Type guard for trigger feature */
export function hasTrigger<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasTrigger {
  return hasPsuFeature(psu, 'trigger');
}

/** Type guard for datalog feature */
export function hasDatalog<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasDatalog {
  return hasPsuFeature(psu, 'datalog');
}

/** Type guard for analyzer feature */
export function hasAnalyzer<T extends WithFeatures<PsuFeatureId>>(psu: T): psu is T & HasAnalyzer {
  return hasPsuFeature(psu, 'analyzer');
}

// ─────────────────────────────────────────────────────────────────
// Electronic Load Type Guards
// ─────────────────────────────────────────────────────────────────

/**
 * Check if a load has a specific feature.
 *
 * @param load - The electronic load instance
 * @param feature - The feature to check for
 * @returns True if the feature is present
 */
export function hasLoadFeature<T extends WithFeatures<LoadFeatureId>, F extends LoadFeatureId>(
  load: T,
  feature: F
): load is T & LoadFeatureMap[F] {
  return load.features.includes(feature);
}

/** Type guard for CP mode feature */
export function hasCp<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasCP {
  return hasLoadFeature(load, 'cp');
}

/** Type guard for battery test feature */
export function hasBattery<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasBattery {
  return hasLoadFeature(load, 'battery');
}

/** Type guard for LED test feature */
export function hasLed<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasLED {
  return hasLoadFeature(load, 'led');
}

/** Type guard for short circuit feature */
export function hasShort<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasShort {
  return hasLoadFeature(load, 'short');
}

/** Type guard for OPP feature */
export function hasLoadOpp<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasOPP {
  return hasLoadFeature(load, 'opp');
}

/** Type guard for OCP test feature */
export function hasOcpTest<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasOCPTest {
  return hasLoadFeature(load, 'ocpTest');
}

/** Type guard for OPP test feature */
export function hasOppTest<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasOPPTest {
  return hasLoadFeature(load, 'oppTest');
}

/** Type guard for CRCC feature */
export function hasCrcc<T extends WithFeatures<LoadFeatureId>>(load: T): load is T & HasCRCC {
  return hasLoadFeature(load, 'crcc');
}

// ─────────────────────────────────────────────────────────────────
// Oscilloscope Type Guards
// ─────────────────────────────────────────────────────────────────

/**
 * Check if an oscilloscope has a specific feature.
 *
 * @param scope - The oscilloscope instance
 * @param feature - The feature to check for
 * @returns True if the feature is present
 */
export function hasOscFeature<T extends WithFeatures<OscFeatureId>, F extends OscFeatureId>(
  scope: T,
  feature: F
): scope is T & OscFeatureMap[F] {
  return scope.features.includes(feature);
}

/** Type guard for decode feature */
export function hasDecode<T extends WithFeatures<OscFeatureId>>(scope: T): scope is T & HasDecode {
  return hasOscFeature(scope, 'decode');
}

/** Type guard for digital/MSO feature */
export function hasDigital<T extends WithFeatures<OscFeatureId>>(
  scope: T
): scope is T & HasDigital {
  return hasOscFeature(scope, 'digital');
}

/** Type guard for mask test feature */
export function hasMask<T extends WithFeatures<OscFeatureId>>(scope: T): scope is T & HasMask {
  return hasOscFeature(scope, 'mask');
}

/** Type guard for histogram feature */
export function hasHistogram<T extends WithFeatures<OscFeatureId>>(
  scope: T
): scope is T & HasHistogram {
  return hasOscFeature(scope, 'histogram');
}

/** Type guard for segmented memory feature */
export function hasSegmented<T extends WithFeatures<OscFeatureId>>(
  scope: T
): scope is T & HasSegmented {
  return hasOscFeature(scope, 'segmented');
}

/** Type guard for waveform generator feature */
export function hasWavegen<T extends WithFeatures<OscFeatureId>>(
  scope: T
): scope is T & HasWavegen {
  return hasOscFeature(scope, 'wavegen');
}

/** Type guard for search feature */
export function hasSearch<T extends WithFeatures<OscFeatureId>>(scope: T): scope is T & HasSearch {
  return hasOscFeature(scope, 'search');
}

/** Type guard for Bode plot feature */
export function hasBode<T extends WithFeatures<OscFeatureId>>(scope: T): scope is T & HasBode {
  return hasOscFeature(scope, 'bode');
}

/** Type guard for power analysis feature */
export function hasPower<T extends WithFeatures<OscFeatureId>>(scope: T): scope is T & HasPower {
  return hasOscFeature(scope, 'power');
}

/** Type guard for jitter analysis feature */
export function hasJitter<T extends WithFeatures<OscFeatureId>>(scope: T): scope is T & HasJitter {
  return hasOscFeature(scope, 'jitter');
}
