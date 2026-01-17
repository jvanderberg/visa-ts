# Electronic Load Driver Implementation Plan

> Plan to complete electronic load drivers using the comprehensive base interface and granular feature system

## Architecture Overview

### Base Interface Philosophy

The `ElectronicLoad` and `ElectronicLoadChannel` interfaces contain **all standard functionality** that every electronic load has. This includes:
- Mode (CC/CV/CR/CP)
- Setpoints (current, voltage, resistance, power)
- Input enable/disable
- Measurements (V/I/P/R)
- List mode (upload, start, stop)

### Granular Feature System

Features represent **optional capabilities that vary between models**. They are NOT in the base interface.

**Load Features** (from `src/drivers/features/load-features.ts`):
| Feature | Description | Example Models |
|---------|-------------|----------------|
| `cp` | Constant Power mode | DL3021, SDL1030X |
| `battery` | Battery discharge test | DL3021, IT8800 |
| `led` | LED test mode | DL3021 (future), SDL1030X |
| `short` | Short circuit mode | DL3021, SDL1030X |
| `opp` | Over-power protection | DL3021, SDL1030X |
| `ocpTest` | OCP test mode | IT8800 |
| `oppTest` | OPP test mode | IT8800 |
| `crcc` | CR+CC mode | Chroma 63600 |

### Type-Enforced Methods

The `DriverSpec` type now enforces that all interface methods are implemented:
- **Properties** → generates getters/setters automatically
- **Commands** → generates no-arg void methods automatically
- **Methods** → required for anything else (complex operations)

If the interface declares a method that isn't a getter/setter/command, `methods` in the spec is **required**.

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Base interface | Complete | List mode in base |
| DL3021 driver | Complete | Implements base interface |
| Feature types | Complete | `src/drivers/features/load-features.ts` |

---

## Implementation Phases

### Phase 1: Expand Base Interface

**File:** `src/drivers/equipment/electronic-load.ts`

Add to `ElectronicLoadChannel`:
```typescript
// Ranges (all loads have selectable ranges)
getCurrentRange(): Promise<Result<number, Error>>;
setCurrentRange(maxAmps: number): Promise<Result<void, Error>>;
getVoltageRange(): Promise<Result<number, Error>>;
setVoltageRange(maxVolts: number): Promise<Result<void, Error>>;

// Slew rate (standard on all programmable loads)
getSlewRate(): Promise<Result<number, Error>>;
setSlewRate(ampsPerSecond: number): Promise<Result<void, Error>>;

// Protection (standard on all loads)
getOvpLevel(): Promise<Result<number, Error>>;
setOvpLevel(volts: number): Promise<Result<void, Error>>;
getOvpEnabled(): Promise<Result<boolean, Error>>;
setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;
isOvpTripped(): Promise<Result<boolean, Error>>;
clearOvp(): Promise<Result<void, Error>>;

getOcpLevel(): Promise<Result<number, Error>>;
setOcpLevel(amps: number): Promise<Result<void, Error>>;
getOcpEnabled(): Promise<Result<boolean, Error>>;
setOcpEnabled(enabled: boolean): Promise<Result<void, Error>>;
isOcpTripped(): Promise<Result<boolean, Error>>;
clearOcp(): Promise<Result<void, Error>>;

// Von/Voff (operating voltage window)
getVonThreshold(): Promise<Result<number, Error>>;
setVonThreshold(volts: number): Promise<Result<void, Error>>;
getVoffThreshold(): Promise<Result<number, Error>>;
setVoffThreshold(volts: number): Promise<Result<void, Error>>;
```

Add to `ElectronicLoad`:
```typescript
// Global input control (all multi-channel loads)
enableAllInputs(): Promise<Result<void, Error>>;
disableAllInputs(): Promise<Result<void, Error>>;

// State save/recall (universal *SAV/*RCL)
saveState(slot: number): Promise<Result<void, Error>>;
recallState(slot: number): Promise<Result<void, Error>>;

// Protection clear
clearAllProtection(): Promise<Result<void, Error>>;
```

**Note:** Methods like `clearOvp()` and `clearOcp()` will require the `methods` block in driver specs since they take channel parameters.

---

### Phase 2: Update DL3021 Driver

**File:** `src/drivers/implementations/rigol/dl3021.ts`

Add missing channel properties:
```typescript
channels: {
  properties: {
    // ... existing ...

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

    // OCP similar...

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
  },
},

// clearOvp/clearOcp require methods since they're channel-specific actions
methods: {
  // existing list methods...
  uploadList: async (ctx, mode, steps, repeat) => uploadList(ctx, mode, steps, repeat),
  startList: (ctx, options) => startList(ctx, options),
  stopList: (ctx, options) => stopList(ctx, options),

  // protection clear
  clearOvp: async (ctx, channel: number) => {
    return ctx.write(`:SOUR:VOLT:PROT:CLE`);
  },
  clearOcp: async (ctx, channel: number) => {
    return ctx.write(`:SOUR:CURR:PROT:CLE`);
  },
},
```

---

### Phase 3: Implement Siglent SDL Driver

**File:** `src/drivers/implementations/siglent/sdl1030x.ts`

Demonstrates feature system for loads with additional capabilities.

**Supported:** CC/CV/CR/CP, measurements, list mode, short circuit, LED mode
**Features:** `['cp', 'short', 'led', 'opp']`

```typescript
const sdlFeatures = ['cp', 'short', 'led', 'opp'] as const satisfies readonly LoadFeatureId[];

const sdlSpec: DriverSpec<SiglentSDL, SiglentSDLChannel, typeof sdlFeatures> = {
  features: sdlFeatures,
  // ...
};
```

**Key differences from Rigol:**
- Uses `:SOURce:SHORt` not `:INPut:SHORt`
- Slew rate in A/µs (same as Rigol)
- LED mode available

**Reference:** `docs/drivers/load/siglent_sdl1000x_scpi_reference.md`

---

### Phase 4: Implement BK Precision Driver

**File:** `src/drivers/implementations/bk-precision/8600.ts`

**Features:** `['cp', 'short', 'led']` (8600 series has LED mode)

**Key differences:**
- Commands without colon prefix (`CURR` not `:CURR`)
- List mode uses array format
- CR-LED mode on 8600 series

**Reference:** `docs/drivers/load/bk_precision_8500_8600_scpi_reference.md`

---

### Phase 5: Implement ITECH Driver

**File:** `src/drivers/implementations/itech/it8812.ts`

**Features:** `['cp', 'battery', 'ocpTest', 'oppTest']`

**Key differences:**
- Slew rate in A/s (not A/µs) - no conversion needed
- Uses `DYNamic` subsystem instead of `TRANsient`
- VRISe mode for OVP testing
- Soft start time setting

**Reference:** `docs/drivers/load/itech_it8500_it8800_scpi_reference.md`

---

### Phase 6: Implement Keysight N3300 Driver

**File:** `src/drivers/implementations/keysight/n3300a.ts`

**Features:** `[]` (basic load without advanced features)

Demonstrates `notSupported` pattern for features not available:
- No CP mode via SCPI
- No OPP

```typescript
channels: {
  properties: {
    // ... existing ...

    // CP mode not available
    power: { notSupported: true, description: 'CP mode not available via SCPI' },
  },
},
```

**Reference:** `docs/drivers/load/keysight_n3300_el342_scpi_reference.md`

---

## Feature Detection Pattern

Users can check for features at runtime:

```typescript
import { hasCp, hasShort, hasBattery } from 'visa-ts/drivers/features';

const load = await driver.connect(resource);
if (load.ok) {
  // Compile-time: features array is typed
  console.log(load.value.features); // readonly ['cp', 'short', 'led', 'opp']

  // Runtime: type guards narrow the type
  if (hasCp(load.value)) {
    // TypeScript knows CP mode methods are available
    await load.value.channel(1).setPower(100);
  }

  if (hasBattery(load.value)) {
    // Battery test methods available
    await load.value.startBatteryTest(1, { current: 2, stopCondition: 'VOLTAGE', stopValue: 10 });
  }
}
```

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

## File Structure

```
src/drivers/
├── equipment/
│   └── electronic-load.ts          # Comprehensive base interface
├── features/
│   └── load-features.ts            # Feature brands and type guards
└── implementations/
    ├── rigol/
    │   └── dl3021.ts               # features: [] (basic)
    ├── siglent/
    │   └── sdl1030x.ts             # features: ['cp', 'short', 'led', 'opp']
    ├── bk-precision/
    │   └── 8600.ts                 # features: ['cp', 'short', 'led']
    ├── itech/
    │   └── it8812.ts               # features: ['cp', 'battery', 'ocpTest', 'oppTest']
    └── keysight/
        └── n3300a.ts               # features: [] (basic, notSupported for CP)
```

---

## Open Questions (Resolved)

1. ~~Should `supportsFeature()` be on the interface?~~ → **No.** Use type guards from feature system.

2. ~~Slew rate asymmetry?~~ → Use single `slewRate` property, drivers that support asymmetric rates can add `risingSlewRate`/`fallingSlewRate` as features.

3. ~~Battery test in base?~~ → **No.** Battery test is a feature (`battery`), not standard on all loads.

4. ~~LED mode in base?~~ → **No.** LED mode is a feature (`led`), specialized for LED testing.

5. ~~Transient/Dynamic mode?~~ → Defer. Complex and vendor-specific, can be added as feature later.

---

## Priority

1. **Phase 1** - Base interface update (unblocks drivers)
2. **Phase 2** - DL3021 completion (validates design)
3. **Phase 3** - Siglent SDL (validates feature pattern)
4. **Phase 4-6** - Additional drivers (validates full feature system)
