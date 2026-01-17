# PSU Driver Implementation Plan

> Plan to close the gap between current driver model and comprehensive SCPI capabilities

## Current State

- **Base interface** (`src/drivers/equipment/power-supply.ts`): Minimal - only covers output, setpoints, measurements
- **DP832 implementation** (`src/drivers/implementations/rigol/dp832.ts`): Extended with OVP/OCP/mode, but missing tripped/clear
- **Documentation**: Comprehensive SCPI references for 7 vendors created

## Target State

A comprehensive `PowerSupply` interface that covers common functionality across vendors, with unsupported features returning `Err("not supported")`.

---

## Implementation Phases

### Phase 1: Update Base Interface

**File:** `src/drivers/equipment/power-supply.ts`

**Changes:**

1. Add constants with runtime values (like `LoadMode` pattern):
   ```typescript
   export const RegulationMode = {
     CV: 'CV',
     CC: 'CC',
     Unregulated: 'UR',
   } as const;

   export const TrackingMode = {
     Independent: 'INDEPENDENT',
     Series: 'SERIES',
     Parallel: 'PARALLEL',
   } as const;

   export const SenseMode = {
     Internal: 'INTERNAL',
     External: 'EXTERNAL',
   } as const;
   ```

2. Add `SequenceStep` interface:
   ```typescript
   export interface SequenceStep {
     voltage: number;
     current: number;
     durationSeconds: number;
   }
   ```

3. Expand `PowerSupplyChannel`:
   - `getRegulationMode()` - required
   - `getMeasuredPower()` - required (remove optional `?`)
   - OVP: `getOvpLevel`, `setOvpLevel`, `getOvpEnabled`, `setOvpEnabled`, `isOvpTripped`, `clearOvp`
   - OCP: `getOcpLevel`, `setOcpLevel`, `getOcpEnabled`, `setOcpEnabled`, `isOcpTripped`, `clearOcp`
   - Slew: `getVoltageSlewRate`, `setVoltageSlewRate`, `getCurrentSlewRate`, `setCurrentSlewRate`
   - Sense: `getSenseMode`, `setSenseMode`

4. Expand `PowerSupply`:
   - `enableAllOutputs()`, `disableAllOutputs()`
   - `getTrackingMode()`, `setTrackingMode()`
   - `saveState(slot)`, `recallState(slot)`
   - `loadSequence()`, `startSequence()`, `stopSequence()`, `isSequenceRunning()`

**Tests to add:** `src/drivers/equipment/power-supply.test.ts`
- Type tests for new interfaces
- Mock implementation tests

---

### Phase 2: Add Helper Utilities

**File:** `src/drivers/helpers.ts` (new)

```typescript
import { Err, type Result } from '../result.js';

/**
 * Standard error for unsupported features.
 */
export function notSupported(feature: string): Result<never, Error> {
  return Err(new Error(`${feature} not supported on this device`));
}

/**
 * Check if a feature is supported by testing for "not supported" error.
 */
export async function supportsFeature(
  fn: () => Promise<Result<unknown, Error>>
): Promise<boolean> {
  const result = await fn();
  if (result.ok) return true;
  return !result.error.message.includes('not supported');
}
```

**Tests:** `src/drivers/helpers.test.ts`

---

### Phase 3: Update DP832 Driver

**File:** `src/drivers/implementations/rigol/dp832.ts`

**Changes:**

1. Add missing channel properties to spec:
   ```typescript
   // Protection trip/clear
   ovpTripped: {
     get: ':OUTPut:OVP:ALAR? CH{ch}',
     parse: parseScpiBool,
     readonly: true,
   },
   // Clear uses command, not property - add to methods

   // Slew rate - Rigol doesn't support, return notSupported
   voltageSlewRate: null,  // or handle in custom method
   currentSlewRate: null,

   // Sense mode - Rigol doesn't support
   senseMode: null,
   ```

2. Add instrument-level properties:
   ```typescript
   properties: {
     // existing allOutputEnabled...

     trackingMode: {
       get: ':OUTPut:TRACK?',
       set: ':OUTPut:TRACK {value}',
       parse: parseTrackingMode,
       format: formatTrackingMode,
     },
   },
   ```

3. Add sequence/timer support:
   - Map to Rigol's `:TIMEr:` commands
   - `loadSequence()` → `:TIMEr:PARameters`
   - `startSequence()` → `:TIMEr ON`
   - `stopSequence()` → `:TIMEr OFF`

4. Implement `clearOvp()` / `clearOcp()` as custom methods (not properties):
   ```typescript
   methods: {
     clearOvp: ':OUTPut:OVP:CLEar CH{ch}',
     clearOcp: ':OUTPut:OCP:CLEar CH{ch}',
   },
   ```

5. For unsupported features, return `notSupported()`:
   - `getVoltageSlewRate()` → `notSupported('Voltage slew rate')`
   - `getSenseMode()` → `notSupported('Remote sensing')`

**Tests:** Update `src/drivers/implementations/rigol/dp832.test.ts`

---

### Phase 4: Implement Siglent SPD Driver

**File:** `src/drivers/implementations/siglent/spd3303x.ts` (new)

This driver demonstrates the "not supported" pattern since Siglent lacks many features via SCPI.

**Supported:**
- Output enable/disable
- Voltage/current setpoints
- Measurements (V, I, P)
- Regulation mode (via status register parsing)
- Tracking mode (0/1/2 mapping)
- Timer sequence

**Not supported (return errors):**
- OVP/OCP (front panel only)
- Slew rate
- Remote sensing

**Reference:** `docs/drivers/psu/siglent_spd3303x_scpi_reference.md`

---

### Phase 5: Implement Keysight E36xx Driver

**File:** `src/drivers/implementations/keysight/e36312a.ts` (new)

Full-featured driver demonstrating professional PSU capabilities.

**Supported:**
- All basic features
- OVP/OCP with trip/clear
- Slew rate
- Remote sensing
- List mode sequences
- Channel lists `(@1,2,3)` syntax

**Reference:** `docs/drivers/psu/keysight_e36xx_scpi_reference.md`

---

### Phase 6: Implement R&S HMP Driver

**File:** `src/drivers/implementations/rohde-schwarz/hmp4040.ts` (new)

**Supported:**
- All basic features
- OVP/OCP
- Fuse linking (device-specific extension)
- Ramp mode (maps to slew rate interface)
- EasyArb (maps to sequence interface)

**Reference:** `docs/drivers/psu/rohde_schwarz_hmp_nge_scpi_reference.md`

---

## Driver Specification Updates

The `defineDriver` system may need updates to support:

1. **Command-only methods** (not properties):
   ```typescript
   methods: {
     clearOvp: {
       command: ':VOLT:PROT:CLE',
       channelTemplate: 'CH{ch}',
     },
   },
   ```

2. **Conditional features** (return notSupported):
   ```typescript
   channels: {
     properties: {
       voltageSlewRate: null,  // null = not supported
     },
   },
   ```

3. **Computed properties** (power = V × I):
   ```typescript
   channels: {
     computed: {
       measuredPower: async (ch) => {
         const v = await ch.getMeasuredVoltage();
         const i = await ch.getMeasuredCurrent();
         if (!v.ok || !i.ok) return Err(...);
         return Ok(v.value * i.value);
       },
     },
   },
   ```

---

## Test Strategy

### Unit Tests
- Each driver has mock-based tests
- Test both supported and unsupported feature paths
- Verify `notSupported()` returns correct error format

### Integration Tests (optional, requires hardware)
- Real device communication
- Tagged with `@hardware` for skip in CI

### Type Tests
- Ensure interfaces compile correctly
- Verify driver implementations satisfy interface

---

## File Structure After Implementation

```
src/drivers/
├── equipment/
│   ├── power-supply.ts          # Updated comprehensive interface
│   └── power-supply.test.ts     # Interface tests
├── helpers.ts                    # notSupported, supportsFeature
├── helpers.test.ts
└── implementations/
    ├── rigol/
    │   ├── dp832.ts             # Updated
    │   └── dp832.test.ts
    ├── siglent/
    │   ├── spd3303x.ts          # New
    │   └── spd3303x.test.ts
    ├── keysight/
    │   ├── e36312a.ts           # New
    │   └── e36312a.test.ts
    └── rohde-schwarz/
        ├── hmp4040.ts           # New
        └── hmp4040.test.ts
```

---

## Priority Order

1. **Phase 1** - Base interface (unblocks everything else)
2. **Phase 2** - Helpers (small, useful immediately)
3. **Phase 3** - DP832 update (validates interface design)
4. **Phase 4** - Siglent (validates "not supported" pattern)
5. **Phase 5-6** - Keysight/R&S (validates full-featured drivers)

---

## Open Questions

1. **Sequence step units**: Should `durationSeconds` be `duration` with explicit units type?

2. **Protection clear scope**: Per-channel or global? Varies by vendor.

3. **Tracking mode channels**: Which channels participate? Rigol uses CH1+CH2, some use all.

4. **Slew rate units**: V/s is standard but some vendors use V/ms. Normalize in driver?

5. **Should `supportsFeature()` be on the interface?** Could add:
   ```typescript
   interface PowerSupply {
     supportsOvp(): boolean;
     supportsSlew(): boolean;
     // etc.
   }
   ```
   Pro: Explicit. Con: Duplicates info available from trying the method.
