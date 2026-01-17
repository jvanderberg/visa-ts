# Driver Abstraction Plan

This document outlines the design for adding a driver abstraction layer to visa-ts that provides typed APIs for specific instruments, abstracting away raw SCPI commands and hardware quirks.

## Goals

1. **Typed APIs** - Users interact with instrument properties and methods, not SCPI strings
2. **Declarative where possible** - Most drivers defined via configuration, not code
3. **Escape hatches** - Hooks and custom methods for complex interactions
4. **Extensible types** - Users can define new equipment types for unusual hardware
5. **Explicit async** - No hidden async behind sync-looking APIs; all operations return `Result<T, Error>`
6. **Unified channel model** - Single types handle both single and multi-channel instruments
7. **Comprehensive base interfaces** - Base types contain all standard functionality
8. **Granular features** - Optional capabilities tracked via branded types and runtime type guards

## Architecture

```
User Code
    ↓
Driver (typed : scope.setTimebase(1e-3))
    ↓
MessageBasedResource (SCPI: :TIMebase:SCALe 1e-3)
    ↓
Transport (USB-TMC, Serial, TCP/IP, Simulation)
    ↓
Hardware
```

## Core Design Decisions

### 1. Base Interface Philosophy

Base interfaces contain **all standard functionality** that every device of that type has. This includes everything a typical programmable instrument supports.

```typescript
// Base interface has ALL standard methods
interface PowerSupply extends BaseInstrument {
  readonly channelCount: number;
  channel(n: number): PowerSupplyChannel;

  // Global controls (standard on all multi-channel PSUs)
  getAllOutputEnabled(): Promise<Result<boolean, Error>>;
  setAllOutputEnabled(enabled: boolean): Promise<Result<void, Error>>;

  // Tracking mode (standard on all multi-channel PSUs)
  getTrackingMode(): Promise<Result<TrackingMode, Error>>;
  setTrackingMode(mode: TrackingMode): Promise<Result<void, Error>>;
}

interface PowerSupplyChannel {
  // Output control
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // Setpoints and measurements
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  // ... more standard methods

  // Protection (standard on all programmable PSUs)
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;
  isOvpTripped(): Promise<Result<boolean, Error>>;
  clearOvp(): Promise<Result<void, Error>>;
  // ... OCP similar
}
```

Devices that don't support a standard feature use `notSupported`:

```typescript
channels: {
  properties: {
    ovpLevel: { notSupported: true, description: 'OVP not available via SCPI' },
    ovpEnabled: { notSupported: true },
    ovpTripped: { notSupported: true },
  },
},
methods: {
  clearOvp: async () => Err(new Error('OVP not available via SCPI')),
},
```

### 2. Granular Feature System

Features represent **optional capabilities that vary between models**. They are NOT in the base interface - features are truly optional extras.

**PSU Features:**
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

**Load Features:**
| Feature | Description | Example Models |
|---------|-------------|----------------|
| `cp` | Constant Power mode | DL3021, SDL1030X |
| `battery` | Battery discharge test | DL3021, IT8800 |
| `led` | LED test mode | SDL1030X |
| `short` | Short circuit mode | DL3021, SDL1030X |
| `opp` | Over-power protection | DL3021, SDL1030X |
| `ocpTest` | OCP test mode | IT8800 |
| `oppTest` | OPP test mode | IT8800 |
| `crcc` | CR+CC mode | Chroma 63600 |

**Oscilloscope Features:**
| Feature | Description | Example Models |
|---------|-------------|----------------|
| `decode` | Serial protocol decode | SDS1104X-U, DS1054Z (option) |
| `digital` | Digital/logic channels | MSO series |
| `mask` | Mask/limit testing | Higher-end scopes |
| `histogram` | Waveform histogram | Higher-end scopes |
| `segmented` | Segmented memory | SDS, Keysight, R&S |
| `wavegen` | Built-in waveform generator | DS1054Z (option), SDS1104X-U |
| `search` | Waveform search/navigation | Higher-end scopes |
| `bode` | Bode plot analysis | SDS with wavegen |
| `power` | Power analysis | Specialized options |
| `jitter` | Jitter analysis | Higher-end scopes |

#### Feature Declaration

Drivers declare their features with compile-time type safety:

```typescript
import type { PsuFeatureId } from '../../features/psu-features.js';

const dp832Features = ['ovp', 'ocp'] as const satisfies readonly PsuFeatureId[];

const dp832Spec: DriverSpec<DP832, DP832Channel, typeof dp832Features> = {
  features: dp832Features,
  // ...
};
```

Invalid features are caught at compile time:
```typescript
// Type error: '"invalid_feature"' is not assignable to type 'PsuFeatureId'
const badFeatures = ['ovp', 'invalid_feature'] as const satisfies readonly PsuFeatureId[];
```

#### Feature Detection at Runtime

Users check for features using type guards:

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

  if (hasSlew(psu.value)) {
    // Slew rate control available
    await psu.value.channel(1).setSlewRate(1.0);
  }
}
```

### 3. Type-Enforced Methods

The `DriverSpec` type enforces that all interface methods are implemented:

- **Properties** → generates getters/setters automatically
- **Commands** → generates no-arg void methods automatically
- **Methods** → required for anything else (complex operations)

If the interface declares a method that isn't a getter/setter/command, `methods` in the spec is **required**.

```typescript
// Interface declares list mode methods
interface ElectronicLoad extends BaseInstrument {
  uploadList(mode: LoadMode, steps: ListStep[], repeat?: number): Promise<Result<boolean, Error>>;
  startList(options?: ListModeOptions): Promise<Result<boolean, Error>>;
  stopList(options?: ListModeOptions): Promise<Result<boolean, Error>>;
}

// Driver spec MUST include methods block (enforced by types)
const dl3021Spec: DriverSpec<DL3021Load, DL3021Channel> = {
  // properties and commands generate getters/setters/commands...

  // Required because interface has uploadList, startList, stopList
  methods: {
    uploadList: async (ctx, mode, steps, repeat) => { /* ... */ },
    startList: (ctx, options) => { /* ... */ },
    stopList: (ctx, options) => { /* ... */ },
  },
};
```

The type system extracts method names that need implementation:

```typescript
// Methods that need implementation (not getters/setters/commands/base members)
type IsCustomMethod<K, M> = IsFunction<M> extends false
  ? never
  : K extends `get${string}` | `set${string}`
    ? never
    : K extends AllBaseMembers
      ? never
      : M extends () => Promise<Result<void, Error>>
        ? never  // Commands are covered by commands block
        : K;

// Required methods in driver spec
type DriverMethods<T> = [keyof ExtractMethodNames<T>] extends [never]
  ? { methods?: never }
  : { methods: TypedMethodMap<T> };
```

### 4. Driver Carries Its Type

The driver definition specifies its return type. No auto-detection magic that loses type information.

```typescript
// Driver definition knows its own return type
const rigolDS1054Z = defineDriver<RigolOscilloscope>({
  type: 'oscilloscope',
  manufacturer: 'Rigol',
  models: ['DS1054Z', 'DS1104Z-Plus'],
  properties: { /* ... */ },
  commands: { /* ... */ },
});

// connect() returns the type the driver was defined with
const scope = await rigolDS1054Z.connect(resource);
// TypeScript knows: scope is RigolOscilloscope
```

### 5. Explicit Async with Result Types

All operations are explicitly async and return `Result<T, Error>`:

```typescript
// Getters/setters are explicit async methods
const tb = await scope.getTimebase();
if (!tb.ok) {
  console.error('Failed to read timebase:', tb.error);
  return;
}
console.log('Timebase:', tb.value);

await scope.setTimebase(1e-3);

// Batch operations for efficiency
await scope.set({ timebase: 1e-3, triggerLevel: 0.5 });
const state = await scope.get(['timebase', 'triggerLevel']);
```

### 6. Hybrid Declarative + Hooks

```typescript
interface DriverSpec<T, TChannel = never, TFeatures extends readonly string[] = readonly string[]> {
  // Metadata
  type?: string;                    // Equipment category (optional)
  manufacturer?: string;
  models?: string[];

  // Feature declaration
  features?: TFeatures;             // Optional capabilities this driver has

  // Declarative definitions
  properties: PropertyMap;          // get/set properties
  commands?: CommandMap;            // fire-and-forget commands

  // Channel configuration
  channels?: ChannelSpec;           // Indexed channel definitions

  // Lifecycle hooks
  hooks?: {
    onConnect?(ctx: DriverContext): Promise<Result<void, Error>>;
    onDisconnect?(ctx: DriverContext): Promise<Result<void, Error>>;
  };

  // Custom methods (required if interface declares them)
  methods?: MethodMap<T>;

  // Hardware quirks
  settings?: SettingsConfig;
}
```

### 7. Raw Escape Hatch

Users can always access the underlying resource:

```typescript
const scope = await rigolDS1054Z.connect(resource);

// Use typed
await scope.setTimebase(1e-3);

// Escape to raw SCPI when needed
const raw = scope.resource;
await raw.query(':CUSTOM:VENDOR:CMD?');
```

---

## Unified Channel System

All multi-channel equipment uses a consistent channel access pattern. The base types always support multiple channels - single-channel devices simply have `channelCount = 1`.

### Channel Access Pattern

```typescript
// All channelized equipment exposes:
interface ChannelizedInstrument {
  readonly channelCount: number;              // How many channels this instrument has
  channel(n: number): Channel;             // Access a specific channel (1-indexed)
}

// Channel accessor validates bounds and returns typed channel
const ch1 = psu.channel(1);  // Returns PowerSupplyChannel
const ch2 = psu.channel(2);  // Returns PowerSupplyChannel (or error if channelCount < 2)
```

### Driver Channel Declaration

Drivers declare their channel count, and the runtime enforces bounds:

```typescript
const rigolDP832 = defineDriver<PowerSupply>({
  manufacturer: 'Rigol',
  models: ['DP832', 'DP832A'],
  features: ['ovp', 'ocp'] as const,

  channels: {
    count: 3,                    // This PSU has 3 channels
    indexStart: 1,               // SCPI uses 1-based indexing (default)

    properties: {
      voltage: {
        get: ':SOUR{ch}:VOLT?',
        set: ':SOUR{ch}:VOLT {value}',
        parse: parseScpiNumber,
      },
      current: {
        get: ':SOUR{ch}:CURR?',
        set: ':SOUR{ch}:CURR {value}',
        parse: parseScpiNumber,
      },
      outputEnabled: {
        get: ':OUTP:STAT? CH{ch}',
        set: ':OUTP:STAT CH{ch},{value}',
        parse: parseScpiBool,
        format: (v) => v ? 'ON' : 'OFF',
      },
    },
  },

  // Global properties (not per-channel)
  properties: {
    allOutputEnabled: {
      get: ':OUTP:ALL:STAT?',
      set: ':OUTP:ALL:STAT {value}',
      parse: parseScpiBool,
    },
  },
});
```

---

## Property Definition

```typescript
interface PropertyDef<T> {
  // SCPI commands (use {value} placeholder for setter, {ch} for channel)
  get: string;                      // e.g., ':TIMebase:SCALe?'
  set?: string;                     // e.g., ':TIMebase:SCALe {value}'

  // Type conversion
  parse?: (response: string) => T;  // SCPI response -> value
  format?: (value: T) => string;    // value -> SCPI parameter

  // Validation
  validate?: (value: T) => boolean | string;  // return error message or false

  // Metadata
  readonly?: boolean;
  description?: string;
  unit?: string;                    // For documentation: 'V', 'A', 'Hz', 's', etc.

  // Not supported marker
  notSupported?: boolean;           // Returns Err("Feature not supported")
}
```

---

## File Structure

```
src/drivers/
├── index.ts                    # Public exports
├── types.ts                    # DriverSpec, PropertyDef, ChannelSpec, etc.
├── define-driver.ts            # defineDriver<T>() factory function
├── context.ts                  # DriverContext for hooks/methods
├── parsers.ts                  # SCPI value parsers
├── equipment/
│   ├── index.ts                # Equipment type exports
│   ├── base.ts                 # BaseInstrument
│   ├── oscilloscope.ts         # Oscilloscope (comprehensive)
│   ├── power-supply.ts         # PowerSupply (comprehensive)
│   ├── multimeter.ts           # Multimeter
│   ├── electronic-load.ts      # ElectronicLoad (comprehensive)
│   └── ...                     # Other equipment types
├── features/
│   ├── index.ts                # Feature exports
│   ├── psu-features.ts         # PSU feature brands and type guards
│   ├── load-features.ts        # Load feature brands and type guards
│   └── osc-features.ts         # Oscilloscope feature brands and type guards
└── implementations/
    ├── rigol/
    │   ├── dp832.ts            # features: ['ovp', 'ocp']
    │   ├── dl3021.ts           # features: []
    │   ├── ds1054z.ts          # features: []
    │   └── scope.ts            # Generic Rigol scope driver
    ├── matrix/
    │   └── wps300s.ts          # features: [] (basic)
    ├── siglent/
    │   └── ...                 # Siglent implementations
    └── keysight/
        └── ...                 # Keysight implementations
```

---

## Usage Examples

### Basic Usage

```typescript
import { createResourceManager } from 'visa-ts';
import { rigolDS1054Z } from 'visa-ts/drivers/implementations/rigol/ds1054z';

const rm = createResourceManager();
const resource = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
if (!resource.ok) throw resource.error;

const scope = await rigolDS1054Z.connect(resource.value);
if (!scope.ok) throw scope.error;

// Typed  - IDE autocomplete, compile-time checks
await scope.value.setTimebase(1e-3);
await scope.value.channel(1).setEnabled(true);
await scope.value.channel(1).setScale(0.5);
await scope.value.run();

const waveform = await scope.value.captureWaveform(1);
if (waveform.ok) {
  console.log('Points:', waveform.value.points.length);
}

await scope.value.close();
```

### Feature Detection

```typescript
import { rigolDP832 } from 'visa-ts/drivers/implementations/rigol/dp832';
import { hasOvp, hasOcp, hasSlew } from 'visa-ts/drivers/features';

const psu = await rigolDP832.connect(resource.value);
if (!psu.ok) throw psu.error;

// Features array is typed at compile time
console.log('Features:', psu.value.features); // ['ovp', 'ocp']

// Runtime type guards
if (hasOvp(psu.value)) {
  // OVP is available
  await psu.value.channel(1).setOvpLevel(35);
  await psu.value.channel(1).setOvpEnabled(true);
}

if (hasSlew(psu.value)) {
  // This won't execute - DP832 doesn't have slew
  await psu.value.channel(1).setSlewRate(1.0);
}
```

### Multi-Channel Power Supply

```typescript
import { rigolDP832 } from 'visa-ts/drivers/implementations/rigol/dp832';

const psu = await rigolDP832.connect(resource.value);
if (!psu.ok) throw psu.error;

console.log(`PSU has ${psu.value.channelCount} channels`);

// Configure each channel
await psu.value.channel(1).setVoltage(3.3);
await psu.value.channel(1).setCurrent(0.5);
await psu.value.channel(2).setVoltage(5.0);
await psu.value.channel(2).setCurrent(1.0);
await psu.value.channel(3).setVoltage(12.0);
await psu.value.channel(3).setCurrent(0.3);

// Enable all outputs at once
await psu.value.setAllOutputEnabled(true);

// Measure
const v1 = await psu.value.channel(1).getMeasuredVoltage();
const i1 = await psu.value.channel(1).getMeasuredCurrent();
console.log(`CH1: ${v1.value}V @ ${i1.value}A`);
```

### Electronic Load with List Mode

```typescript
import { rigolDL3021 } from 'visa-ts/drivers/implementations/rigol/dl3021';
import { LoadMode } from 'visa-ts/drivers/equipment';

const load = await rigolDL3021.connect(resource.value);
if (!load.ok) throw load.error;

const ch = load.value.channel(1);

// Set CC mode at 2A
await ch.setMode(LoadMode.ConstantCurrent);
await ch.setCurrent(2.0);
await ch.setInputEnabled(true);

// Measure
const v = await ch.getMeasuredVoltage();
const i = await ch.getMeasuredCurrent();
const p = await ch.getMeasuredPower();

// List mode (standard on all loads)
await load.value.uploadList(LoadMode.ConstantCurrent, [
  { value: 1.0, duration: 1.0 },
  { value: 2.0, duration: 0.5 },
  { value: 0.5, duration: 2.0 },
], 10);  // Repeat 10 times
await load.value.startList();
```

---

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- [x] `DriverSpec` and related types
- [x] `defineDriver<T>()` factory function
- [x] `DriverContext` for hooks and methods
- [x] Channel accessor implementation with bounds checking
- [x] Property get/set code generation
- [x] Command code generation
- [x] Type-enforced methods system

### Phase 2: Feature System ✅
- [x] Feature brand types (`HasOvp`, `HasOcp`, etc.)
- [x] Feature ID types (`PsuFeatureId`, `LoadFeatureId`, `OscFeatureId`)
- [x] Type guards (`hasOvp()`, `hasCp()`, `hasDecode()`)
- [x] `FeaturesFromArray` utility type
- [x] Compile-time feature validation with `satisfies`

### Phase 3: Equipment Base Types ✅
- [x] `BaseInstrument`
- [x] `Oscilloscope` with comprehensive channel interface
- [x] `PowerSupply` with comprehensive channel interface
- [x] `Multimeter`
- [x] `ElectronicLoad` with list mode in base

### Phase 4: Reference Implementations ✅
- [x] Rigol DS1054Z oscilloscope
- [x] Rigol DP832 power supply (3-channel)
- [x] Rigol DL3021 electronic load
- [x] Matrix WPS300S power supply (basic)

### Phase 5: Extended Equipment Types
- [ ] `SignalGenerator` with modulation/sweep/burst
- [ ] `SpectrumAnalyzer` with traces/markers
- [ ] `SourceMeasureUnit` with sweep
- [ ] `LcrMeter`

### Phase 6: Additional Drivers
- [ ] Siglent SDS oscilloscopes
- [ ] Siglent SDL electronic loads
- [ ] Keysight InfiniiVision oscilloscopes
- [ ] Keysight E36xxx power supplies
- [ ] Tektronix MSO oscilloscopes

### Phase 7: Driver Probe Tool
- [ ] Model pattern heuristics database
- [ ] Command-based type detection
- [ ] Deep probing logic per equipment type
- [ ] Command variant detection
- [ ] Driver matching algorithm
- [ ] Driver spec generation from probe results
- [ ] CLI interface (`visa-ts probe <resource>`)

---

## Equipment-Specific Implementation Plans

Detailed implementation plans for each equipment type are in:
- `docs/drivers/psu/implementation-plan.md` - Power Supply drivers
- `docs/drivers/load/implementation-plan.md` - Electronic Load drivers
- `docs/drivers/osc/implementation-plan.md` - Oscilloscope drivers

---

## Middleware for Logging, Debugging, and Runtime Patching

Middleware provides a chainable way to intercept SCPI communication at the resource level.
This is ideal for logging, debugging, retrying failed operations, and patching device quirks.

```typescript
import { withMiddleware, loggingMiddleware, retryMiddleware } from 'visa-ts';

// Wrap resource with middleware before connecting
const debugResource = withMiddleware(resource, [
  loggingMiddleware({ timestamps: true }),
  retryMiddleware({ maxRetries: 3, retryDelay: 100 }),
]);

// Driver uses the wrapped resource
const psu = await rigolDP832.connect(debugResource);
```

**Built-in Middleware:**

| Middleware | Purpose |
|------------|---------|
| `loggingMiddleware()` | Log all SCPI commands and responses |
| `retryMiddleware()` | Retry failed operations with configurable attempts |
| `responseTransformMiddleware()` | Transform responses (trim, fix line endings) |
| `commandTransformMiddleware()` | Transform commands before sending |

---

## Common SCPI Patterns

### Standard Subsystems

| Subsystem | Purpose | Example Commands |
|-----------|---------|------------------|
| `SYSTem` | System configuration | `:SYST:ERR?`, `:SYST:VERS?` |
| `STATus` | Status registers | `:STAT:OPER?`, `:STAT:QUES?` |
| `TRIGger` | Trigger configuration | `:TRIG:MODE`, `:TRIG:LEV`, `:TRIG:SOUR` |
| `ACQuire` | Acquisition settings | `:ACQ:TYPE`, `:ACQ:COUN`, `:ACQ:SRAT?` |
| `CHANnel` | Channel configuration | `:CHAN1:DISP`, `:CHAN1:SCAL`, `:CHAN1:OFFS` |
| `TIMebase` | Horizontal settings | `:TIM:SCAL`, `:TIM:OFFS`, `:TIM:MODE` |
| `WAVeform` | Waveform data | `:WAV:SOUR`, `:WAV:FORM`, `:WAV:DATA?` |
| `MEASure` | Measurements | `:MEAS:FREQ?`, `:MEAS:VPP?`, `:MEAS:SOUR` |
| `SOURce` | Source/output settings | `:SOUR:VOLT`, `:SOUR:CURR`, `:SOUR:FREQ` |
| `OUTPut` | Output enable | `:OUTP`, `:OUTP:STAT?` |

### Manufacturer Quirks

| Manufacturer | Quirk | Handling |
|--------------|-------|----------|
| Rigol | Older firmware SCPI bugs | Extra delays, quirks mode |
| Rigol | Non-standard binary format | Custom parser |
| Teledyne LeCroy | VICP framing on Windows | Protocol wrapper |
| Tektronix MSO5/6 | Terminal emulator default | Requires protocol config |
| Siglent | Missing digital channel support | Feature detection |
| Keysight/Agilent | Consistent across models | Minimal quirks |

---

## References

- [SCPI-99 Standard](https://en.wikipedia.org/wiki/Standard_Commands_for_Programmable_Instruments)
- [sigrok Supported Hardware](https://sigrok.org/wiki/Supported_hardware) - GPL project with 258+ device drivers
- [ngscopeclient Oscilloscope Drivers](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html) - BSD-3 project with extensive SCPI driver docs
- [Rohde & Schwarz SCPI Introduction](https://www.rohde-schwarz.com/us/driver-pages/remote-control/remote-programming-environments_231250.html)
