# PSU Driver Implementation Plan

> Plan to complete PSU drivers using the comprehensive base interface and granular feature system

## Architecture Overview

### Base Interface Philosophy

The `PowerSupply` and `PowerSupplyChannel` interfaces contain **all standard functionality** that every PSU has. This includes:
- Output enable/disable
- Voltage/current setpoints and measurements
- OVP/OCP (level, enable, trip status, clear)
- Regulation mode query
- Tracking mode (for multi-channel)

### Granular Feature System

Features represent **optional capabilities that vary between models**. They are NOT in the base interface.

**PSU Features** (from `src/drivers/features/psu-features.ts`):
| Feature | Description | Example Models |
|---------|-------------|----------------|
| `ovp` | Over-voltage protection | DP832, E36312A |
| `ocp` | Over-current protection | DP832, E36312A |
| `opp` | Over-power protection | E36312A, HMP4040 |
| `slew` | Voltage/current slew rate | E36312A, HMP4040 |
| `sense` | Remote sensing mode | E36312A, HMP4040 |
| `sequence` | Timer/list sequence | DP832, E36312A |
| `tracking` | Channel tracking modes | DP832, HMP4040 |
| `trigger` | External trigger support | E36312A |
| `datalog` | Internal data logging | E36312A |
| `analyzer` | Output analyzer | Keysight only |

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
| Base interface | Needs update | Add OVP/OCP/tracking to base |
| DP832 driver | Partial | Has OVP/OCP, missing trip/clear |
| WPS300S driver | Complete | Basic PSU, no features |
| Feature types | Complete | `src/drivers/features/psu-features.ts` |

---

## Implementation Phases

### Phase 1: Update Base Interface

**File:** `src/drivers/equipment/power-supply.ts`

Add to `PowerSupplyChannel`:
```typescript
// Regulation mode (all PSUs can report this)
getMode(): Promise<Result<RegulationMode, Error>>;

// Measurements
getMeasuredPower(): Promise<Result<number, Error>>;  // Remove optional

// OVP (standard on all programmable PSUs)
getOvpLevel(): Promise<Result<number, Error>>;
setOvpLevel(volts: number): Promise<Result<void, Error>>;
getOvpEnabled(): Promise<Result<boolean, Error>>;
setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;
isOvpTripped(): Promise<Result<boolean, Error>>;
clearOvp(): Promise<Result<void, Error>>;

// OCP (standard on all programmable PSUs)
getOcpLevel(): Promise<Result<number, Error>>;
setOcpLevel(amps: number): Promise<Result<void, Error>>;
getOcpEnabled(): Promise<Result<boolean, Error>>;
setOcpEnabled(enabled: boolean): Promise<Result<void, Error>>;
isOcpTripped(): Promise<Result<boolean, Error>>;
clearOcp(): Promise<Result<void, Error>>;
```

Add to `PowerSupply`:
```typescript
// Global output control (all multi-channel PSUs)
getAllOutputEnabled(): Promise<Result<boolean, Error>>;
setAllOutputEnabled(enabled: boolean): Promise<Result<void, Error>>;

// Tracking mode (all multi-channel PSUs)
getTrackingMode(): Promise<Result<TrackingMode, Error>>;
setTrackingMode(mode: TrackingMode): Promise<Result<void, Error>>;
```

**Note:** Methods like `clearOvp()` and `clearOcp()` will require the `methods` block in driver specs since they take channel parameters.

---

### Phase 2: Update DP832 Driver

**File:** `src/drivers/implementations/rigol/dp832.ts`

Add missing channel properties:
```typescript
channels: {
  properties: {
    // ... existing ...

    ovpTripped: {
      get: ':OUTPut:OVP:ALAR? CH{ch}',
      parse: parseScpiBool,
      readonly: true,
    },

    ocpTripped: {
      get: ':OUTPut:OCP:ALAR? CH{ch}',
      parse: parseScpiBool,
      readonly: true,
    },
  },
},

// clearOvp/clearOcp require methods since they're channel-specific actions
methods: {
  clearOvp: async (ctx, channel: number) => {
    return ctx.write(`:OUTPut:OVP:CLEar CH${channel}`);
  },
  clearOcp: async (ctx, channel: number) => {
    return ctx.write(`:OUTPut:OCP:CLEar CH${channel}`);
  },
},
```

Update features (already has `['ovp', 'ocp']`).

---

### Phase 3: Handle WPS300S (No OVP/OCP)

**File:** `src/drivers/implementations/matrix/wps300s.ts`

The WPS300S is a basic PSU without OVP/OCP via SCPI. Use `notSupported`:

```typescript
channels: {
  properties: {
    // ... existing ...

    ovpLevel: { notSupported: true, description: 'OVP not available via SCPI' },
    ovpEnabled: { notSupported: true },
    ovpTripped: { notSupported: true },
    ocpLevel: { notSupported: true, description: 'OCP not available via SCPI' },
    ocpEnabled: { notSupported: true },
    ocpTripped: { notSupported: true },
  },
},

methods: {
  clearOvp: async () => Err(new Error('OVP not available via SCPI')),
  clearOcp: async () => Err(new Error('OCP not available via SCPI')),
},
```

---

### Phase 4: Implement Siglent SPD Driver

**File:** `src/drivers/implementations/siglent/spd3303x.ts`

Demonstrates "not supported" pattern for features not available via SCPI.

**Supported:** Output, setpoints, measurements, tracking, timer
**Not Supported:** OVP/OCP (front panel only), slew, sense

```typescript
const spdFeatures = ['tracking', 'sequence'] as const satisfies readonly PsuFeatureId[];

const spdSpec: DriverSpec<SiglentSPD, SiglentSPDChannel, typeof spdFeatures> = {
  features: spdFeatures,
  // ...
};
```

---

### Phase 5: Implement Keysight E36xx Driver

**File:** `src/drivers/implementations/keysight/e36312a.ts`

Full-featured driver with all optional features.

```typescript
const e36Features = ['ovp', 'ocp', 'opp', 'slew', 'sense', 'sequence', 'trigger', 'datalog'] as const satisfies readonly PsuFeatureId[];
```

This driver demonstrates:
- Channel list syntax `(@1,2,3)`
- List mode sequences
- All protection features
- Slew rate control
- Remote sensing

---

## Feature Detection Pattern

Users can check for features at runtime:

```typescript
import { hasOvp, hasSlew } from 'visa-ts/drivers/features';

const psu = await driver.connect(resource);
if (psu.ok) {
  // Compile-time: features array is typed
  console.log(psu.value.features); // readonly ['ovp', 'ocp']

  // Runtime: type guards narrow the type
  if (hasOvp(psu.value)) {
    // TypeScript knows OVP methods are available
    await psu.value.channel(1).setOvpLevel(33);
  }
}
```

---

## File Structure

```
src/drivers/
├── equipment/
│   └── power-supply.ts          # Comprehensive base interface
├── features/
│   └── psu-features.ts          # Feature brands and type guards
└── implementations/
    ├── rigol/
    │   └── dp832.ts             # features: ['ovp', 'ocp']
    ├── matrix/
    │   └── wps300s.ts           # features: [] (basic)
    ├── siglent/
    │   └── spd3303x.ts          # features: ['tracking', 'sequence']
    └── keysight/
        └── e36312a.ts           # features: ['ovp', 'ocp', 'opp', 'slew', ...]
```

---

## Open Questions (Resolved)

1. ~~Should `supportsFeature()` be on the interface?~~ → **No.** Use type guards from feature system.

2. ~~Sequence step units?~~ → Use seconds, drivers normalize.

3. ~~Protection clear scope?~~ → Channel-level via `methods`, matches most devices.

---

## Priority

1. **Phase 1** - Base interface update (unblocks drivers)
2. **Phase 2** - DP832 completion (validates design)
3. **Phase 3** - WPS300S update (validates notSupported pattern)
4. **Phase 4-5** - New drivers (validates full feature system)
