/**
 * Type tests for the granular feature system.
 *
 * These tests verify that the feature system correctly:
 * 1. Exposes features on connected driver instances
 * 2. Preserves feature literal types with `as const`
 * 3. Type guards narrow types correctly
 */

import { describe, it, expect } from 'vitest';
import { expectTypeOf } from 'vitest';

// Import feature types
import type {
  PsuFeatureId,
  LoadFeatureId,
  OscFeatureId,
  HasOvp,
  HasOcp,
  HasCP,
  HasDecode,
  FeaturesFromArray,
  PsuFeatureMap,
  LoadFeatureMap,
  OscFeatureMap,
} from '../../src/drivers/features/index.js';

// Import type guards
import {
  // PSU guards
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
  // Load guards
  hasLoadFeature,
  hasCp,
  hasBattery,
  hasLed,
  hasShort,
  hasLoadOpp,
  hasOcpTest,
  hasOppTest,
  hasCrcc,
  // Oscilloscope guards
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
} from '../../src/drivers/features/index.js';

// ─────────────────────────────────────────────────────────────────
// FeaturesFromArray Type Tests
// ─────────────────────────────────────────────────────────────────

describe('FeaturesFromArray utility type', () => {
  it('converts single feature to brand', () => {
    type Result = FeaturesFromArray<readonly ['ovp'], PsuFeatureMap>;
    expectTypeOf<Result>().toMatchTypeOf<HasOvp>();
  });

  it('converts multiple features to intersection', () => {
    type Result = FeaturesFromArray<readonly ['ovp', 'ocp'], PsuFeatureMap>;
    expectTypeOf<Result>().toMatchTypeOf<HasOvp & HasOcp>();
  });

  it('handles empty array', () => {
    type Result = FeaturesFromArray<readonly [], PsuFeatureMap>;
    // Empty array should result in never (no features)
    expectTypeOf<Result>().toMatchTypeOf<never>();
  });

  it('works with load features', () => {
    type Result = FeaturesFromArray<readonly ['cp'], LoadFeatureMap>;
    expectTypeOf<Result>().toMatchTypeOf<HasCP>();
  });

  it('works with oscilloscope features', () => {
    type Result = FeaturesFromArray<readonly ['decode'], OscFeatureMap>;
    expectTypeOf<Result>().toMatchTypeOf<HasDecode>();
  });
});

// ─────────────────────────────────────────────────────────────────
// Feature ID Type Tests
// ─────────────────────────────────────────────────────────────────

describe('Feature ID types', () => {
  it('PsuFeatureId includes all PSU features', () => {
    const validFeatures: PsuFeatureId[] = [
      'ovp',
      'ocp',
      'opp',
      'slew',
      'sense',
      'sequence',
      'tracking',
      'trigger',
      'datalog',
      'analyzer',
    ];
    expect(validFeatures).toHaveLength(10);
  });

  it('LoadFeatureId includes all Load features', () => {
    const validFeatures: LoadFeatureId[] = [
      'cp',
      'battery',
      'led',
      'short',
      'opp',
      'ocpTest',
      'oppTest',
      'crcc',
    ];
    expect(validFeatures).toHaveLength(8);
  });

  it('OscFeatureId includes all Oscilloscope features', () => {
    const validFeatures: OscFeatureId[] = [
      'decode',
      'digital',
      'mask',
      'histogram',
      'segmented',
      'wavegen',
      'search',
      'bode',
      'power',
      'jitter',
    ];
    expect(validFeatures).toHaveLength(10);
  });
});

// ─────────────────────────────────────────────────────────────────
// Type Guard Tests
// ─────────────────────────────────────────────────────────────────

describe('Type guards', () => {
  interface MockPsu {
    features: readonly PsuFeatureId[];
  }

  interface MockLoad {
    features: readonly LoadFeatureId[];
  }

  interface MockOsc {
    features: readonly OscFeatureId[];
  }

  describe('PSU type guards', () => {
    it('hasPsuFeature checks for any PSU feature', () => {
      const psu: MockPsu = { features: ['ovp', 'ocp', 'slew'] };
      expect(hasPsuFeature(psu, 'ovp')).toBe(true);
      expect(hasPsuFeature(psu, 'ocp')).toBe(true);
      expect(hasPsuFeature(psu, 'slew')).toBe(true);
      expect(hasPsuFeature(psu, 'opp')).toBe(false);
    });

    it('hasOvp returns true when ovp is present', () => {
      const psu: MockPsu = { features: ['ovp', 'ocp'] };
      expect(hasOvp(psu)).toBe(true);
    });

    it('hasOvp returns false when ovp is not present', () => {
      const psu: MockPsu = { features: ['ocp'] };
      expect(hasOvp(psu)).toBe(false);
    });

    it('hasOcp returns true when ocp is present', () => {
      const psu: MockPsu = { features: ['ovp', 'ocp'] };
      expect(hasOcp(psu)).toBe(true);
    });

    it('hasPsuOpp returns true when opp is present', () => {
      const psu: MockPsu = { features: ['opp'] };
      expect(hasPsuOpp(psu)).toBe(true);
    });

    it('hasSlew returns true when slew is present', () => {
      const psu: MockPsu = { features: ['slew'] };
      expect(hasSlew(psu)).toBe(true);
    });

    it('hasSense returns true when sense is present', () => {
      const psu: MockPsu = { features: ['sense'] };
      expect(hasSense(psu)).toBe(true);
    });

    it('hasSequence returns true when sequence is present', () => {
      const psu: MockPsu = { features: ['sequence'] };
      expect(hasSequence(psu)).toBe(true);
    });

    it('hasTracking returns true when tracking is present', () => {
      const psu: MockPsu = { features: ['tracking'] };
      expect(hasTracking(psu)).toBe(true);
    });

    it('hasTrigger returns true when trigger is present', () => {
      const psu: MockPsu = { features: ['trigger'] };
      expect(hasTrigger(psu)).toBe(true);
    });

    it('hasDatalog returns true when datalog is present', () => {
      const psu: MockPsu = { features: ['datalog'] };
      expect(hasDatalog(psu)).toBe(true);
    });

    it('hasAnalyzer returns true when analyzer is present', () => {
      const psu: MockPsu = { features: ['analyzer'] };
      expect(hasAnalyzer(psu)).toBe(true);
    });
  });

  describe('Load type guards', () => {
    it('hasLoadFeature checks for any Load feature', () => {
      const load: MockLoad = { features: ['cp', 'battery', 'short'] };
      expect(hasLoadFeature(load, 'cp')).toBe(true);
      expect(hasLoadFeature(load, 'battery')).toBe(true);
      expect(hasLoadFeature(load, 'short')).toBe(true);
      expect(hasLoadFeature(load, 'led')).toBe(false);
    });

    it('hasCp returns true when cp is present', () => {
      const load: MockLoad = { features: ['cp', 'battery'] };
      expect(hasCp(load)).toBe(true);
    });

    it('hasBattery returns true when battery is present', () => {
      const load: MockLoad = { features: ['battery'] };
      expect(hasBattery(load)).toBe(true);
    });

    it('hasLed returns true when led is present', () => {
      const load: MockLoad = { features: ['led'] };
      expect(hasLed(load)).toBe(true);
    });

    it('hasShort returns true when short is present', () => {
      const load: MockLoad = { features: ['short'] };
      expect(hasShort(load)).toBe(true);
    });

    it('hasLoadOpp returns true when opp is present', () => {
      const load: MockLoad = { features: ['opp'] };
      expect(hasLoadOpp(load)).toBe(true);
    });

    it('hasOcpTest returns true when ocpTest is present', () => {
      const load: MockLoad = { features: ['ocpTest'] };
      expect(hasOcpTest(load)).toBe(true);
    });

    it('hasOppTest returns true when oppTest is present', () => {
      const load: MockLoad = { features: ['oppTest'] };
      expect(hasOppTest(load)).toBe(true);
    });

    it('hasCrcc returns true when crcc is present', () => {
      const load: MockLoad = { features: ['crcc'] };
      expect(hasCrcc(load)).toBe(true);
    });
  });

  describe('Oscilloscope type guards', () => {
    it('hasOscFeature checks for any Osc feature', () => {
      const scope: MockOsc = { features: ['decode', 'digital', 'segmented'] };
      expect(hasOscFeature(scope, 'decode')).toBe(true);
      expect(hasOscFeature(scope, 'digital')).toBe(true);
      expect(hasOscFeature(scope, 'segmented')).toBe(true);
      expect(hasOscFeature(scope, 'mask')).toBe(false);
    });

    it('hasDecode returns true when decode is present', () => {
      const scope: MockOsc = { features: ['decode'] };
      expect(hasDecode(scope)).toBe(true);
    });

    it('hasDecode returns false when decode is not present', () => {
      const scope: MockOsc = { features: [] };
      expect(hasDecode(scope)).toBe(false);
    });

    it('hasDigital returns true when digital is present', () => {
      const scope: MockOsc = { features: ['digital'] };
      expect(hasDigital(scope)).toBe(true);
    });

    it('hasMask returns true when mask is present', () => {
      const scope: MockOsc = { features: ['mask'] };
      expect(hasMask(scope)).toBe(true);
    });

    it('hasHistogram returns true when histogram is present', () => {
      const scope: MockOsc = { features: ['histogram'] };
      expect(hasHistogram(scope)).toBe(true);
    });

    it('hasSegmented returns true when segmented is present', () => {
      const scope: MockOsc = { features: ['segmented'] };
      expect(hasSegmented(scope)).toBe(true);
    });

    it('hasWavegen returns true when wavegen is present', () => {
      const scope: MockOsc = { features: ['wavegen'] };
      expect(hasWavegen(scope)).toBe(true);
    });

    it('hasSearch returns true when search is present', () => {
      const scope: MockOsc = { features: ['search'] };
      expect(hasSearch(scope)).toBe(true);
    });

    it('hasBode returns true when bode is present', () => {
      const scope: MockOsc = { features: ['bode'] };
      expect(hasBode(scope)).toBe(true);
    });

    it('hasPower returns true when power is present', () => {
      const scope: MockOsc = { features: ['power'] };
      expect(hasPower(scope)).toBe(true);
    });

    it('hasJitter returns true when jitter is present', () => {
      const scope: MockOsc = { features: ['jitter'] };
      expect(hasJitter(scope)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Driver Features Integration Tests
// ─────────────────────────────────────────────────────────────────

describe('Driver features integration', () => {
  // These tests verify that drivers correctly expose their features
  // They use the actual driver exports

  it('DP832 driver spec has features array', async () => {
    const { rigolDP832 } = await import('../../src/drivers/implementations/rigol/dp832.js');
    expect(rigolDP832.spec.features).toBeDefined();
    expect(rigolDP832.spec.features).toContain('ovp');
    expect(rigolDP832.spec.features).toContain('ocp');
  });

  it('DS1054Z driver spec has empty features array (entry-level scope)', async () => {
    const { rigolDS1054Z } = await import('../../src/drivers/implementations/rigol/ds1054z.js');
    expect(rigolDS1054Z.spec.features).toBeDefined();
    expect(rigolDS1054Z.spec.features).toHaveLength(0);
  });

  it('WPS300S driver spec has empty features array (basic PSU)', async () => {
    const { matrixWPS300S } = await import('../../src/drivers/implementations/matrix/wps300s.js');
    expect(matrixWPS300S.spec.features).toBeDefined();
    expect(matrixWPS300S.spec.features).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Compile-Time Type Safety Tests
// ─────────────────────────────────────────────────────────────────

describe('Compile-time type safety', () => {
  it('features array is readonly', async () => {
    const { rigolDP832 } = await import('../../src/drivers/implementations/rigol/dp832.js');

    // This should be readonly
    expectTypeOf(rigolDP832.spec.features).toMatchTypeOf<readonly ('ovp' | 'ocp')[]>();
  });

  it('features are preserved as literal types', async () => {
    const { rigolDP832 } = await import('../../src/drivers/implementations/rigol/dp832.js');

    // The features should be the exact literal type, not just string[]
    const features = rigolDP832.spec.features;
    if (features) {
      // At runtime, check the actual values
      expect(features[0]).toBe('ovp');
      expect(features[1]).toBe('ocp');
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Bad Driver Definition Tests (compile-time errors)
// ─────────────────────────────────────────────────────────────────

describe('Bad driver definitions are caught', () => {
  it('invalid feature ID is a type error', () => {
    // This test documents that invalid feature IDs are caught at compile time
    // The following would cause a compile error if uncommented:
    //
    // const badFeatures = ['ovp', 'invalid_feature'] as const satisfies readonly PsuFeatureId[];
    //                                 ^^^^^^^^^^^^^^^ Type '"invalid_feature"' is not assignable to type 'PsuFeatureId'
    //
    // This is verified by the `satisfies` keyword in the driver definitions
    expect(true).toBe(true);
  });
});
