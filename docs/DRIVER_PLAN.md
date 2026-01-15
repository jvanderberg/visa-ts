# Driver Abstraction Plan

This document outlines the design for adding a driver abstraction layer to visa-ts that provides typed APIs for specific instruments, abstracting away raw SCPI commands and hardware quirks.

## Goals

1. **Typed APIs** - Users interact with instrument properties and methods, not SCPI strings
2. **Declarative where possible** - Most drivers defined via configuration, not code
3. **Escape hatches** - Hooks and custom methods for complex interactions
4. **Extensible types** - Users can define new equipment types for unusual hardware
5. **Explicit async** - No hidden async behind sync-looking APIs; all operations return `Result<T, Error>`

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

## Property Definition

```typescript
interface PropertyDef<T> {
  // SCPI commands (use {value} placeholder for setter)
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
}

// Example
const properties = {
  timebase: {
    get: ':TIMebase:SCALe?',
    set: ':TIMebase:SCALe {value}',
    parse: parseScpiNumber,
    validate: (v) => v >= 1e-9 && v <= 50,
  },
  outputEnabled: {
    get: ':OUTPut?',
    set: ':OUTPut {value}',
    parse: parseScpiBool,
    format: (v) => v ? 'ON' : 'OFF',
  },
};
```

## Command Definition

```typescript
interface CommandDef {
  command: string;                  // SCPI command to send
  description?: string;
  delay?: number;                   // Post-command delay (ms)
}

// Example
const commands = {
  autoScale: ':AUToscale',
  run: ':RUN',
  stop: ':STOP',
  single: ':SINGle',
  reset: '*RST',
};
```

## Indexed Properties (Channels)

For instruments with multiple channels:

```typescript
interface IndexedPropertyDef<T> {
  count: number | ((ctx: DriverContext) => Promise<number>);
  startIndex?: number;              // Default: 1
  properties: {
    [key: string]: PropertyDef<any>;  // Use {i} for index placeholder
  };
}

// Example
const indexedProperties = {
  channel: {
    count: 4,
    properties: {
      enabled: {
        get: ':CHANnel{i}:DISPlay?',
        set: ':CHANnel{i}:DISPlay {value}',
        parse: parseScpiBool,
        format: (v) => v ? 'ON' : 'OFF',
      },
      scale: {
        get: ':CHANnel{i}:SCALe?',
        set: ':CHANnel{i}:SCALe {value}',
        parse: parseScpiNumber,
      },
      offset: {
        get: ':CHANnel{i}:OFFSet?',
        set: ':CHANnel{i}:OFFSet {value}',
        parse: parseScpiNumber,
      },
      coupling: {
        get: ':CHANnel{i}:COUPling?',
        set: ':CHANnel{i}:COUPling {value}',
        parse: (s) => s.trim() as 'AC' | 'DC' | 'GND',
      },
    },
  },
};

// Usage
await scope.channel(1).setScale(0.5);
const coupling = await scope.channel(2).getCoupling();
```

## Custom Methods

For complex operations that can't be declarative:

```typescript
const methods = {
  async getWaveform(ctx: DriverContext, channel: number): Promise<Result<WaveformData, Error>> {
    // Multi-step acquisition sequence
    const setupResult = await ctx.write(`:WAVeform:SOURce CHANnel${channel}`);
    if (!setupResult.ok) return setupResult;

    await ctx.write(':WAVeform:MODE RAW');
    await ctx.write(':WAVeform:FORMat BYTE');

    const preamble = await ctx.query(':WAVeform:PREamble?');
    if (!preamble.ok) return preamble;

    const data = await ctx.queryBinary(':WAVeform:DATA?');
    if (!data.ok) return data;

    return Ok(parseWaveform(preamble.value, data.value));
  },

  async screenshot(ctx: DriverContext): Promise<Result<Buffer, Error>> {
    return ctx.queryBinary(':DISPlay:DATA? PNG');
  },
};
```

## Quirks Configuration

Handle manufacturer-specific behaviors:

```typescript
interface QuirkConfig {
  // Timing
  postCommandDelay?: number;        // Delay after each command (ms)
  postQueryDelay?: number;          // Delay after each query (ms)

  // Connection
  clearOnConnect?: boolean;         // Send *CLS on connect
  resetOnConnect?: boolean;         // Send *RST on connect
  identifyOnConnect?: boolean;      // Query *IDN? on connect (default: true)

  // Protocol
  useOpc?: boolean;                 // Use *OPC? for synchronization
  maxResponseLength?: number;       // Truncate responses

  // Manufacturer-specific
  rigolSlowMode?: boolean;          // Extra delays for older Rigol firmware
  lecroyClearSweeps?: boolean;      // Clear statistics on measurement change
}
```

## Equipment Base Types

Based on research from [sigrok](https://sigrok.org/wiki/Supported_hardware), [ngscopeclient](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html), and SCPI standards:

### Oscilloscope

```typescript
interface OscilloscopeAPI extends BaseInstrumentAPI {
  // Timebase
  getTimebase(): Promise<Result<number, Error>>;
  setTimebase(secPerDiv: number): Promise<Result<void, Error>>;
  getTimebaseOffset(): Promise<Result<number, Error>>;
  setTimebaseOffset(seconds: number): Promise<Result<void, Error>>;

  // Trigger
  getTriggerLevel(): Promise<Result<number, Error>>;
  setTriggerLevel(volts: number): Promise<Result<void, Error>>;
  getTriggerSource(): Promise<Result<string, Error>>;
  setTriggerSource(source: string): Promise<Result<void, Error>>;
  getTriggerMode(): Promise<Result<TriggerMode, Error>>;
  setTriggerMode(mode: TriggerMode): Promise<Result<void, Error>>;

  // Channels (indexed)
  channel(n: number): ChannelAPI;

  // Acquisition control
  run(): Promise<Result<void, Error>>;
  stop(): Promise<Result<void, Error>>;
  single(): Promise<Result<void, Error>>;
  autoScale(): Promise<Result<void, Error>>;

  // Data acquisition
  getWaveform(channel: number): Promise<Result<WaveformData, Error>>;

  // Measurements
  measure(channel: number, type: MeasurementType): Promise<Result<number, Error>>;
}

interface ChannelAPI {
  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;
  setScale(voltsPerDiv: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;
  setOffset(volts: number): Promise<Result<void, Error>>;
  getCoupling(): Promise<Result<Coupling, Error>>;
  setCoupling(coupling: Coupling): Promise<Result<void, Error>>;
  getBandwidthLimit(): Promise<Result<boolean, Error>>;
  setBandwidthLimit(on: boolean): Promise<Result<void, Error>>;
  getProbeAttenuation(): Promise<Result<number, Error>>;
  setProbeAttenuation(ratio: number): Promise<Result<void, Error>>;
}

type TriggerMode = 'AUTO' | 'NORMAL' | 'SINGLE';
type Coupling = 'AC' | 'DC' | 'GND';
type MeasurementType = 'FREQUENCY' | 'PERIOD' | 'VMAX' | 'VMIN' | 'VPP' | 'VAVG' | 'VRMS' | 'RISE' | 'FALL' | 'PWIDTH' | 'NWIDTH' | 'DUTY';
```

### Power Supply

```typescript
interface PowerSupplyAPI extends BaseInstrumentAPI {
  // Output control
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // Voltage
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getVoltageLimit(): Promise<Result<number, Error>>;
  setVoltageLimit(volts: number): Promise<Result<void, Error>>;

  // Current
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getCurrentLimit(): Promise<Result<number, Error>>;
  setCurrentLimit(amps: number): Promise<Result<void, Error>>;

  // Measurements
  measureVoltage(): Promise<Result<number, Error>>;
  measureCurrent(): Promise<Result<number, Error>>;
  measurePower(): Promise<Result<number, Error>>;

  // Status
  getMode(): Promise<Result<'CV' | 'CC' | 'UR', Error>>;  // Constant Voltage/Current/Unregulated

  // Protection
  getOvpEnabled(): Promise<Result<boolean, Error>>;
  setOvpEnabled(on: boolean): Promise<Result<void, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  getOcpEnabled(): Promise<Result<boolean, Error>>;
  setOcpEnabled(on: boolean): Promise<Result<void, Error>>;
  getOcpLevel(): Promise<Result<number, Error>>;
  setOcpLevel(amps: number): Promise<Result<void, Error>>;
}

// Multi-channel variant
interface MultiChannelPowerSupplyAPI extends BaseInstrumentAPI {
  channel(n: number): PowerSupplyChannelAPI;

  // Global controls
  getAllOutputEnabled(): Promise<Result<boolean, Error>>;
  setAllOutputEnabled(on: boolean): Promise<Result<void, Error>>;
}
```

### Digital Multimeter (DMM)

```typescript
interface MultimeterAPI extends BaseInstrumentAPI {
  // Function selection
  getFunction(): Promise<Result<DmmFunction, Error>>;
  setFunction(func: DmmFunction): Promise<Result<void, Error>>;

  // Range
  getRange(): Promise<Result<number | 'AUTO', Error>>;
  setRange(range: number | 'AUTO'): Promise<Result<void, Error>>;

  // Measurement
  measure(): Promise<Result<number, Error>>;
  fetch(): Promise<Result<number, Error>>;  // Get last measurement without triggering new one

  // AC-specific
  getAcBandwidth(): Promise<Result<AcBandwidth, Error>>;
  setAcBandwidth(bw: AcBandwidth): Promise<Result<void, Error>>;

  // Integration/averaging
  getNplc(): Promise<Result<number, Error>>;  // Number of Power Line Cycles
  setNplc(nplc: number): Promise<Result<void, Error>>;

  // Null/relative
  getNullEnabled(): Promise<Result<boolean, Error>>;
  setNullEnabled(on: boolean): Promise<Result<void, Error>>;
  getNullValue(): Promise<Result<number, Error>>;
  setNullValue(value: number): Promise<Result<void, Error>>;
}

type DmmFunction =
  | 'VDC' | 'VAC' | 'VDC_AC'           // Voltage
  | 'ADC' | 'AAC' | 'ADC_AC'           // Current
  | 'RESISTANCE' | 'RESISTANCE_4W'     // Resistance
  | 'FREQUENCY' | 'PERIOD'             // Frequency
  | 'CAPACITANCE'                      // Capacitance
  | 'CONTINUITY' | 'DIODE'             // Test modes
  | 'TEMPERATURE';                     // Temperature

type AcBandwidth = 'SLOW' | 'MEDIUM' | 'FAST';  // 3Hz, 20Hz, 200Hz typical
```

### Signal/Function Generator

```typescript
interface SignalGeneratorAPI extends BaseInstrumentAPI {
  // Output control
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;

  // Waveform
  getWaveform(): Promise<Result<Waveform, Error>>;
  setWaveform(waveform: Waveform): Promise<Result<void, Error>>;

  // Frequency
  getFrequency(): Promise<Result<number, Error>>;
  setFrequency(hz: number): Promise<Result<void, Error>>;

  // Amplitude
  getAmplitude(): Promise<Result<number, Error>>;
  setAmplitude(vpp: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;
  setOffset(volts: number): Promise<Result<void, Error>>;

  // Phase
  getPhase(): Promise<Result<number, Error>>;
  setPhase(degrees: number): Promise<Result<void, Error>>;

  // Duty cycle (for pulse/square)
  getDutyCycle(): Promise<Result<number, Error>>;
  setDutyCycle(percent: number): Promise<Result<void, Error>>;

  // Impedance
  getOutputImpedance(): Promise<Result<number | 'HIGHZ', Error>>;
  setOutputImpedance(ohms: number | 'HIGHZ'): Promise<Result<void, Error>>;
}

type Waveform = 'SINE' | 'SQUARE' | 'RAMP' | 'PULSE' | 'NOISE' | 'DC' | 'ARB';
```

### Electronic Load

```typescript
interface ElectronicLoadAPI extends BaseInstrumentAPI {
  // Input control
  getInputEnabled(): Promise<Result<boolean, Error>>;
  setInputEnabled(on: boolean): Promise<Result<void, Error>>;

  // Mode
  getMode(): Promise<Result<LoadMode, Error>>;
  setMode(mode: LoadMode): Promise<Result<void, Error>>;

  // Setpoints (depending on mode)
  getCurrentSetpoint(): Promise<Result<number, Error>>;
  setCurrentSetpoint(amps: number): Promise<Result<void, Error>>;
  getVoltageSetpoint(): Promise<Result<number, Error>>;
  setVoltageSetpoint(volts: number): Promise<Result<void, Error>>;
  getResistanceSetpoint(): Promise<Result<number, Error>>;
  setResistanceSetpoint(ohms: number): Promise<Result<void, Error>>;
  getPowerSetpoint(): Promise<Result<number, Error>>;
  setPowerSetpoint(watts: number): Promise<Result<void, Error>>;

  // Measurements
  measureVoltage(): Promise<Result<number, Error>>;
  measureCurrent(): Promise<Result<number, Error>>;
  measurePower(): Promise<Result<number, Error>>;

  // Slew rate
  getSlewRate(): Promise<Result<number, Error>>;
  setSlewRate(ampsPerSec: number): Promise<Result<void, Error>>;
}

type LoadMode = 'CC' | 'CV' | 'CR' | 'CP';  // Constant Current/Voltage/Resistance/Power
```

### Spectrum Analyzer

```typescript
interface SpectrumAnalyzerAPI extends BaseInstrumentAPI {
  // Frequency
  getCenterFrequency(): Promise<Result<number, Error>>;
  setCenterFrequency(hz: number): Promise<Result<void, Error>>;
  getSpan(): Promise<Result<number, Error>>;
  setSpan(hz: number): Promise<Result<void, Error>>;
  getStartFrequency(): Promise<Result<number, Error>>;
  setStartFrequency(hz: number): Promise<Result<void, Error>>;
  getStopFrequency(): Promise<Result<number, Error>>;
  setStopFrequency(hz: number): Promise<Result<void, Error>>;

  // Resolution/Video bandwidth
  getRbw(): Promise<Result<number | 'AUTO', Error>>;
  setRbw(hz: number | 'AUTO'): Promise<Result<void, Error>>;
  getVbw(): Promise<Result<number | 'AUTO', Error>>;
  setVbw(hz: number | 'AUTO'): Promise<Result<void, Error>>;

  // Reference level
  getReferenceLevel(): Promise<Result<number, Error>>;
  setReferenceLevel(dbm: number): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;
  setScale(dbPerDiv: number): Promise<Result<void, Error>>;

  // Trace
  getTrace(n?: number): Promise<Result<TraceData, Error>>;

  // Markers
  markerToCenter(): Promise<Result<void, Error>>;
  markerToPeak(): Promise<Result<void, Error>>;
  getMarkerFrequency(n?: number): Promise<Result<number, Error>>;
  getMarkerAmplitude(n?: number): Promise<Result<number, Error>>;
}
```

## Common SCPI Patterns (Research Summary)

From analysis of [sigrok](https://sigrok.org/wiki/Supported_hardware), [ngscopeclient](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html), and SCPI-99 standard:

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

### Manufacturer Quirks (from ngscopeclient)

| Manufacturer | Quirk | Handling |
|--------------|-------|----------|
| Rigol | Older firmware SCPI bugs | Extra delays, quirks mode |
| Rigol | Non-standard binary format | Custom parser |
| Teledyne LeCroy | VICP framing on Windows | Protocol wrapper |
| Tektronix MSO5/6 | Terminal emulator default | Requires protocol config |
| Siglent | Missing digital channel support | Feature detection |
| Keysight/Agilent | Consistent across models | Minimal quirks |

## File Structure

```
src/drivers/
├── index.ts                    # Public exports
├── types.ts                    # DriverSpec, PropertyDef, etc.
├── define-driver.ts            # defineDriver<T>() factory
├── context.ts                  # DriverContext for hooks/methods
├── parsers.ts                  # SCPI value parsers
├── equipment/
│   ├── base.ts                 # BaseInstrumentAPI
│   ├── oscilloscope.ts         # OscilloscopeAPI, ChannelAPI
│   ├── power-supply.ts         # PowerSupplyAPI
│   ├── multimeter.ts           # MultimeterAPI
│   ├── signal-generator.ts     # SignalGeneratorAPI
│   ├── electronic-load.ts      # ElectronicLoadAPI
│   └── spectrum-analyzer.ts    # SpectrumAnalyzerAPI
└── implementations/
    ├── rigol/
    │   ├── ds1054z.ts          # Rigol oscilloscope driver
    │   └── dp832.ts            # Rigol PSU driver
    ├── siglent/
    │   └── sds1104x.ts         # Siglent oscilloscope driver
    └── keysight/
        └── 34465a.ts           # Keysight DMM driver
```

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
await scope.value.channel(1).setEnabled(true);
await scope.value.channel(1).setScale(0.5);
await scope.value.run();

const waveform = await scope.value.getWaveform(1);
if (waveform.ok) {
  console.log('Points:', waveform.value.points.length);
}

await scope.value.close();
```

### Custom Driver for Unusual Hardware

```typescript
import { defineDriver, BaseInstrumentAPI, Ok, Err } from 'visa-ts';

// Define custom interface
interface PlasmaControllerAPI extends BaseInstrumentAPI {
  getPlasmaTemperature(): Promise<Result<number, Error>>;
  setPlasmaTemperature(kelvin: number): Promise<Result<void, Error>>;
  activateContainmentField(): Promise<Result<void, Error>>;
  getFieldStrength(): Promise<Result<number, Error>>;
}

// Define driver
const plasmaController = defineDriver<PlasmaControllerAPI>({
  properties: {
    plasmaTemperature: {
      get: ':PLAS:TEMP?',
      set: ':PLAS:TEMP {value}',
      parse: parseScpiNumber,
      validate: (v) => v >= 0 && v <= 1e8,
    },
    fieldStrength: {
      get: ':FIELD:STR?',
      parse: parseScpiNumber,
      readonly: true,
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
```

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] `DriverSpec` and related types
- [ ] `defineDriver<T>()` factory function
- [ ] `DriverContext` for hooks and methods
- [ ] Property get/set code generation
- [ ] Command code generation

### Phase 2: Equipment Base Types
- [ ] `BaseInstrumentAPI`
- [ ] `OscilloscopeAPI` with `ChannelAPI`
- [ ] `PowerSupplyAPI`
- [ ] `MultimeterAPI`

### Phase 3: Reference Implementations
- [ ] Rigol DS1054Z oscilloscope
- [ ] Rigol DP832 power supply
- [ ] One DMM (Keysight 34465A or Rigol DM3058)

### Phase 4: Extended Equipment Types
- [ ] `SignalGeneratorAPI`
- [ ] `ElectronicLoadAPI`
- [ ] `SpectrumAnalyzerAPI`

### Phase 5: Additional Drivers
- [ ] Siglent oscilloscopes
- [ ] Keysight oscilloscopes
- [ ] More PSUs and DMMs

## References

- [SCPI-99 Standard](https://en.wikipedia.org/wiki/Standard_Commands_for_Programmable_Instruments)
- [sigrok Supported Hardware](https://sigrok.org/wiki/Supported_hardware) - GPL project with 258+ device drivers
- [ngscopeclient Oscilloscope Drivers](https://www.ngscopeclient.org/manual/OscilloscopeDrivers.html) - BSD-3 project with extensive SCPI driver docs
- [Rohde & Schwarz SCPI Introduction](https://www.rohde-schwarz.com/us/driver-pages/remote-control/remote-programming-environments_231250.html)
