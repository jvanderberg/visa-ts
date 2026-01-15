# Driver Abstraction Plan

This document outlines the design for adding a driver abstraction layer to visa-ts that provides typed APIs for specific instruments, abstracting away raw SCPI commands and hardware quirks.

## Goals

1. **Typed APIs** - Users interact with instrument properties and methods, not SCPI strings
2. **Declarative where possible** - Most drivers defined via configuration, not code
3. **Escape hatches** - Hooks and custom methods for complex interactions
4. **Extensible types** - Users can define new equipment types for unusual hardware
5. **Explicit async** - No hidden async behind sync-looking APIs; all operations return `Result<T, Error>`
6. **Unified channel model** - Single types handle both single and multi-channel instruments

## Architecture

```
User Code
    ↓
Driver (typed API: scope.setTimebase(1e-3))
    ↓
MessageBasedResource (SCPI: :TIMebase:SCALe 1e-3)
    ↓
Transport (USB-TMC, Serial, TCP/IP, Simulation)
    ↓
Hardware
```

## Core Design Decisions

### 1. Driver Carries Its Type

The driver definition specifies its return type. No auto-detection magic that loses type information.

```typescript
// Driver definition knows its own return type
const rigolDS1054Z = defineDriver<RigolOscilloscopeAPI>({
  type: 'oscilloscope',
  manufacturer: 'Rigol',
  models: ['DS1054Z', 'DS1104Z-Plus'],
  properties: { /* ... */ },
  commands: { /* ... */ },
});

// connect() returns the type the driver was defined with
const scope = await rigolDS1054Z.connect(resource);
// TypeScript knows: scope is RigolOscilloscopeAPI
```

### 2. Explicit Async with Result Types

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

### 3. Three-Level Type Hierarchy

```typescript
// Level 1: Base equipment types (provided by visa-ts)
interface OscilloscopeAPI extends BaseInstrumentAPI {
  getTimebase(): Promise<Result<number, Error>>;
  setTimebase(value: number): Promise<Result<void, Error>>;
  run(): Promise<Result<void, Error>>;
  stop(): Promise<Result<void, Error>>;
  // ...
}

// Level 2: Vendor extensions (visa-ts or user-defined)
interface RigolOscilloscopeAPI extends OscilloscopeAPI {
  getMathDisplay(): Promise<Result<boolean, Error>>;
  setMathDisplay(on: boolean): Promise<Result<void, Error>>;
}

// Level 3: Fully custom for odd hardware (user-defined)
interface PlasmaControllerAPI extends BaseInstrumentAPI {
  getPlasmaTemperature(): Promise<Result<number, Error>>;
  activateContainmentField(): Promise<Result<void, Error>>;
}
```

### 4. Hybrid Declarative + Hooks

```typescript
interface DriverSpec<T> {
  // Metadata
  type?: string;                    // Equipment category (optional)
  manufacturer?: string;
  models?: string[];

  // Declarative definitions
  properties: PropertyMap;          // get/set properties
  commands: CommandMap;             // fire-and-forget commands

  // Channel configuration
  channels?: ChannelSpec;           // Indexed channel definitions

  // Imperative escape hatches
  hooks?: {
    onConnect?(ctx: DriverContext): Promise<Result<void, Error>>;
    onDisconnect?(ctx: DriverContext): Promise<Result<void, Error>>;
    transformCommand?(cmd: string, value: unknown): string;
    transformResponse?(cmd: string, response: string): string;
  };

  // Custom methods when declarative doesn't fit
  methods?: MethodMap<T>;

  // Hardware quirks
  quirks?: QuirkConfig;

  // Capability declarations
  capabilities?: CapabilitySet;
}
```

### 5. Raw Escape Hatch

Users can always access the underlying resource:

```typescript
const scope = await rigolDS1054Z.connect(resource);

// Use typed API
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
  channel(n: number): ChannelAPI;             // Access a specific channel (1-indexed)
}

// Channel accessor validates bounds and returns typed channel API
const ch1 = psu.channel(1);  // Returns PowerSupplyChannelAPI
const ch2 = psu.channel(2);  // Returns PowerSupplyChannelAPI (or error if channelCount < 2)
```

### Driver Channel Declaration

Drivers declare their channel count, and the runtime enforces bounds:

```typescript
const rigolDP832 = defineDriver<PowerSupplyAPI>({
  manufacturer: 'Rigol',
  models: ['DP832', 'DP832A'],

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

// Single-channel PSU
const keysightE36312A = defineDriver<PowerSupplyAPI>({
  channels: {
    count: 1,
    properties: { /* ... */ },
  },
});
```

### Convenience Accessors for Single-Channel

Single-channel instruments get shortcut methods that delegate to `channel(1)`:

```typescript
interface PowerSupplyAPI extends BaseInstrumentAPI {
  readonly channelCount: number;
  channel(n: number): PowerSupplyChannelAPI;

  // Convenience methods delegate to channel(1) when channelCount === 1
  // These are optional - only available if driver declares them or channelCount === 1
  getVoltage?(): Promise<Result<number, Error>>;
  setVoltage?(volts: number): Promise<Result<void, Error>>;
  // ...
}

// Usage: both work identically for single-channel PSU
await psu.setVoltage(5.0);           // Shortcut
await psu.channel(1).setVoltage(5.0); // Explicit
```

### Type-Safe Channel Validation

```typescript
// Runtime validation returns Result
const ch = psu.channel(5);
// If psu.channelCount < 5, operations on `ch` return Err('Channel 5 out of range (1-3)')

// Or channel() itself could return Result<ChannelAPI, Error>
const chResult = psu.channel(5);
if (!chResult.ok) {
  console.error(chResult.error); // "Channel 5 out of range (max: 3)"
}
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
}
```

## Command Definition

```typescript
interface CommandDef {
  command: string;                  // SCPI command to send
  description?: string;
  delay?: number;                   // Post-command delay (ms)
}
```

## Capability System

Drivers declare which optional features they support:

```typescript
type OscilloscopeCapability =
  | 'digital-channels'      // Has digital/logic analyzer channels
  | 'math-channels'         // Has math/computed channels
  | 'fft'                   // Has FFT analysis
  | 'protocol-decode'       // Has serial protocol decoding
  | 'mask-test'             // Has mask/limit testing
  | 'segmented-memory'      // Has segmented acquisition
  | 'waveform-generator'    // Has built-in AWG
  | 'bode-plot';            // Has frequency response analysis

type PowerSupplyCapability =
  | 'tracking'              // Channels can track each other
  | 'series-parallel'       // Channels can be combined series/parallel
  | 'sequencing'            // Has output sequencing/list mode
  | 'ovp'                   // Has over-voltage protection
  | 'ocp'                   // Has over-current protection
  | 'opp'                   // Has over-power protection
  | 'otp'                   // Has over-temperature protection
  | 'remote-sense';         // Has 4-wire remote sensing

// Driver declares capabilities
const rigolDS1054Z = defineDriver<OscilloscopeAPI>({
  capabilities: ['fft', 'protocol-decode', 'math-channels'],
  // ...
});

// User can check capabilities
if (scope.hasCapability('protocol-decode')) {
  await scope.configureDecoder('i2c', { sda: 1, scl: 2 });
}
```

---

## Equipment Base Types

Based on research from [sigrok](https://sigrok.org/wiki/Supported_hardware), [ngscopeclient](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html), and SCPI standards.

### Base Instrument API

```typescript
interface BaseInstrumentAPI {
  // Identity
  readonly resourceString: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly serialNumber: string;
  readonly firmwareVersion: string;

  // Raw access escape hatch
  readonly resource: MessageBasedResource;

  // Common operations
  reset(): Promise<Result<void, Error>>;
  clear(): Promise<Result<void, Error>>;
  selfTest(): Promise<Result<boolean, Error>>;
  getError(): Promise<Result<{ code: number; message: string } | null, Error>>;

  // Connection
  close(): Promise<Result<void, Error>>;

  // Capability checking
  hasCapability(cap: string): boolean;
  readonly capabilities: readonly string[];
}
```

### Oscilloscope

```typescript
interface OscilloscopeAPI extends BaseInstrumentAPI {
  // === Channel System ===
  readonly analogChannelCount: number;
  readonly digitalChannelCount: number;      // 0 if no digital channels
  analogChannel(n: number): OscilloscopeAnalogChannelAPI;
  digitalChannel?(n: number): OscilloscopeDigitalChannelAPI;  // Optional

  // === Timebase ===
  getTimebase(): Promise<Result<number, Error>>;              // s/div
  setTimebase(secPerDiv: number): Promise<Result<void, Error>>;
  getTimebaseOffset(): Promise<Result<number, Error>>;        // seconds from trigger
  setTimebaseOffset(seconds: number): Promise<Result<void, Error>>;
  getTimebaseMode(): Promise<Result<TimebaseMode, Error>>;
  setTimebaseMode(mode: TimebaseMode): Promise<Result<void, Error>>;
  getSampleRate(): Promise<Result<number, Error>>;            // Sa/s (read-only usually)
  getRecordLength(): Promise<Result<number, Error>>;          // points
  setRecordLength(points: number): Promise<Result<void, Error>>;

  // === Trigger ===
  getTriggerSource(): Promise<Result<TriggerSource, Error>>;
  setTriggerSource(source: TriggerSource): Promise<Result<void, Error>>;
  getTriggerLevel(): Promise<Result<number, Error>>;          // volts
  setTriggerLevel(volts: number): Promise<Result<void, Error>>;
  getTriggerSlope(): Promise<Result<TriggerSlope, Error>>;
  setTriggerSlope(slope: TriggerSlope): Promise<Result<void, Error>>;
  getTriggerMode(): Promise<Result<TriggerMode, Error>>;
  setTriggerMode(mode: TriggerMode): Promise<Result<void, Error>>;
  getTriggerHoldoff(): Promise<Result<number, Error>>;        // seconds
  setTriggerHoldoff(seconds: number): Promise<Result<void, Error>>;
  forceTrigger(): Promise<Result<void, Error>>;

  // === Acquisition Control ===
  run(): Promise<Result<void, Error>>;
  stop(): Promise<Result<void, Error>>;
  single(): Promise<Result<void, Error>>;
  autoScale(): Promise<Result<void, Error>>;
  getAcquisitionMode(): Promise<Result<AcquisitionMode, Error>>;
  setAcquisitionMode(mode: AcquisitionMode): Promise<Result<void, Error>>;
  getAcquisitionCount(): Promise<Result<number, Error>>;      // for averaging
  setAcquisitionCount(count: number): Promise<Result<void, Error>>;
  isRunning(): Promise<Result<boolean, Error>>;

  // === Data Acquisition ===
  getWaveform(channel: number): Promise<Result<WaveformData, Error>>;
  getWaveformRaw(channel: number): Promise<Result<Buffer, Error>>;

  // === Measurements ===
  measure(channel: number, type: MeasurementType): Promise<Result<number, Error>>;
  measureAll(channel: number): Promise<Result<MeasurementSet, Error>>;

  // === Display ===
  getScreenshot(format?: 'PNG' | 'BMP' | 'JPEG'): Promise<Result<Buffer, Error>>;

  // === Math (optional capability) ===
  mathChannel?(n: number): OscilloscopeMathChannelAPI;

  // === FFT (optional capability) ===
  getFFT?(channel: number): Promise<Result<FFTData, Error>>;

  // === Protocol Decode (optional capability) ===
  configureDecoder?(protocol: Protocol, config: DecoderConfig): Promise<Result<void, Error>>;
  getDecodedData?(protocol: Protocol): Promise<Result<DecodedData, Error>>;
}

interface OscilloscopeAnalogChannelAPI {
  readonly channelNumber: number;

  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;                 // V/div
  setScale(voltsPerDiv: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;                // V
  setOffset(volts: number): Promise<Result<void, Error>>;
  getCoupling(): Promise<Result<Coupling, Error>>;
  setCoupling(coupling: Coupling): Promise<Result<void, Error>>;
  getBandwidthLimit(): Promise<Result<BandwidthLimit, Error>>;
  setBandwidthLimit(limit: BandwidthLimit): Promise<Result<void, Error>>;
  getProbeAttenuation(): Promise<Result<number, Error>>;      // 1x, 10x, 100x, etc.
  setProbeAttenuation(ratio: number): Promise<Result<void, Error>>;
  getInverted(): Promise<Result<boolean, Error>>;
  setInverted(inverted: boolean): Promise<Result<void, Error>>;
  getLabel(): Promise<Result<string, Error>>;
  setLabel(label: string): Promise<Result<void, Error>>;
}

interface OscilloscopeDigitalChannelAPI {
  readonly channelNumber: number;

  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getThreshold(): Promise<Result<number, Error>>;             // V
  setThreshold(volts: number): Promise<Result<void, Error>>;
  getLabel(): Promise<Result<string, Error>>;
  setLabel(label: string): Promise<Result<void, Error>>;
}

// Types
type TimebaseMode = 'MAIN' | 'WINDOW' | 'XY' | 'ROLL';
type TriggerSource = 'CH1' | 'CH2' | 'CH3' | 'CH4' | 'EXT' | 'LINE' | 'D0' | 'D1' | /* ... */;
type TriggerSlope = 'RISING' | 'FALLING' | 'EITHER';
type TriggerMode = 'AUTO' | 'NORMAL' | 'SINGLE';
type AcquisitionMode = 'NORMAL' | 'AVERAGE' | 'PEAK' | 'HIGHRES';
type Coupling = 'AC' | 'DC' | 'GND';
type BandwidthLimit = 'OFF' | '20MHZ' | '100MHZ' | '200MHZ';  // Varies by model
type MeasurementType =
  | 'FREQUENCY' | 'PERIOD' | 'COUNTER'
  | 'VMAX' | 'VMIN' | 'VPP' | 'VTOP' | 'VBASE' | 'VAMP'
  | 'VAVG' | 'VRMS' | 'VAVG_CYCLE' | 'VRMS_CYCLE'
  | 'OVERSHOOT' | 'PRESHOOT'
  | 'RISE' | 'FALL' | 'PWIDTH' | 'NWIDTH' | 'DUTY_POS' | 'DUTY_NEG'
  | 'DELAY_RISE' | 'DELAY_FALL' | 'PHASE';
type Protocol = 'I2C' | 'SPI' | 'UART' | 'CAN' | 'LIN' | 'I2S' | 'FLEXRAY' | '1WIRE';

interface WaveformData {
  points: Float64Array;
  xIncrement: number;              // Time between samples (s)
  xOrigin: number;                 // Time of first sample (s)
  yIncrement: number;              // Voltage per LSB (V)
  yOrigin: number;                 // Voltage offset (V)
  xUnit: 's';
  yUnit: 'V';
}

interface MeasurementSet {
  frequency?: number;
  period?: number;
  vmax?: number;
  vmin?: number;
  vpp?: number;
  vavg?: number;
  vrms?: number;
  rise?: number;
  fall?: number;
  // ... etc
}

interface FFTData {
  magnitudes: Float64Array;        // dB or linear
  frequencies: Float64Array;       // Hz
  rbw: number;                     // Resolution bandwidth
}
```

### Power Supply

```typescript
interface PowerSupplyAPI extends BaseInstrumentAPI {
  // === Channel System ===
  readonly channelCount: number;
  channel(n: number): PowerSupplyChannelAPI;

  // === Global Controls ===
  getAllOutputEnabled(): Promise<Result<boolean, Error>>;
  setAllOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Tracking (optional capability) ===
  getTrackingMode?(): Promise<Result<TrackingMode, Error>>;
  setTrackingMode?(mode: TrackingMode): Promise<Result<void, Error>>;

  // === Series/Parallel (optional capability) ===
  getCombineMode?(): Promise<Result<CombineMode, Error>>;
  setCombineMode?(mode: CombineMode): Promise<Result<void, Error>>;

  // === Sequencing (optional capability) ===
  getSequenceEnabled?(): Promise<Result<boolean, Error>>;
  setSequenceEnabled?(on: boolean): Promise<Result<void, Error>>;
  setSequenceDelay?(channel: number, delayMs: number): Promise<Result<void, Error>>;

  // === Convenience (single-channel shorthand) ===
  // These delegate to channel(1) and are always available
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
  measureVoltage(): Promise<Result<number, Error>>;
  measureCurrent(): Promise<Result<number, Error>>;
  measurePower(): Promise<Result<number, Error>>;
}

interface PowerSupplyChannelAPI {
  readonly channelNumber: number;

  // === Output Control ===
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Voltage ===
  getVoltage(): Promise<Result<number, Error>>;               // Setpoint
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getVoltageLimit(): Promise<Result<number, Error>>;          // Max settable
  setVoltageLimit(volts: number): Promise<Result<void, Error>>;
  getVoltageRange(): Promise<Result<VoltageRange, Error>>;    // HIGH/LOW range
  setVoltageRange(range: VoltageRange): Promise<Result<void, Error>>;

  // === Current ===
  getCurrent(): Promise<Result<number, Error>>;               // Setpoint (limit)
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getCurrentLimit(): Promise<Result<number, Error>>;          // Max settable
  setCurrentLimit(amps: number): Promise<Result<void, Error>>;

  // === Measurements ===
  measureVoltage(): Promise<Result<number, Error>>;           // Actual output
  measureCurrent(): Promise<Result<number, Error>>;           // Actual output
  measurePower(): Promise<Result<number, Error>>;             // V * I

  // === Status ===
  getMode(): Promise<Result<RegulationMode, Error>>;          // CV, CC, or UR

  // === Protection ===
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(on: boolean): Promise<Result<void, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(on: boolean): Promise<Result<void, Error>>;
  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(amps: number): Promise<Result<void, Error>>;
  clearProtection(): Promise<Result<void, Error>>;            // Clear OVP/OCP trip

  // === Remote Sense (optional capability) ===
  getRemoteSenseEnabled?(): Promise<Result<boolean, Error>>;
  setRemoteSenseEnabled?(on: boolean): Promise<Result<void, Error>>;
}

type RegulationMode = 'CV' | 'CC' | 'UR';  // Constant Voltage, Constant Current, Unregulated
type TrackingMode = 'INDEPENDENT' | 'SERIES' | 'PARALLEL';
type CombineMode = 'INDEPENDENT' | 'SERIES' | 'PARALLEL';
type VoltageRange = 'HIGH' | 'LOW' | 'AUTO';
```

### Digital Multimeter (DMM)

```typescript
interface MultimeterAPI extends BaseInstrumentAPI {
  // === Channel System (for dual-display DMMs) ===
  readonly displayCount: number;              // 1 or 2 typically
  display(n: number): MultimeterDisplayAPI;   // Primary = 1, Secondary = 2

  // === Convenience (primary display shorthand) ===
  getFunction(): Promise<Result<DmmFunction, Error>>;
  setFunction(func: DmmFunction): Promise<Result<void, Error>>;
  getRange(): Promise<Result<number | 'AUTO', Error>>;
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;
  measure(): Promise<Result<number, Error>>;
  fetch(): Promise<Result<number, Error>>;

  // === Triggering ===
  getTriggerSource(): Promise<Result<TriggerSource, Error>>;
  setTriggerSource(source: TriggerSource): Promise<Result<void, Error>>;
  getTriggerDelay(): Promise<Result<number | 'AUTO', Error>>;
  setTriggerDelay(seconds: number | 'AUTO'): Promise<Result<void, Error>>;
  initiate(): Promise<Result<void, Error>>;                   // Start measurement
  abort(): Promise<Result<void, Error>>;                      // Abort measurement

  // === Data Logging (optional capability) ===
  getLoggingEnabled?(): Promise<Result<boolean, Error>>;
  setLoggingEnabled?(on: boolean): Promise<Result<void, Error>>;
  getLoggedData?(): Promise<Result<number[], Error>>;
  clearLog?(): Promise<Result<void, Error>>;

  // === Statistics ===
  getStatistics(): Promise<Result<DmmStatistics, Error>>;
  clearStatistics(): Promise<Result<void, Error>>;
}

interface MultimeterDisplayAPI {
  readonly displayNumber: number;

  // === Function Selection ===
  getFunction(): Promise<Result<DmmFunction, Error>>;
  setFunction(func: DmmFunction): Promise<Result<void, Error>>;

  // === Range ===
  getRange(): Promise<Result<number | 'AUTO', Error>>;
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;
  getAutoRangeEnabled(): Promise<Result<boolean, Error>>;
  setAutoRangeEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Measurement ===
  measure(): Promise<Result<number, Error>>;                  // Trigger + read
  fetch(): Promise<Result<number, Error>>;                    // Read last measurement
  read(): Promise<Result<number, Error>>;                     // Read current value

  // === Resolution/Speed ===
  getNplc(): Promise<Result<number, Error>>;                  // Power line cycles (0.001-100)
  setNplc(nplc: number): Promise<Result<void, Error>>;
  getAperture(): Promise<Result<number, Error>>;              // Integration time (s)
  setAperture(seconds: number): Promise<Result<void, Error>>;
  getResolution(): Promise<Result<number, Error>>;            // Digits (4.5, 5.5, 6.5)
  setResolution(digits: number): Promise<Result<void, Error>>;

  // === AC Specific ===
  getAcBandwidth(): Promise<Result<AcBandwidth, Error>>;
  setAcBandwidth(bw: AcBandwidth): Promise<Result<void, Error>>;

  // === Null/Relative ===
  getNullEnabled(): Promise<Result<boolean, Error>>;
  setNullEnabled(on: boolean): Promise<Result<void, Error>>;
  getNullValue(): Promise<Result<number, Error>>;
  setNullValue(value: number): Promise<Result<void, Error>>;
  acquireNull(): Promise<Result<void, Error>>;                // Set null to current reading

  // === dB/dBm ===
  getDbReference(): Promise<Result<number, Error>>;
  setDbReference(value: number): Promise<Result<void, Error>>;
  getDbmReference(): Promise<Result<number, Error>>;          // Impedance (ohms)
  setDbmReference(ohms: number): Promise<Result<void, Error>>;
}

type DmmFunction =
  // Voltage
  | 'VDC' | 'VAC' | 'VDC_AC'
  // Current
  | 'ADC' | 'AAC' | 'ADC_AC'
  // Resistance
  | 'RESISTANCE_2W' | 'RESISTANCE_4W'
  // Frequency/Period
  | 'FREQUENCY' | 'PERIOD'
  // Capacitance
  | 'CAPACITANCE'
  // Temperature
  | 'TEMPERATURE_RTD' | 'TEMPERATURE_TC'  // RTD or Thermocouple
  // Test modes
  | 'CONTINUITY' | 'DIODE';

type AcBandwidth = 'SLOW' | 'MEDIUM' | 'FAST';  // ~3Hz, ~20Hz, ~200Hz

interface DmmStatistics {
  min: number;
  max: number;
  average: number;
  stdDev: number;
  count: number;
}
```

### Signal/Function Generator

```typescript
interface SignalGeneratorAPI extends BaseInstrumentAPI {
  // === Channel System ===
  readonly channelCount: number;
  channel(n: number): SignalGeneratorChannelAPI;

  // === Sync/Trigger Output ===
  getSyncEnabled(): Promise<Result<boolean, Error>>;
  setSyncEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Reference Clock ===
  getClockSource(): Promise<Result<ClockSource, Error>>;
  setClockSource(source: ClockSource): Promise<Result<void, Error>>;

  // === Channel Coupling ===
  getChannelCoupling(): Promise<Result<ChannelCoupling, Error>>;
  setChannelCoupling(coupling: ChannelCoupling): Promise<Result<void, Error>>;

  // === Convenience (single-channel shorthand) ===
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
  getWaveform(): Promise<Result<Waveform, Error>>;
  setWaveform(waveform: Waveform): Promise<Result<void, Error>>;
  getFrequency(): Promise<Result<number, Error>>;
  setFrequency(hz: number): Promise<Result<void, Error>>;
  getAmplitude(): Promise<Result<number, Error>>;
  setAmplitude(vpp: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;
  setOffset(volts: number): Promise<Result<void, Error>>;
}

interface SignalGeneratorChannelAPI {
  readonly channelNumber: number;

  // === Output Control ===
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
  getOutputLoad(): Promise<Result<number | 'HIGHZ', Error>>; // Impedance setting
  setOutputLoad(ohms: number | 'HIGHZ'): Promise<Result<void, Error>>;
  getOutputPolarity(): Promise<Result<Polarity, Error>>;
  setOutputPolarity(polarity: Polarity): Promise<Result<void, Error>>;

  // === Waveform ===
  getWaveform(): Promise<Result<Waveform, Error>>;
  setWaveform(waveform: Waveform): Promise<Result<void, Error>>;

  // === Frequency ===
  getFrequency(): Promise<Result<number, Error>>;
  setFrequency(hz: number): Promise<Result<void, Error>>;

  // === Amplitude ===
  getAmplitude(): Promise<Result<number, Error>>;             // Vpp
  setAmplitude(vpp: number): Promise<Result<void, Error>>;
  getAmplitudeUnit(): Promise<Result<AmplitudeUnit, Error>>;
  setAmplitudeUnit(unit: AmplitudeUnit): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;                // VDC
  setOffset(volts: number): Promise<Result<void, Error>>;
  getHighLevel(): Promise<Result<number, Error>>;             // V
  setHighLevel(volts: number): Promise<Result<void, Error>>;
  getLowLevel(): Promise<Result<number, Error>>;              // V
  setLowLevel(volts: number): Promise<Result<void, Error>>;

  // === Phase ===
  getPhase(): Promise<Result<number, Error>>;                 // Degrees
  setPhase(degrees: number): Promise<Result<void, Error>>;

  // === Duty Cycle (pulse/square) ===
  getDutyCycle(): Promise<Result<number, Error>>;             // %
  setDutyCycle(percent: number): Promise<Result<void, Error>>;

  // === Pulse Parameters ===
  getPulseWidth(): Promise<Result<number, Error>>;            // s
  setPulseWidth(seconds: number): Promise<Result<void, Error>>;
  getRiseTime(): Promise<Result<number, Error>>;              // s
  setRiseTime(seconds: number): Promise<Result<void, Error>>;
  getFallTime(): Promise<Result<number, Error>>;              // s
  setFallTime(seconds: number): Promise<Result<void, Error>>;

  // === Ramp Parameters ===
  getSymmetry(): Promise<Result<number, Error>>;              // %
  setSymmetry(percent: number): Promise<Result<void, Error>>;

  // === Modulation ===
  getModulationEnabled(): Promise<Result<boolean, Error>>;
  setModulationEnabled(on: boolean): Promise<Result<void, Error>>;
  getModulationType(): Promise<Result<ModulationType, Error>>;
  setModulationType(type: ModulationType): Promise<Result<void, Error>>;
  getModulationSource(): Promise<Result<ModulationSource, Error>>;
  setModulationSource(source: ModulationSource): Promise<Result<void, Error>>;
  // AM-specific
  getAmDepth(): Promise<Result<number, Error>>;               // %
  setAmDepth(percent: number): Promise<Result<void, Error>>;
  // FM-specific
  getFmDeviation(): Promise<Result<number, Error>>;           // Hz
  setFmDeviation(hz: number): Promise<Result<void, Error>>;
  // PM-specific
  getPmDeviation(): Promise<Result<number, Error>>;           // Degrees
  setPmDeviation(degrees: number): Promise<Result<void, Error>>;
  // FSK-specific
  getFskHopFrequency(): Promise<Result<number, Error>>;       // Hz
  setFskHopFrequency(hz: number): Promise<Result<void, Error>>;
  getFskRate(): Promise<Result<number, Error>>;               // Hz
  setFskRate(hz: number): Promise<Result<void, Error>>;
  // Internal modulation source
  getModulationFrequency(): Promise<Result<number, Error>>;   // Hz
  setModulationFrequency(hz: number): Promise<Result<void, Error>>;
  getModulationWaveform(): Promise<Result<Waveform, Error>>;
  setModulationWaveform(waveform: Waveform): Promise<Result<void, Error>>;

  // === Sweep ===
  getSweepEnabled(): Promise<Result<boolean, Error>>;
  setSweepEnabled(on: boolean): Promise<Result<void, Error>>;
  getSweepType(): Promise<Result<SweepType, Error>>;
  setSweepType(type: SweepType): Promise<Result<void, Error>>;
  getSweepStartFrequency(): Promise<Result<number, Error>>;
  setSweepStartFrequency(hz: number): Promise<Result<void, Error>>;
  getSweepStopFrequency(): Promise<Result<number, Error>>;
  setSweepStopFrequency(hz: number): Promise<Result<void, Error>>;
  getSweepTime(): Promise<Result<number, Error>>;             // s
  setSweepTime(seconds: number): Promise<Result<void, Error>>;

  // === Burst ===
  getBurstEnabled(): Promise<Result<boolean, Error>>;
  setBurstEnabled(on: boolean): Promise<Result<void, Error>>;
  getBurstMode(): Promise<Result<BurstMode, Error>>;
  setBurstMode(mode: BurstMode): Promise<Result<void, Error>>;
  getBurstCycles(): Promise<Result<number | 'INFINITE', Error>>;
  setBurstCycles(cycles: number | 'INFINITE'): Promise<Result<void, Error>>;
  getBurstPhase(): Promise<Result<number, Error>>;            // Start phase (degrees)
  setBurstPhase(degrees: number): Promise<Result<void, Error>>;
  trigger(): Promise<Result<void, Error>>;                    // Manual trigger

  // === Arbitrary Waveform ===
  loadArbitraryWaveform(data: Float64Array | number[]): Promise<Result<void, Error>>;
  getArbitrarySampleRate(): Promise<Result<number, Error>>;
  setArbitrarySampleRate(rate: number): Promise<Result<void, Error>>;
}

type Waveform = 'SINE' | 'SQUARE' | 'RAMP' | 'PULSE' | 'NOISE' | 'DC' | 'ARB' | 'SINC' | 'GAUSSIAN' | 'LORENTZ' | 'HAVERSINE' | 'EXPRISE' | 'EXPFALL';
type ModulationType = 'AM' | 'FM' | 'PM' | 'FSK' | 'PSK' | 'PWM' | 'ASK' | 'BPSK' | 'QPSK' | 'OSK' | 'DSB_AM' | 'SUM';
type ModulationSource = 'INTERNAL' | 'EXTERNAL';
type SweepType = 'LINEAR' | 'LOG' | 'STEP';
type BurstMode = 'TRIGGERED' | 'GATED' | 'INFINITE';
type ClockSource = 'INTERNAL' | 'EXTERNAL';
type ChannelCoupling = 'OFF' | 'FREQUENCY' | 'AMPLITUDE' | 'BOTH';
type AmplitudeUnit = 'VPP' | 'VRMS' | 'DBM';
type Polarity = 'NORMAL' | 'INVERTED';
```

### Electronic Load

```typescript
interface ElectronicLoadAPI extends BaseInstrumentAPI {
  // === Channel System ===
  readonly channelCount: number;
  channel(n: number): ElectronicLoadChannelAPI;

  // === Convenience (single-channel shorthand) ===
  getInputEnabled(): Promise<Result<boolean, Error>>;
  setInputEnabled(on: boolean): Promise<Result<void, Error>>;
  getMode(): Promise<Result<LoadMode, Error>>;
  setMode(mode: LoadMode): Promise<Result<void, Error>>;
  measureVoltage(): Promise<Result<number, Error>>;
  measureCurrent(): Promise<Result<number, Error>>;
  measurePower(): Promise<Result<number, Error>>;
}

interface ElectronicLoadChannelAPI {
  readonly channelNumber: number;

  // === Input Control ===
  getInputEnabled(): Promise<Result<boolean, Error>>;
  setInputEnabled(on: boolean): Promise<Result<void, Error>>;
  getShortEnabled(): Promise<Result<boolean, Error>>;         // Short-circuit mode
  setShortEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Mode ===
  getMode(): Promise<Result<LoadMode, Error>>;
  setMode(mode: LoadMode): Promise<Result<void, Error>>;

  // === CC Mode (Constant Current) ===
  getCurrentSetpoint(): Promise<Result<number, Error>>;
  setCurrentSetpoint(amps: number): Promise<Result<void, Error>>;
  getCurrentRange(): Promise<Result<CurrentRange, Error>>;
  setCurrentRange(range: CurrentRange): Promise<Result<void, Error>>;

  // === CV Mode (Constant Voltage) ===
  getVoltageSetpoint(): Promise<Result<number, Error>>;
  setVoltageSetpoint(volts: number): Promise<Result<void, Error>>;

  // === CR Mode (Constant Resistance) ===
  getResistanceSetpoint(): Promise<Result<number, Error>>;
  setResistanceSetpoint(ohms: number): Promise<Result<void, Error>>;

  // === CP Mode (Constant Power) ===
  getPowerSetpoint(): Promise<Result<number, Error>>;
  setPowerSetpoint(watts: number): Promise<Result<void, Error>>;

  // === Dynamic/Transient Mode ===
  getDynamicEnabled(): Promise<Result<boolean, Error>>;
  setDynamicEnabled(on: boolean): Promise<Result<void, Error>>;
  getDynamicMode(): Promise<Result<DynamicMode, Error>>;
  setDynamicMode(mode: DynamicMode): Promise<Result<void, Error>>;
  getDynamicLevelA(): Promise<Result<number, Error>>;
  setDynamicLevelA(value: number): Promise<Result<void, Error>>;
  getDynamicLevelB(): Promise<Result<number, Error>>;
  setDynamicLevelB(value: number): Promise<Result<void, Error>>;
  getDynamicFrequency(): Promise<Result<number, Error>>;      // Hz
  setDynamicFrequency(hz: number): Promise<Result<void, Error>>;
  getDynamicDutyCycle(): Promise<Result<number, Error>>;      // %
  setDynamicDutyCycle(percent: number): Promise<Result<void, Error>>;

  // === Slew Rate ===
  getSlewRate(): Promise<Result<number, Error>>;              // A/s or A/µs
  setSlewRate(rate: number): Promise<Result<void, Error>>;
  getSlewRateUnit(): Promise<Result<SlewRateUnit, Error>>;
  setSlewRateUnit(unit: SlewRateUnit): Promise<Result<void, Error>>;

  // === Measurements ===
  measureVoltage(): Promise<Result<number, Error>>;
  measureCurrent(): Promise<Result<number, Error>>;
  measurePower(): Promise<Result<number, Error>>;
  measureResistance(): Promise<Result<number, Error>>;

  // === Protection ===
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(on: boolean): Promise<Result<void, Error>>;
  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(amps: number): Promise<Result<void, Error>>;
  getOppEnabled(): Promise<Result<boolean, Error>>;
  setOppEnabled(on: boolean): Promise<Result<void, Error>>;
  getOppLevel(): Promise<Result<number, Error>>;
  setOppLevel(watts: number): Promise<Result<void, Error>>;
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(on: boolean): Promise<Result<void, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  clearProtection(): Promise<Result<void, Error>>;

  // === Battery Test (optional capability) ===
  getBatteryTestEnabled?(): Promise<Result<boolean, Error>>;
  setBatteryTestEnabled?(on: boolean): Promise<Result<void, Error>>;
  getBatteryStopVoltage?(): Promise<Result<number, Error>>;
  setBatteryStopVoltage?(volts: number): Promise<Result<void, Error>>;
  getBatteryStopCapacity?(): Promise<Result<number, Error>>;  // Ah
  setBatteryStopCapacity?(ah: number): Promise<Result<void, Error>>;
  getBatteryCapacity?(): Promise<Result<number, Error>>;      // Accumulated Ah
  resetBatteryCapacity?(): Promise<Result<void, Error>>;
}

type LoadMode = 'CC' | 'CV' | 'CR' | 'CP' | 'CC_CV' | 'CR_CV';
type DynamicMode = 'CONTINUOUS' | 'PULSED' | 'TOGGLED';
type CurrentRange = 'HIGH' | 'LOW' | 'AUTO';
type SlewRateUnit = 'A/S' | 'A/US';
```

### Spectrum Analyzer

```typescript
interface SpectrumAnalyzerAPI extends BaseInstrumentAPI {
  // === Frequency ===
  getCenterFrequency(): Promise<Result<number, Error>>;
  setCenterFrequency(hz: number): Promise<Result<void, Error>>;
  getSpan(): Promise<Result<number, Error>>;
  setSpan(hz: number): Promise<Result<void, Error>>;
  getStartFrequency(): Promise<Result<number, Error>>;
  setStartFrequency(hz: number): Promise<Result<void, Error>>;
  getStopFrequency(): Promise<Result<number, Error>>;
  setStopFrequency(hz: number): Promise<Result<void, Error>>;
  setFullSpan(): Promise<Result<void, Error>>;
  setZeroSpan(): Promise<Result<void, Error>>;

  // === Resolution/Video Bandwidth ===
  getRbw(): Promise<Result<number, Error>>;
  setRbw(hz: number): Promise<Result<void, Error>>;
  getRbwAuto(): Promise<Result<boolean, Error>>;
  setRbwAuto(auto: boolean): Promise<Result<void, Error>>;
  getVbw(): Promise<Result<number, Error>>;
  setVbw(hz: number): Promise<Result<void, Error>>;
  getVbwAuto(): Promise<Result<boolean, Error>>;
  setVbwAuto(auto: boolean): Promise<Result<void, Error>>;
  getRbwVbwRatio(): Promise<Result<number, Error>>;

  // === Sweep ===
  getSweepTime(): Promise<Result<number, Error>>;
  setSweepTime(seconds: number): Promise<Result<void, Error>>;
  getSweepTimeAuto(): Promise<Result<boolean, Error>>;
  setSweepTimeAuto(auto: boolean): Promise<Result<void, Error>>;
  getSweepPoints(): Promise<Result<number, Error>>;
  setSweepPoints(points: number): Promise<Result<void, Error>>;
  getContinuousSweep(): Promise<Result<boolean, Error>>;
  setContinuousSweep(continuous: boolean): Promise<Result<void, Error>>;
  singleSweep(): Promise<Result<void, Error>>;
  restart(): Promise<Result<void, Error>>;

  // === Amplitude ===
  getReferenceLevel(): Promise<Result<number, Error>>;        // dBm
  setReferenceLevel(dbm: number): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;                 // dB/div
  setScale(dbPerDiv: number): Promise<Result<void, Error>>;
  getScaleType(): Promise<Result<ScaleType, Error>>;
  setScaleType(type: ScaleType): Promise<Result<void, Error>>;
  getAttenuation(): Promise<Result<number, Error>>;           // dB
  setAttenuation(db: number): Promise<Result<void, Error>>;
  getAttenuationAuto(): Promise<Result<boolean, Error>>;
  setAttenuationAuto(auto: boolean): Promise<Result<void, Error>>;
  getPreampEnabled(): Promise<Result<boolean, Error>>;
  setPreampEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Detection ===
  getDetectorType(): Promise<Result<DetectorType, Error>>;
  setDetectorType(type: DetectorType): Promise<Result<void, Error>>;

  // === Traces ===
  readonly traceCount: number;
  trace(n: number): SpectrumAnalyzerTraceAPI;

  // === Markers ===
  readonly markerCount: number;
  marker(n: number): SpectrumAnalyzerMarkerAPI;

  // === Peak Search ===
  peakSearch(): Promise<Result<{ frequency: number; amplitude: number }, Error>>;
  nextPeak(): Promise<Result<{ frequency: number; amplitude: number }, Error>>;
  nextPeakLeft(): Promise<Result<{ frequency: number; amplitude: number }, Error>>;
  nextPeakRight(): Promise<Result<{ frequency: number; amplitude: number }, Error>>;

  // === Tracking Generator (optional capability) ===
  getTrackingGeneratorEnabled?(): Promise<Result<boolean, Error>>;
  setTrackingGeneratorEnabled?(on: boolean): Promise<Result<void, Error>>;
  getTrackingGeneratorLevel?(): Promise<Result<number, Error>>; // dBm
  setTrackingGeneratorLevel?(dbm: number): Promise<Result<void, Error>>;

  // === Display ===
  getScreenshot(format?: 'PNG' | 'BMP' | 'JPEG'): Promise<Result<Buffer, Error>>;
}

interface SpectrumAnalyzerTraceAPI {
  readonly traceNumber: number;

  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getMode(): Promise<Result<TraceMode, Error>>;
  setMode(mode: TraceMode): Promise<Result<void, Error>>;
  getData(): Promise<Result<TraceData, Error>>;
  clear(): Promise<Result<void, Error>>;
}

interface SpectrumAnalyzerMarkerAPI {
  readonly markerNumber: number;

  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getFrequency(): Promise<Result<number, Error>>;
  setFrequency(hz: number): Promise<Result<void, Error>>;
  getAmplitude(): Promise<Result<number, Error>>;             // Read-only

  // === Marker Functions ===
  toCenter(): Promise<Result<void, Error>>;                   // Set center freq to marker
  toReference(): Promise<Result<void, Error>>;                // Set ref level to marker
  toPeak(): Promise<Result<void, Error>>;                     // Move marker to peak

  // === Delta Marker ===
  getDeltaEnabled(): Promise<Result<boolean, Error>>;
  setDeltaEnabled(on: boolean): Promise<Result<void, Error>>;
  getDeltaReference(): Promise<Result<number, Error>>;        // Reference marker number
  setDeltaReference(markerNum: number): Promise<Result<void, Error>>;
}

type ScaleType = 'LOG' | 'LINEAR';
type DetectorType = 'NORMAL' | 'POSITIVE' | 'NEGATIVE' | 'SAMPLE' | 'AVERAGE' | 'QUASI_PEAK' | 'EMI_AVERAGE' | 'RMS';
type TraceMode = 'WRITE' | 'MAXHOLD' | 'MINHOLD' | 'AVERAGE' | 'VIEW' | 'BLANK';

interface TraceData {
  frequencies: Float64Array;        // Hz
  amplitudes: Float64Array;         // dBm (or linear if LOG scale)
  startFrequency: number;
  stopFrequency: number;
  rbw: number;
  vbw: number;
}
```

### Source Measure Unit (SMU)

```typescript
interface SourceMeasureUnitAPI extends BaseInstrumentAPI {
  // === Channel System ===
  readonly channelCount: number;
  channel(n: number): SMUChannelAPI;

  // === Convenience (single-channel shorthand) ===
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
}

interface SMUChannelAPI {
  readonly channelNumber: number;

  // === Output Control ===
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
  getOutputOff(): Promise<Result<OutputOffMode, Error>>;
  setOutputOff(mode: OutputOffMode): Promise<Result<void, Error>>;

  // === Source Function ===
  getSourceFunction(): Promise<Result<SourceFunction, Error>>;
  setSourceFunction(func: SourceFunction): Promise<Result<void, Error>>;

  // === Voltage Source ===
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getVoltageRange(): Promise<Result<number, Error>>;
  setVoltageRange(volts: number): Promise<Result<void, Error>>;
  getVoltageRangeAuto(): Promise<Result<boolean, Error>>;
  setVoltageRangeAuto(auto: boolean): Promise<Result<void, Error>>;

  // === Current Source ===
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getCurrentRange(): Promise<Result<number, Error>>;
  setCurrentRange(amps: number): Promise<Result<void, Error>>;
  getCurrentRangeAuto(): Promise<Result<boolean, Error>>;
  setCurrentRangeAuto(auto: boolean): Promise<Result<void, Error>>;

  // === Compliance (Limit) ===
  getVoltageCompliance(): Promise<Result<number, Error>>;     // Limit when sourcing current
  setVoltageCompliance(volts: number): Promise<Result<void, Error>>;
  getCurrentCompliance(): Promise<Result<number, Error>>;     // Limit when sourcing voltage
  setCurrentCompliance(amps: number): Promise<Result<void, Error>>;
  isInCompliance(): Promise<Result<boolean, Error>>;

  // === Measurement ===
  measureVoltage(): Promise<Result<number, Error>>;
  measureCurrent(): Promise<Result<number, Error>>;
  measureResistance(): Promise<Result<number, Error>>;
  measurePower(): Promise<Result<number, Error>>;
  measureAll(): Promise<Result<SMUMeasurement, Error>>;

  // === Sense Mode ===
  getSenseMode(): Promise<Result<SenseMode, Error>>;
  setSenseMode(mode: SenseMode): Promise<Result<void, Error>>;

  // === Integration/NPLC ===
  getNplc(): Promise<Result<number, Error>>;
  setNplc(nplc: number): Promise<Result<void, Error>>;

  // === Sweep ===
  configureSweep(config: SweepConfig): Promise<Result<void, Error>>;
  runSweep(): Promise<Result<SweepResult, Error>>;
  abortSweep(): Promise<Result<void, Error>>;

  // === Pulse ===
  configurePulse?(config: PulseConfig): Promise<Result<void, Error>>;
  runPulse?(): Promise<Result<void, Error>>;
}

type SourceFunction = 'VOLTAGE' | 'CURRENT';
type SenseMode = '2WIRE' | '4WIRE';
type OutputOffMode = 'NORMAL' | 'ZERO' | 'HIGHZ' | 'GUARD';

interface SMUMeasurement {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  timestamp: number;
}

interface SweepConfig {
  type: 'LINEAR' | 'LOG' | 'LIST' | 'CUSTOM';
  source: 'VOLTAGE' | 'CURRENT';
  start: number;
  stop: number;
  points: number;
  delay?: number;                   // Per-point delay (s)
  compliance?: number;
}

interface SweepResult {
  sourceValues: Float64Array;
  measuredVoltages: Float64Array;
  measuredCurrents: Float64Array;
  timestamps: Float64Array;
}

interface PulseConfig {
  source: 'VOLTAGE' | 'CURRENT';
  level: number;
  width: number;                    // Pulse width (s)
  period?: number;                  // Pulse period (s)
  count?: number;
}
```

### LCR Meter

```typescript
interface LcrMeterAPI extends BaseInstrumentAPI {
  // === Frequency ===
  getFrequency(): Promise<Result<number, Error>>;
  setFrequency(hz: number): Promise<Result<void, Error>>;

  // === Test Signal ===
  getTestVoltage(): Promise<Result<number, Error>>;           // Vrms
  setTestVoltage(vrms: number): Promise<Result<void, Error>>;
  getTestCurrent(): Promise<Result<number, Error>>;           // Arms
  setTestCurrent(arms: number): Promise<Result<void, Error>>;
  getSignalMode(): Promise<Result<SignalMode, Error>>;
  setSignalMode(mode: SignalMode): Promise<Result<void, Error>>;

  // === DC Bias ===
  getDcBiasEnabled(): Promise<Result<boolean, Error>>;
  setDcBiasEnabled(on: boolean): Promise<Result<void, Error>>;
  getDcBiasVoltage(): Promise<Result<number, Error>>;
  setDcBiasVoltage(volts: number): Promise<Result<void, Error>>;
  getDcBiasCurrent(): Promise<Result<number, Error>>;
  setDcBiasCurrent(amps: number): Promise<Result<void, Error>>;

  // === Measurement Function ===
  getPrimaryParameter(): Promise<Result<LcrParameter, Error>>;
  setPrimaryParameter(param: LcrParameter): Promise<Result<void, Error>>;
  getSecondaryParameter(): Promise<Result<LcrParameter, Error>>;
  setSecondaryParameter(param: LcrParameter): Promise<Result<void, Error>>;

  // === Equivalent Circuit ===
  getEquivalentCircuit(): Promise<Result<EquivalentCircuit, Error>>;
  setEquivalentCircuit(circuit: EquivalentCircuit): Promise<Result<void, Error>>;

  // === Range ===
  getRange(): Promise<Result<number | 'AUTO', Error>>;
  setRange(ohms: number | 'AUTO'): Promise<Result<void, Error>>;

  // === Speed/Averaging ===
  getMeasurementSpeed(): Promise<Result<MeasurementSpeed, Error>>;
  setMeasurementSpeed(speed: MeasurementSpeed): Promise<Result<void, Error>>;
  getAveraging(): Promise<Result<number, Error>>;
  setAveraging(count: number): Promise<Result<void, Error>>;

  // === Measurement ===
  measure(): Promise<Result<LcrMeasurement, Error>>;
  fetch(): Promise<Result<LcrMeasurement, Error>>;

  // === Open/Short Correction ===
  performOpenCorrection(): Promise<Result<void, Error>>;
  performShortCorrection(): Promise<Result<void, Error>>;
  getOpenCorrectionEnabled(): Promise<Result<boolean, Error>>;
  setOpenCorrectionEnabled(on: boolean): Promise<Result<void, Error>>;
  getShortCorrectionEnabled(): Promise<Result<boolean, Error>>;
  setShortCorrectionEnabled(on: boolean): Promise<Result<void, Error>>;

  // === Sweep (optional capability) ===
  configureSweep?(config: LcrSweepConfig): Promise<Result<void, Error>>;
  runSweep?(): Promise<Result<LcrSweepResult, Error>>;
}

type LcrParameter =
  | 'Z' | 'Y'                       // Impedance, Admittance
  | 'R' | 'X'                       // Resistance, Reactance
  | 'G' | 'B'                       // Conductance, Susceptance
  | 'L' | 'C'                       // Inductance, Capacitance
  | 'D' | 'Q'                       // Dissipation factor, Quality factor
  | 'THETA'                         // Phase angle
  | 'ESR';                          // Equivalent series resistance

type EquivalentCircuit = 'SERIES' | 'PARALLEL';
type MeasurementSpeed = 'SLOW' | 'MEDIUM' | 'FAST';
type SignalMode = 'VOLTAGE' | 'CURRENT';

interface LcrMeasurement {
  primary: number;                  // Value of primary parameter
  secondary: number;                // Value of secondary parameter
  frequency: number;                // Test frequency
  primaryParam: LcrParameter;
  secondaryParam: LcrParameter;
}

interface LcrSweepConfig {
  parameter: 'FREQUENCY' | 'VOLTAGE' | 'CURRENT' | 'BIAS';
  start: number;
  stop: number;
  points: number;
  type: 'LINEAR' | 'LOG';
}

interface LcrSweepResult {
  sweepValues: Float64Array;
  primaryValues: Float64Array;
  secondaryValues: Float64Array;
}
```

---

## Common SCPI Patterns (Research Summary)

From analysis of [sigrok](https://sigrok.org/wiki/Supported_hardware), [ngscopeclient](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html), and SCPI-99 standard.

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
| `SENSe` | Measurement config | `:SENS:FUNC`, `:SENS:RANG`, `:SENS:NPLC` |
| `DISPlay` | Display settings | `:DISP:DATA?`, `:DISP:GRID` |
| `CALCulate` | Math/calculations | `:CALC:MARK`, `:CALC:AVER` |
| `FORMat` | Data format | `:FORM:DATA`, `:FORM:BORD` |
| `INITiate` | Trigger initiation | `:INIT`, `:INIT:CONT` |
| `FETCh` | Retrieve data | `:FETC?` |

### Manufacturer Quirks (from ngscopeclient)

| Manufacturer | Quirk | Handling |
|--------------|-------|----------|
| Rigol | Older firmware SCPI bugs | Extra delays, quirks mode |
| Rigol | Non-standard binary format | Custom parser |
| Teledyne LeCroy | VICP framing on Windows | Protocol wrapper |
| Tektronix MSO5/6 | Terminal emulator default | Requires protocol config |
| Siglent | Missing digital channel support | Feature detection |
| Keysight/Agilent | Consistent across models | Minimal quirks |

---

## File Structure

```
src/drivers/
├── index.ts                    # Public exports
├── types.ts                    # DriverSpec, PropertyDef, ChannelSpec, etc.
├── define-driver.ts            # defineDriver<T>() factory
├── context.ts                  # DriverContext for hooks/methods
├── channel.ts                  # Channel accessor implementation
├── parsers.ts                  # SCPI value parsers
├── capabilities.ts             # Capability type definitions
├── equipment/
│   ├── base.ts                 # BaseInstrumentAPI
│   ├── oscilloscope.ts         # OscilloscopeAPI, channels
│   ├── power-supply.ts         # PowerSupplyAPI, channels
│   ├── multimeter.ts           # MultimeterAPI
│   ├── signal-generator.ts     # SignalGeneratorAPI, channels
│   ├── electronic-load.ts      # ElectronicLoadAPI, channels
│   ├── spectrum-analyzer.ts    # SpectrumAnalyzerAPI, traces, markers
│   ├── smu.ts                  # SourceMeasureUnitAPI, channels
│   └── lcr-meter.ts            # LcrMeterAPI
└── implementations/
    ├── rigol/
    │   ├── ds1054z.ts          # Rigol oscilloscope driver
    │   └── dp832.ts            # Rigol PSU driver
    ├── siglent/
    │   └── sds1104x.ts         # Siglent oscilloscope driver
    └── keysight/
        ├── 34465a.ts           # Keysight DMM driver
        └── e36312a.ts          # Keysight PSU driver
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

// Typed API - IDE autocomplete, compile-time checks
await scope.value.setTimebase(1e-3);
await scope.value.analogChannel(1).setEnabled(true);
await scope.value.analogChannel(1).setScale(0.5);
await scope.value.run();

const waveform = await scope.value.getWaveform(1);
if (waveform.ok) {
  console.log('Points:', waveform.value.points.length);
}

await scope.value.close();
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
const v1 = await psu.value.channel(1).measureVoltage();
const i1 = await psu.value.channel(1).measureCurrent();
console.log(`CH1: ${v1.value}V @ ${i1.value}A`);
```

### Custom Driver for Unusual Hardware

```typescript
import { defineDriver, BaseInstrumentAPI, Ok, Err } from 'visa-ts';

// Define custom interface
interface PlasmaControllerAPI extends BaseInstrumentAPI {
  readonly chamberCount: number;
  chamber(n: number): PlasmaChamberAPI;
  activateContainmentField(): Promise<Result<void, Error>>;
}

interface PlasmaChamberAPI {
  getTemperature(): Promise<Result<number, Error>>;
  setTargetTemperature(kelvin: number): Promise<Result<void, Error>>;
  getPressure(): Promise<Result<number, Error>>;
}

// Define driver
const plasmaController = defineDriver<PlasmaControllerAPI>({
  channels: {
    name: 'chamber',
    count: 2,
    properties: {
      temperature: {
        get: ':CHAM{ch}:TEMP?',
        parse: parseScpiNumber,
        readonly: true,
      },
      targetTemperature: {
        get: ':CHAM{ch}:TEMP:TARG?',
        set: ':CHAM{ch}:TEMP:TARG {value}',
        parse: parseScpiNumber,
        validate: (v) => v >= 0 && v <= 1e8,
      },
      pressure: {
        get: ':CHAM{ch}:PRES?',
        parse: parseScpiNumber,
        readonly: true,
      },
    },
  },

  methods: {
    async activateContainmentField(ctx) {
      await ctx.write(':FIELD:ON');
      await ctx.delay(500);

      const status = await ctx.query(':FIELD:STAT?');
      if (!status.ok) return status;

      return status.value.trim() === '1'
        ? Ok(undefined)
        : Err(new Error('Containment field failed to activate'));
    },
  },

  quirks: {
    postCommandDelay: 100,
  },
});

// Use it
const plasma = await plasmaController.connect(resource);
console.log(`Controller has ${plasma.chamberCount} chambers`);
await plasma.chamber(1).setTargetTemperature(5000);
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] `DriverSpec` and related types
- [ ] `defineDriver<T>()` factory function
- [ ] `DriverContext` for hooks and methods
- [ ] Channel accessor implementation with bounds checking
- [ ] Property get/set code generation
- [ ] Command code generation
- [ ] Capability system

### Phase 2: Equipment Base Types
- [ ] `BaseInstrumentAPI`
- [ ] `OscilloscopeAPI` with analog/digital channels
- [ ] `PowerSupplyAPI` with channel support
- [ ] `MultimeterAPI` with dual display support

### Phase 3: Reference Implementations
- [ ] Rigol DS1054Z oscilloscope
- [ ] Rigol DP832 power supply (3-channel)
- [ ] Keysight 34465A DMM

### Phase 4: Extended Equipment Types
- [ ] `SignalGeneratorAPI` with modulation/sweep/burst
- [ ] `ElectronicLoadAPI` with dynamic mode
- [ ] `SpectrumAnalyzerAPI` with traces/markers
- [ ] `SourceMeasureUnitAPI` with sweep
- [ ] `LcrMeterAPI`

### Phase 5: Additional Drivers
- [ ] Siglent oscilloscopes
- [ ] Keysight oscilloscopes
- [ ] More PSUs, DMMs, signal generators

---

## References

- [SCPI-99 Standard](https://en.wikipedia.org/wiki/Standard_Commands_for_Programmable_Instruments)
- [sigrok Supported Hardware](https://sigrok.org/wiki/Supported_hardware) - GPL project with 258+ device drivers
- [ngscopeclient Oscilloscope Drivers](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html) - BSD-3 project with extensive SCPI driver docs
- [Rohde & Schwarz SCPI Introduction](https://www.rohde-schwarz.com/us/driver-pages/remote-control/remote-programming-environments_231250.html)
- [Keysight E36200 Series](https://www.keysight.com/us/en/assets/7018-06533/data-sheets/5992-3747.pdf) - PSU with tracking/sequencing
- [Siglent SDG7000A](https://siglentna.com/wp-content/uploads/dlm_uploads/2022/02/SDG7000A_Datasheet_EN01A.pdf) - AWG with comprehensive modulation
- [Keysight B2900A SMU](https://www.keysight.com/us/en/assets/7018-02794/data-sheets/5990-7009.pdf) - 4-quadrant SMU reference
- [BK Precision 8600 Series](https://www.mouser.com/datasheet/2/43/bkprecision_08312015_8600_Series-1158913.pdf) - Electronic load with dynamic mode
