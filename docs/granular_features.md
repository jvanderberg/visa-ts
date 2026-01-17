# Granular Features with Compile-Time Safety

> Design document for type-safe feature detection in instrument drivers

## Problem Statement

Different instruments support different capabilities. A high-end Keysight PSU might support OVP, OCP, slew rate control, and remote sensing, while a budget Siglent PSU might only support basic voltage/current control.

We want:
1. **Compile-time safety** - Calling an unsupported method should be a type error, not a runtime error
2. **Runtime introspection** - UI can check which features a driver supports
3. **Single source of truth** - No duplicate declarations that can get out of sync
4. **Generic functions** - Write functions that require specific features and have TypeScript enforce it

## Solution: Derived Branded Types

The runtime `features` array is the single source of truth. TypeScript derives the compile-time branded types from this array automatically.

### Complete Working Example

```typescript
// ============== Feature Brands ==============
declare const OvpTag: unique symbol;
declare const OcpTag: unique symbol;
declare const SlewTag: unique symbol;

type HasOvp = { readonly [OvpTag]: true };
type HasOcp = { readonly [OcpTag]: true };
type HasSlew = { readonly [SlewTag]: true };

// ============== String → Brand Mapping ==============
type FeatureMap = {
  ovp: HasOvp;
  ocp: HasOcp;
  slew: HasSlew;
};

type FeatureId = keyof FeatureMap;

// ============== Array → Intersection ==============
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never;

type FeaturesFromArray<T extends readonly FeatureId[]> =
  UnionToIntersection<FeatureMap[T[number]]>;

// ============== Conditional Channel Type ==============
interface ChannelBase {
  getVoltage(): number;
  setVoltage(v: number): void;
}

interface OvpMethods {
  getOvpLevel(): number;
  setOvpLevel(v: number): void;
}

interface OcpMethods {
  getOcpLevel(): number;
  setOcpLevel(v: number): void;
}

interface SlewMethods {
  getSlewRate(): number;
  setSlewRate(v: number): void;
}

type Channel<F> =
  ChannelBase
  & (F extends HasOvp ? OvpMethods : unknown)
  & (F extends HasOcp ? OcpMethods : unknown)
  & (F extends HasSlew ? SlewMethods : unknown);

// ============== Driver Definition ==============
interface DriverResult<F> {
  features: readonly FeatureId[];
  channel(n: number): Channel<F>;
}

function defineDriver<const F extends readonly FeatureId[]>(
  spec: { features: F }
): { connect(): DriverResult<FeaturesFromArray<F>> } {
  return {
    connect() {
      return {
        features: spec.features,
        channel(_n: number) {
          return {} as Channel<FeaturesFromArray<F>>;
        }
      };
    }
  };
}

// ============== Usage ==============
const dp832 = defineDriver({
  features: ['ovp', 'ocp'],  // Single source of truth
});

const psu = dp832.connect();
const ch = psu.channel(1);

ch.getVoltage();     // ✓ Compiles - always available
ch.getOvpLevel();    // ✓ Compiles - 'ovp' in features
ch.getOcpLevel();    // ✓ Compiles - 'ocp' in features
ch.getSlewRate();    // ✗ Error: Property 'getSlewRate' does not exist

// Runtime check for UI
if (psu.features.includes('ovp')) {
  // render OVP controls
}
```

### How It Works

1. **`const F` generic parameter** (TypeScript 5.0+) preserves the literal tuple type `['ovp', 'ocp']` instead of widening to `string[]`

2. **`FeatureMap`** maps string literals to branded types:
   - `'ovp'` → `HasOvp`
   - `'ocp'` → `HasOcp`

3. **`FeaturesFromArray<T>`** converts the array to an intersection of brands:
   - `['ovp', 'ocp']` → `HasOvp & HasOcp`

4. **Conditional types** include methods only when the brand is present:
   - `F extends HasOvp ? OvpMethods : unknown`

---

## How Conditional Types Work

When `F extends HasOvp` is true, the intersection includes `OvpMethods`. When false, it intersects with `unknown` (which is the identity for intersection - `T & unknown = T`).

```typescript
// If F = HasOvp & HasOcp:
Channel<HasOvp & HasOcp>
  = ChannelBase
  & OvpMethods      // HasOvp & HasOcp extends HasOvp? YES
  & OcpMethods      // HasOvp & HasOcp extends HasOcp? YES
  & unknown         // HasOvp & HasOcp extends HasSlew? NO
  = ChannelBase & OvpMethods & OcpMethods
```

---

## Spec Enforcement: Required Properties

Features also enforce that the driver spec includes the corresponding properties. If you declare `features: ['ovp']`, TypeScript requires the spec to have `ovpLevel`, `ovpEnabled`, etc.

### Property Requirements Mapping

```typescript
// Map each feature to its required property keys
type FeatureProperties = {
  ovp: 'ovpLevel' | 'ovpEnabled';
  ocp: 'ocpLevel' | 'ocpEnabled';
  slew: 'slewRate';
};

// Base properties always required
type BaseProperties = 'voltage' | 'current';

// Compute all required properties from features array
type RequiredProps<F extends readonly FeatureId[]> =
  BaseProperties | FeatureProperties[F[number]];
```

### How It Works

Given `features: ['ovp', 'ocp']`:

```typescript
// Step 1: F[number] extracts union of array elements
F[number] = 'ovp' | 'ocp'

// Step 2: Index into FeatureProperties with that union
FeatureProperties['ovp' | 'ocp']
  = FeatureProperties['ovp'] | FeatureProperties['ocp']
  = ('ovpLevel' | 'ovpEnabled') | ('ocpLevel' | 'ocpEnabled')

// Step 3: Combine with base properties
RequiredProps<['ovp', 'ocp']>
  = 'voltage' | 'current' | 'ovpLevel' | 'ovpEnabled' | 'ocpLevel' | 'ocpEnabled'
```

### Enforcing in defineDriver

```typescript
function defineDriver<const F extends readonly FeatureId[]>(
  spec: {
    features: F;
    properties: Record<RequiredProps<F>, PropertyDef>;
  }
)
```

`Record<K, V>` requires an object with exactly those keys, so:

```typescript
// ✓ Compiles - all required properties present
defineDriver({
  features: ['ovp', 'ocp'],
  properties: {
    voltage: { get: 'VOLT?' },
    current: { get: 'CURR?' },
    ovpLevel: { get: 'OVP:LEV?' },
    ovpEnabled: { get: 'OVP:ENAB?' },
    ocpLevel: { get: 'OCP:LEV?' },
    ocpEnabled: { get: 'OCP:ENAB?' },
  },
});

// ✗ Error: missing properties 'ocpLevel', 'ocpEnabled'
defineDriver({
  features: ['ovp', 'ocp'],
  properties: {
    voltage: { get: 'VOLT?' },
    current: { get: 'CURR?' },
    ovpLevel: { get: 'OVP:LEV?' },
    ovpEnabled: { get: 'OVP:ENAB?' },
    // forgot OCP properties!
  },
});

// ✗ Error: 'ovpEnabeld' does not exist. Did you mean 'ovpEnabled'?
defineDriver({
  features: ['ovp'],
  properties: {
    voltage: { get: 'VOLT?' },
    current: { get: 'CURR?' },
    ovpLevel: { get: 'OVP:LEV?' },
    ovpEnabeld: { get: 'OVP:ENAB?' },  // typo!
  },
});

// ✓ Compiles - no features = only base properties required
defineDriver({
  features: [],
  properties: {
    voltage: { get: 'VOLT?' },
    current: { get: 'CURR?' },
  },
});
```

### Bidirectional Safety

This gives us enforcement in both directions:

| Direction | What's Checked | Error Example |
|-----------|----------------|---------------|
| **Usage → Features** | Calling methods that don't exist | `ch.getSlewRate()` errors if `'slew'` not in features |
| **Features → Spec** | Missing required properties | Declaring `'ocp'` errors if `ocpLevel` not in properties |

---

## Runtime Feature Checking for UI

A UI component can dynamically show/hide controls based on features:

```typescript
function PowerSupplyPanel({ psu }: { psu: ConnectedPowerSupply }) {
  const ch = psu.channel(1);

  return (
    <div>
      {/* Always shown */}
      <VoltageControl channel={ch} />
      <CurrentControl channel={ch} />

      {/* Conditionally shown based on features */}
      {psu.features.includes('ovp') && <OvpControls channel={ch} />}
      {psu.features.includes('ocp') && <OcpControls channel={ch} />}
      {psu.features.includes('slew') && <SlewControls channel={ch} />}
    </div>
  );
}
```

The UI components are pre-built - they just need a boolean to know whether to render.

---

## Generic Functions with Feature Constraints

Write functions that require specific features:

```typescript
/**
 * Configure protection limits on a channel.
 * Only callable with channels that support OVP and OCP.
 */
async function configureProtection<F extends HasOvp & HasOcp>(
  ch: Channel<F>,
  ovpLimit: number,
  ocpLimit: number
): Promise<void> {
  await ch.setOvpLevel(ovpLimit);
  await ch.setOcpLevel(ocpLimit);
}

// Usage:
const dp832Ch = psu.channel(1);  // Channel<HasOvp & HasOcp>
await configureProtection(dp832Ch, 5.5, 1.1);  // ✓ Compiles

const basicCh = basicPsu.channel(1);  // Channel<unknown>
await configureProtection(basicCh, 5.5, 1.1);
// ✗ Error: Type 'unknown' does not satisfy constraint 'HasOvp & HasOcp'
```

---

## Feature Definitions by Equipment Type

### Power Supply Features

| Feature | String | Brand | Description |
|---------|--------|-------|-------------|
| OVP | `'ovp'` | `HasOvp` | Over-voltage protection with level, enable, trip status, clear |
| OCP | `'ocp'` | `HasOcp` | Over-current protection with level, enable, trip status, clear |
| Slew | `'slew'` | `HasSlew` | Voltage/current slew rate control |
| Sense | `'sense'` | `HasSense` | Remote sensing (2-wire vs 4-wire) |
| Sequence | `'sequence'` | `HasSequence` | Programmable output sequences/lists |
| Tracking | `'tracking'` | `HasTracking` | Channel tracking modes (series/parallel) |

### Electronic Load Features

| Feature | String | Brand | Description |
|---------|--------|-------|-------------|
| CC Mode | `'cc'` | `HasCC` | Constant current mode |
| CV Mode | `'cv'` | `HasCV` | Constant voltage mode |
| CR Mode | `'cr'` | `HasCR` | Constant resistance mode |
| CP Mode | `'cp'` | `HasCP` | Constant power mode |
| Dynamic | `'dynamic'` | `HasDynamic` | Dynamic/transient loading |
| Slew | `'slew'` | `HasSlew` | Current slew rate control |
| OCP | `'ocp'` | `HasOcp` | Over-current protection |
| OPP | `'opp'` | `HasOpp` | Over-power protection |
| Battery | `'battery'` | `HasBattery` | Battery discharge testing |
| List | `'list'` | `HasList` | List/sequence mode |
| Short | `'short'` | `HasShort` | Electronic short circuit mode |

### Oscilloscope Features

| Feature | String | Brand | Description |
|---------|--------|-------|-------------|
| FFT | `'fft'` | `HasFFT` | FFT/spectrum analysis |
| Decode | `'decode'` | `HasDecode` | Protocol decoding (I2C, SPI, UART, etc.) |
| Mask | `'mask'` | `HasMask` | Mask testing |
| Histogram | `'histogram'` | `HasHistogram` | Histogram analysis |
| Segmented | `'segmented'` | `HasSegmented` | Segmented memory acquisition |
| WaveGen | `'wavegen'` | `HasWaveGen` | Built-in waveform generator |
| Power | `'power'` | `HasPower` | Power analysis measurements |
| Jitter | `'jitter'` | `HasJitter` | Jitter analysis |

---

## Benefits

1. **Single Source of Truth** - Features declared once in the runtime array
2. **Compile-Time Errors** - Catch unsupported method calls before running any code
3. **Runtime Introspection** - UI can check `features.includes('ovp')`
4. **IDE Support** - Autocomplete only shows available methods
5. **Zero Runtime Cost** - Branded types are erased at compile time
6. **Composable** - Generic functions can require feature combinations

---

## Implementation Checklist

- [ ] Create `src/drivers/features.ts` with:
  - [ ] Feature tags (`HasOvp`, `HasOcp`, etc.)
  - [ ] `FeatureMap` (string → brand mapping)
  - [ ] `FeatureProperties` (feature → required property keys)
  - [ ] `FeaturesFromArray<T>` utility type
  - [ ] `RequiredProps<F>` utility type
- [ ] Modify `defineDriver` to use `const F` generic and derive features
- [ ] Update `PowerSupplyChannel` to use conditional types
- [ ] Update `ElectronicLoadChannel` to use conditional types
- [ ] Update `OscilloscopeChannel` to use conditional types
- [ ] Add feature arrays to existing drivers (DP832, DL3021, DS1054Z)
- [ ] Add type tests to verify:
  - [ ] Methods don't exist when feature not declared
  - [ ] Properties required when feature declared
  - [ ] Typos in property names caught
