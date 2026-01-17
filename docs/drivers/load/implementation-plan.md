# Electronic Load Driver Implementation Plan

> Plan to close the gap between current driver model and comprehensive SCPI capabilities

## Current State

- **Base interface** (`src/drivers/equipment/electronic-load.ts`): Good foundation with modes, setpoints, measurements, and list mode
- **DL3021 implementation** (`src/drivers/implementations/rigol/dl3021.ts`): Working driver with list mode
- **Documentation**: Comprehensive SCPI references for 6 vendors created

## Target State

A comprehensive `ElectronicLoad` interface that covers common functionality across vendors, with unsupported features returning `Err("not supported")`.

---

## Vendor Feature Matrix

| Feature | Rigol DL3000 | Siglent SDL1000X | BK 8500/8600 | ITECH IT8500/8800 | Keysight N3300 | Chroma 63600 |
|---------|--------------|------------------|--------------|-------------------|----------------|--------------|
| CC/CV/CR modes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CP mode | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| V/I/P/R measure | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Input enable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (`LOAD`) |
| Short circuit | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Current range | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voltage range | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Slew rate | ✅ (A/µs) | ✅ (A/µs) | ✅ (A/µs) | ✅ (A/s) | ✅ (A/s) | ✅ |
| OVP level | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OVP tripped/clear | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OCP level | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OCP tripped/clear | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OPP level | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| OPP tripped/clear | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Dynamic/Transient | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| List/Sequence | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Battery test | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| LED test mode | ✅ | ✅ | ✅ (8600) | ✅ | ❌ | ❌ |
| Von/Voff | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Save/Recall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soft start | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| External trigger | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Gap Analysis

### Currently Implemented ✅

| Feature | Interface | DL3021 Driver |
|---------|-----------|---------------|
| Mode get/set | ✅ | ✅ |
| CC/CV/CR/CP setpoints | ✅ | ✅ |
| Input enable | ✅ | ✅ |
| V/I/P/R measurements | ✅ | ✅ |
| List mode | ✅ (extended) | ✅ |

### Missing from Interface ❌

| Feature | Priority | Notes |
|---------|----------|-------|
| **Slew rate** | High | All vendors support, units vary (A/s vs A/µs) |
| **Protection (OVP/OCP/OPP)** | High | Level, enable, tripped, clear |
| **Short circuit mode** | High | Most vendors support |
| **Ranges (V/I)** | Medium | Affects resolution/accuracy |
| **Dynamic/Transient mode** | Medium | Common for PSU testing |
| **Von/Voff thresholds** | Medium | Operating voltage window |
| **Save/Recall state** | Medium | Universal (`*SAV/*RCL`) |
| **Battery test** | Low | Specialized feature |
| **LED test mode** | Low | Specialized feature |
| **Trigger system** | Low | Complex, vendor-specific |

---

## Proposed Interface Additions

```typescript
import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';

// ─────────────────────────────────────────────────────────────────
// Constants (existing LoadMode is good, add these)
// ─────────────────────────────────────────────────────────────────

/**
 * Transient/Dynamic mode type.
 */
export const TransientMode = {
  /** Continuous oscillation between levels */
  Continuous: 'CONTINUOUS',
  /** Single pulse on trigger */
  Pulse: 'PULSE',
  /** Toggle between levels on each trigger */
  Toggle: 'TOGGLE',
} as const;

export type TransientMode = (typeof TransientMode)[keyof typeof TransientMode];

/**
 * Battery test stop condition.
 */
export const BatteryStopCondition = {
  /** Stop when voltage drops below threshold */
  Voltage: 'VOLTAGE',
  /** Stop after specified capacity (Ah) */
  Capacity: 'CAPACITY',
  /** Stop after specified time */
  Time: 'TIME',
} as const;

export type BatteryStopCondition = (typeof BatteryStopCondition)[keyof typeof BatteryStopCondition];

// ─────────────────────────────────────────────────────────────────
// Supporting Types
// ─────────────────────────────────────────────────────────────────

/**
 * Transient/Dynamic mode configuration.
 */
export interface TransientConfig {
  /** Transient mode type */
  mode: TransientMode;
  /** Level A (base level) - units depend on operating mode */
  levelA: number;
  /** Level B (transient level) - units depend on operating mode */
  levelB: number;
  /** Time at level A in seconds */
  widthA: number;
  /** Time at level B in seconds */
  widthB: number;
  /** Slew rate for transitions (optional) */
  slewRate?: number;
}

/**
 * Battery test configuration.
 */
export interface BatteryTestConfig {
  /** Discharge current in A */
  current: number;
  /** Stop condition type */
  stopCondition: BatteryStopCondition;
  /** Stop value (V for voltage, Ah for capacity, s for time) */
  stopValue: number;
}

/**
 * Battery test results.
 */
export interface BatteryTestResult {
  /** Total capacity discharged in Ah */
  capacityAh: number;
  /** Total energy discharged in Wh */
  energyWh: number;
  /** Total test time in seconds */
  timeSeconds: number;
  /** Final voltage at end of test */
  finalVoltage: number;
}

// ─────────────────────────────────────────────────────────────────
// Electronic Load Channel (Comprehensive)
// ─────────────────────────────────────────────────────────────────

/**
 * Electronic load channel interface.
 *
 * All methods are present on all channels. Unsupported features
 * return `Err("Feature not supported")`.
 */
export interface ElectronicLoadChannel {
  readonly channelNumber: number;

  // ─────────────────────────────────────────────────────────────
  // Mode (existing)
  // ─────────────────────────────────────────────────────────────

  getMode(): Promise<Result<LoadMode, Error>>;
  setMode(mode: LoadMode): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Setpoints (existing)
  // ─────────────────────────────────────────────────────────────

  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getResistance(): Promise<Result<number, Error>>;
  setResistance(ohms: number): Promise<Result<void, Error>>;
  getPower(): Promise<Result<number, Error>>;
  setPower(watts: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Input Control (existing)
  // ─────────────────────────────────────────────────────────────

  getInputEnabled(): Promise<Result<boolean, Error>>;
  setInputEnabled(enabled: boolean): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Measurements (existing)
  // ─────────────────────────────────────────────────────────────

  getMeasuredVoltage(): Promise<Result<number, Error>>;
  getMeasuredCurrent(): Promise<Result<number, Error>>;
  getMeasuredPower(): Promise<Result<number, Error>>;
  getMeasuredResistance(): Promise<Result<number, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Short Circuit Mode (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get short circuit mode state.
   * In short circuit mode, load sinks maximum current for the range.
   */
  getShortEnabled(): Promise<Result<boolean, Error>>;

  /**
   * Enable/disable short circuit mode.
   */
  setShortEnabled(enabled: boolean): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Ranges (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get current range in A.
   * Returns the maximum current for the selected range.
   */
  getCurrentRange(): Promise<Result<number, Error>>;

  /**
   * Set current range in A.
   * Pass the desired maximum current; load selects appropriate range.
   */
  setCurrentRange(maxAmps: number): Promise<Result<void, Error>>;

  /**
   * Get voltage range in V.
   */
  getVoltageRange(): Promise<Result<number, Error>>;

  /**
   * Set voltage range in V.
   */
  setVoltageRange(maxVolts: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Slew Rate (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get current slew rate in A/s.
   *
   * Note: Some vendors use A/µs internally. Driver normalizes to A/s.
   */
  getSlewRate(): Promise<Result<number, Error>>;

  /**
   * Set current slew rate in A/s.
   */
  setSlewRate(ampsPerSecond: number): Promise<Result<void, Error>>;

  /**
   * Get rising slew rate in A/s (if separate from falling).
   */
  getRisingSlewRate(): Promise<Result<number, Error>>;

  /**
   * Set rising slew rate in A/s.
   */
  setRisingSlewRate(ampsPerSecond: number): Promise<Result<void, Error>>;

  /**
   * Get falling slew rate in A/s.
   */
  getFallingSlewRate(): Promise<Result<number, Error>>;

  /**
   * Set falling slew rate in A/s.
   */
  setFallingSlewRate(ampsPerSecond: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Over-Voltage Protection (OVP) (NEW)
  // ─────────────────────────────────────────────────────────────

  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  isOvpTripped(): Promise<Result<boolean, Error>>;
  clearOvp(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Over-Current Protection (OCP) (NEW)
  // ─────────────────────────────────────────────────────────────

  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(amps: number): Promise<Result<void, Error>>;
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  isOcpTripped(): Promise<Result<boolean, Error>>;
  clearOcp(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Over-Power Protection (OPP) (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get OPP threshold in W.
   * Returns Err if not supported (e.g., Keysight N3300).
   */
  getOppLevel(): Promise<Result<number, Error>>;
  setOppLevel(watts: number): Promise<Result<void, Error>>;
  getOppEnabled(): Promise<Result<boolean, Error>>;
  setOppEnabled(enabled: boolean): Promise<Result<void, Error>>;
  isOppTripped(): Promise<Result<boolean, Error>>;
  clearOpp(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Voltage Operating Window (Von/Voff) (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get Von threshold - voltage above which load turns on.
   */
  getVonThreshold(): Promise<Result<number, Error>>;

  /**
   * Set Von threshold in V.
   */
  setVonThreshold(volts: number): Promise<Result<void, Error>>;

  /**
   * Get Voff threshold - voltage below which load turns off.
   */
  getVoffThreshold(): Promise<Result<number, Error>>;

  /**
   * Set Voff threshold in V.
   */
  setVoffThreshold(volts: number): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Electronic Load (Comprehensive)
// ─────────────────────────────────────────────────────────────────

/**
 * Electronic load instrument interface.
 */
export interface ElectronicLoad extends BaseInstrument {
  readonly channelCount: number;

  channel(n: number): ElectronicLoadChannel;

  // ─────────────────────────────────────────────────────────────
  // Global Input Control (NEW)
  // ─────────────────────────────────────────────────────────────

  /** Enable all inputs simultaneously */
  enableAllInputs(): Promise<Result<void, Error>>;

  /** Disable all inputs simultaneously */
  disableAllInputs(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // State Save/Recall (NEW)
  // ─────────────────────────────────────────────────────────────

  saveState(slot: number): Promise<Result<void, Error>>;
  recallState(slot: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Protection Clear (NEW)
  // ─────────────────────────────────────────────────────────────

  /** Clear all protection trips */
  clearAllProtection(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // List Mode (existing, move from extended interface)
  // ─────────────────────────────────────────────────────────────

  uploadList(
    channel: number,
    mode: LoadMode,
    steps: ListStep[],
    repeat?: number
  ): Promise<Result<void, Error>>;

  startList(channel: number): Promise<Result<void, Error>>;
  stopList(channel: number): Promise<Result<void, Error>>;
  isListRunning(channel: number): Promise<Result<boolean, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Transient/Dynamic Mode (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Configure transient mode parameters.
   */
  configureTransient(
    channel: number,
    config: TransientConfig
  ): Promise<Result<void, Error>>;

  /**
   * Enable transient mode on channel.
   */
  startTransient(channel: number): Promise<Result<void, Error>>;

  /**
   * Disable transient mode, return to fixed.
   */
  stopTransient(channel: number): Promise<Result<void, Error>>;

  /**
   * Check if transient mode is active.
   */
  isTransientRunning(channel: number): Promise<Result<boolean, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Battery Test (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Configure and start battery discharge test.
   * Returns Err if battery test not supported.
   */
  startBatteryTest(
    channel: number,
    config: BatteryTestConfig
  ): Promise<Result<void, Error>>;

  /**
   * Stop battery test.
   */
  stopBatteryTest(channel: number): Promise<Result<void, Error>>;

  /**
   * Check if battery test is running.
   */
  isBatteryTestRunning(channel: number): Promise<Result<boolean, Error>>;

  /**
   * Get battery test results.
   * Call after test completes to retrieve Ah, Wh, time.
   */
  getBatteryTestResult(channel: number): Promise<Result<BatteryTestResult, Error>>;
}
```

---

## Implementation Phases

### Phase 1: Update Base Interface

**File:** `src/drivers/equipment/electronic-load.ts`

**Changes:**

1. Add constants: `TransientMode`, `BatteryStopCondition`
2. Add types: `TransientConfig`, `BatteryTestConfig`, `BatteryTestResult`
3. Expand `ElectronicLoadChannel`:
   - Short circuit: `getShortEnabled`, `setShortEnabled`
   - Ranges: `getCurrentRange`, `setCurrentRange`, `getVoltageRange`, `setVoltageRange`
   - Slew rate: `getSlewRate`, `setSlewRate`, rising/falling variants
   - Protection: OVP, OCP, OPP (level, enable, tripped, clear)
   - Von/Voff: `getVonThreshold`, `setVonThreshold`, `getVoffThreshold`, `setVoffThreshold`
4. Expand `ElectronicLoad`:
   - `enableAllInputs`, `disableAllInputs`
   - `saveState`, `recallState`
   - `clearAllProtection`
   - Move list mode into base (from `ElectronicLoadWithListMode`)
   - Add transient mode methods
   - Add battery test methods
5. Remove `ElectronicLoadWithListMode` (merge into base)

**Tests:** `src/drivers/equipment/electronic-load.test.ts`

---

### Phase 2: Update DL3021 Driver

**File:** `src/drivers/implementations/rigol/dl3021.ts`

**Add channel properties:**
```typescript
shortEnabled: {
  get: ':INPut:SHORt?',
  set: ':INPut:SHORt {value}',
  parse: parseScpiBool,
  format: formatScpiBool,
},

currentRange: {
  get: ':SOUR:CURR:RANG?',
  set: ':SOUR:CURR:RANG {value}',
  parse: parseScpiNumber,
},

voltageRange: {
  get: ':SOUR:VOLT:RANG?',
  set: ':SOUR:VOLT:RANG {value}',
  parse: parseScpiNumber,
},

slewRate: {
  get: ':SOUR:CURR:SLEW?',
  set: ':SOUR:CURR:SLEW {value}',
  parse: (s) => parseScpiNumber(s) * 1e6,  // A/µs to A/s
  format: (v) => (v / 1e6).toString(),      // A/s to A/µs
},

// OVP
ovpLevel: {
  get: ':SOUR:VOLT:PROT:LEV?',
  set: ':SOUR:VOLT:PROT:LEV {value}',
  parse: parseScpiNumber,
},
ovpEnabled: {
  get: ':SOUR:VOLT:PROT?',
  set: ':SOUR:VOLT:PROT {value}',
  parse: parseScpiBool,
  format: formatScpiBool,
},
ovpTripped: {
  get: ':SOUR:VOLT:PROT:TRIP?',
  parse: parseScpiBool,
  readonly: true,
},

// OCP, OPP similar...

// Von/Voff
vonThreshold: {
  get: ':SOUR:VOLT:ON?',
  set: ':SOUR:VOLT:ON {value}',
  parse: parseScpiNumber,
},
voffThreshold: {
  get: ':SOUR:VOLT:OFF?',
  set: ':SOUR:VOLT:OFF {value}',
  parse: parseScpiNumber,
},
```

**Add methods:**
```typescript
methods: {
  // existing list methods...
  clearOvp: ':SOUR:VOLT:PROT:CLE',
  clearOcp: ':SOUR:CURR:PROT:CLE',
  clearOpp: ':SOUR:POW:PROT:CLE',
  clearAllProtection: ':SOUR:PROT:CLE',

  // transient mode
  configureTransient: async (ctx, channel, config) => { ... },
  startTransient: ':SOUR:FUNC:MODE TRAN',
  stopTransient: ':SOUR:FUNC:MODE FIX',

  // battery test
  startBatteryTest: async (ctx, channel, config) => { ... },
  stopBatteryTest: ':BATT:STOP',
  getBatteryTestResult: async (ctx, channel) => { ... },
}
```

---

### Phase 3: Implement Siglent SDL Driver

**File:** `src/drivers/implementations/siglent/sdl1030x.ts` (new)

**Key differences from Rigol:**
- Uses `:SOURce:SHORt` not `:INPut:SHORt`
- Slew rate in A/µs (same as Rigol)
- LED mode available

**Reference:** `docs/drivers/load/siglent_sdl1000x_scpi_reference.md`

---

### Phase 4: Implement BK Precision Driver

**File:** `src/drivers/implementations/bk-precision/8600.ts` (new)

**Key differences:**
- Commands without colon prefix (`CURR` not `:CURR`)
- List mode uses array format
- CR-LED mode on 8600 series

**Reference:** `docs/drivers/load/bk_precision_8500_8600_scpi_reference.md`

---

### Phase 5: Implement ITECH Driver

**File:** `src/drivers/implementations/itech/it8812.ts` (new)

**Key differences:**
- Slew rate in A/s (not A/µs) - no conversion needed
- Uses `DYNamic` subsystem instead of `TRANsient`
- VRISe mode for OVP testing
- Soft start time setting

**Reference:** `docs/drivers/load/itech_it8500_it8800_scpi_reference.md`

---

### Phase 6: Implement Keysight N3300 Driver

**File:** `src/drivers/implementations/keysight/n3300a.ts` (new)

**Key differences:**
- No CP mode via SCPI
- No OPP
- Channel selection for modular system
- Slew rate in A/s

**Reference:** `docs/drivers/load/keysight_n3300_el342_scpi_reference.md`

---

## Slew Rate Unit Normalization

Different vendors use different units:

| Vendor | Native Unit | Conversion |
|--------|-------------|------------|
| Rigol | A/µs | × 1,000,000 to get A/s |
| Siglent | A/µs | × 1,000,000 to get A/s |
| BK Precision | A/µs | × 1,000,000 to get A/s |
| ITECH | A/s | No conversion |
| Keysight | A/s | No conversion |
| Chroma | varies | Check docs |

**Interface uses A/s** - drivers handle conversion internally.

---

## File Structure After Implementation

```
src/drivers/
├── equipment/
│   ├── electronic-load.ts       # Updated comprehensive interface
│   └── electronic-load.test.ts
├── helpers.ts                    # notSupported, supportsFeature
└── implementations/
    ├── rigol/
    │   ├── dl3021.ts            # Updated
    │   └── dl3021.test.ts
    ├── siglent/
    │   ├── sdl1030x.ts          # New
    │   └── sdl1030x.test.ts
    ├── bk-precision/
    │   ├── 8600.ts              # New
    │   └── 8600.test.ts
    ├── itech/
    │   ├── it8812.ts            # New
    │   └── it8812.test.ts
    └── keysight/
        ├── n3300a.ts            # New
        └── n3300a.test.ts
```

---

## Priority Order

1. **Phase 1** - Update base interface (enables everything else)
2. **Phase 2** - Update DL3021 (validates interface design)
3. **Phase 3** - Siglent SDL (similar to Rigol, validates pattern)
4. **Phase 4** - BK Precision (different command syntax)
5. **Phase 5** - ITECH (different slew units, dynamic subsystem)
6. **Phase 6** - Keysight (validates "not supported" for missing features)

---

## Open Questions

1. **Slew rate asymmetry**: Should we always expose rising/falling separately, or have a single setter that applies to both?

2. **Battery test logging**: Some loads log during test. Should we add `getBatteryTestLog()` returning time-series data?

3. **Transient frequency**: Some vendors use frequency + duty cycle instead of widthA/widthB. Normalize?

4. **Multi-channel loads**: Chroma 63600 is modular. Channel selection pattern?

5. **LED mode**: Include in base or device-specific? Only some vendors support it.

---

## Comparison: Before vs After

### Before
```typescript
interface ElectronicLoadChannel {
  // Mode, setpoints, input, measurements only
  getMode(): Promise<Result<LoadMode, Error>>;
  // ...7 more methods
}

// List mode requires extended interface
interface ElectronicLoadWithListMode extends ElectronicLoad {
  uploadList(...): Promise<Result<boolean, Error>>;
}
```

### After
```typescript
interface ElectronicLoadChannel {
  // Everything in one place
  getMode(): Promise<Result<LoadMode, Error>>;
  // ...setpoints, input, measurements (8 methods)
  // + short circuit (2)
  // + ranges (4)
  // + slew rate (6)
  // + OVP (6)
  // + OCP (6)
  // + OPP (6)
  // + Von/Voff (4)
  // = ~42 methods total
}

interface ElectronicLoad extends BaseInstrument {
  // List mode in base
  // Transient mode in base
  // Battery test in base
  // Save/recall in base
}
```

**Benefit**: One interface to learn. Runtime discovery via error returns.
