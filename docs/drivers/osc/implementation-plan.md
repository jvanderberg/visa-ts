# Oscilloscope Driver Implementation Plan

> Plan to complete oscilloscope drivers using the comprehensive base interface and granular feature system

## Architecture Overview

### Base Interface Philosophy

The `Oscilloscope` and `OscilloscopeChannel` interfaces contain **all standard functionality** that every oscilloscope has. This includes:
- Channel enable/disable, scale, offset, coupling
- Probe attenuation, bandwidth limit, invert, label
- All standard measurements (Vpp, Vmax, Vmin, Vavg, Vrms, Vtop, Vbase, Vamp, etc.)
- Timebase (scale, offset, mode)
- Sample rate, record length
- Trigger (level, slope, mode, source)
- Acquisition mode
- Run/stop/single, force trigger, auto scale
- Waveform capture, screenshot

### Granular Feature System

Features represent **optional capabilities that vary between models**. They are NOT in the base interface.

**Oscilloscope Features** (from `src/drivers/features/osc-features.ts`):
| Feature | Description | Example Models |
|---------|-------------|----------------|
| `decode` | Serial protocol decode (I2C, SPI, UART) | SDS1104X-U, DS1054Z (with option) |
| `digital` | Digital/logic analyzer channels | MSO series |
| `mask` | Mask/limit testing | Higher-end scopes |
| `histogram` | Waveform histogram | Higher-end scopes |
| `segmented` | Segmented memory acquisition | SDS, Keysight, R&S |
| `wavegen` | Built-in waveform generator | DS1054Z (with option), SDS1104X-U |
| `search` | Waveform search/navigation | Higher-end scopes |
| `bode` | Bode plot analysis | SDS with wavegen |
| `power` | Power analysis | Specialized options |
| `jitter` | Jitter analysis | Higher-end scopes |

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
| Base interface | Complete | All standard methods in base |
| Rigol scope driver | Complete | Implements base interface |
| DS1054Z driver | Complete | Uses base interface |
| Feature types | Complete | `src/drivers/features/osc-features.ts` |

---

## Implementation Phases

### Phase 1: Verify Base Interface Completeness

**File:** `src/drivers/equipment/oscilloscope.ts`

The base interface should already include (verify these are present):

**OscilloscopeChannel:**
```typescript
// Identity
readonly channelNumber: number;

// Display
getEnabled(): Promise<Result<boolean, Error>>;
setEnabled(on: boolean): Promise<Result<void, Error>>;
getScale(): Promise<Result<number, Error>>;
setScale(voltsPerDiv: number): Promise<Result<void, Error>>;
getOffset(): Promise<Result<number, Error>>;
setOffset(volts: number): Promise<Result<void, Error>>;
getCoupling(): Promise<Result<Coupling, Error>>;
setCoupling(coupling: Coupling): Promise<Result<void, Error>>;

// Probe settings
getProbeAttenuation(): Promise<Result<number, Error>>;
setProbeAttenuation(ratio: number): Promise<Result<void, Error>>;
getBandwidthLimit(): Promise<Result<BandwidthLimit, Error>>;
setBandwidthLimit(limit: BandwidthLimit): Promise<Result<void, Error>>;
getInverted(): Promise<Result<boolean, Error>>;
setInverted(inverted: boolean): Promise<Result<void, Error>>;
getLabel(): Promise<Result<string, Error>>;
setLabel(label: string): Promise<Result<void, Error>>;

// Measurements (all standard)
getMeasuredFrequency(): Promise<Result<number, Error>>;
getMeasuredPeriod(): Promise<Result<number, Error>>;
getMeasuredVpp(): Promise<Result<number, Error>>;
getMeasuredVmax(): Promise<Result<number, Error>>;
getMeasuredVmin(): Promise<Result<number, Error>>;
getMeasuredVavg(): Promise<Result<number, Error>>;
getMeasuredVrms(): Promise<Result<number, Error>>;
getMeasuredVtop(): Promise<Result<number, Error>>;
getMeasuredVbase(): Promise<Result<number, Error>>;
getMeasuredVamp(): Promise<Result<number, Error>>;
getMeasuredRiseTime(): Promise<Result<number, Error>>;
getMeasuredFallTime(): Promise<Result<number, Error>>;
getMeasuredPositiveWidth(): Promise<Result<number, Error>>;
getMeasuredNegativeWidth(): Promise<Result<number, Error>>;
getMeasuredPositiveDuty(): Promise<Result<number, Error>>;
getMeasuredNegativeDuty(): Promise<Result<number, Error>>;
getMeasuredOvershoot(): Promise<Result<number, Error>>;
getMeasuredPreshoot(): Promise<Result<number, Error>>;
getMeasuredCounter(): Promise<Result<number, Error>>;
```

**Oscilloscope:**
```typescript
// Channels
readonly channelCount: number;
channel(n: number): OscilloscopeChannel;

// Timebase
getTimebase(): Promise<Result<number, Error>>;
setTimebase(secPerDiv: number): Promise<Result<void, Error>>;
getTimebaseOffset(): Promise<Result<number, Error>>;
setTimebaseOffset(seconds: number): Promise<Result<void, Error>>;
getTimebaseMode(): Promise<Result<TimebaseMode, Error>>;
setTimebaseMode(mode: TimebaseMode): Promise<Result<void, Error>>;

// Acquisition
getSampleRate(): Promise<Result<number, Error>>;
getRecordLength(): Promise<Result<number, Error>>;
setRecordLength(points: number | 'AUTO'): Promise<Result<void, Error>>;
getAcquisitionMode(): Promise<Result<AcquisitionMode, Error>>;
setAcquisitionMode(mode: AcquisitionMode): Promise<Result<void, Error>>;
getRunning(): Promise<Result<boolean, Error>>;

// Trigger
getTriggerLevel(): Promise<Result<number, Error>>;
setTriggerLevel(volts: number): Promise<Result<void, Error>>;
getTriggerSlope(): Promise<Result<TriggerSlope, Error>>;
setTriggerSlope(slope: TriggerSlope): Promise<Result<void, Error>>;
getTriggerMode(): Promise<Result<TriggerMode, Error>>;
setTriggerMode(mode: TriggerMode): Promise<Result<void, Error>>;
getTriggerSource(): Promise<Result<TriggerSource, Error>>;
setTriggerSource(source: TriggerSource): Promise<Result<void, Error>>;

// Commands
run(): Promise<Result<void, Error>>;
stop(): Promise<Result<void, Error>>;
single(): Promise<Result<void, Error>>;
autoScale(): Promise<Result<void, Error>>;
forceTrigger(): Promise<Result<void, Error>>;

// Data capture (methods - require custom implementation)
captureWaveform(channel: number | string): Promise<Result<WaveformData, Error>>;
captureScreenshot(format?: 'PNG' | 'BMP'): Promise<Result<Buffer, Error>>;
```

---

### Phase 2: Update Rigol Scope Driver

**File:** `src/drivers/implementations/rigol/scope.ts`

The driver should already implement all base interface methods. Verify:

```typescript
const rigolScopeSpec: DriverSpec<RigolScope, RigolScopeChannel> = {
  type: 'oscilloscope',
  manufacturer: 'Rigol',
  models: ['DS1054Z', 'DS1074Z', 'DS1104Z', 'DS1104Z-S', 'MSO1104Z-S'],
  features: [],  // Entry-level scope, no optional features

  properties: {
    timebase: { get: ':TIM:SCAL?', set: ':TIM:SCAL {value}', parse: parseScpiNumber },
    timebaseOffset: { get: ':TIM:OFFS?', set: ':TIM:OFFS {value}', parse: parseScpiNumber },
    timebaseMode: { get: ':TIM:MODE?', set: ':TIM:MODE {value}', parse: parseTimebaseMode },
    sampleRate: { get: ':ACQ:SRAT?', parse: parseScpiNumber, readonly: true },
    recordLength: { get: ':ACQ:MDEP?', set: ':ACQ:MDEP {value}', parse: parseScpiNumber },
    acquisitionMode: { get: ':ACQ:TYPE?', set: ':ACQ:TYPE {value}', parse: parseAcquisitionMode },
    running: { get: ':TRIG:STAT?', parse: (s) => s.includes('RUN'), readonly: true },
    triggerLevel: { get: ':TRIG:EDG:LEV?', set: ':TRIG:EDG:LEV {value}', parse: parseScpiNumber },
    triggerSlope: { get: ':TRIG:EDG:SLOP?', set: ':TRIG:EDG:SLOP {value}', parse: parseTriggerSlope, format: formatTriggerSlope },
    triggerMode: { get: ':TRIG:SWE?', set: ':TRIG:SWE {value}' },
    triggerSource: { get: ':TRIG:EDG:SOUR?', set: ':TRIG:EDG:SOUR {value}', parse: parseTriggerSource },
  },

  commands: {
    run: ':RUN',
    stop: ':STOP',
    single: ':SINGle',
    autoScale: ':AUT',
    forceTrigger: ':TFORce',
  },

  methods: {
    captureWaveform: async (ctx, channel) => { /* ... */ },
    captureScreenshot: async (ctx, format) => { /* ... */ },
  },

  channels: {
    count: 4,
    indexStart: 1,
    properties: {
      enabled: { get: ':CHAN{ch}:DISP?', set: ':CHAN{ch}:DISP {value}', parse: parseScpiBool, format: formatScpiBool },
      scale: { get: ':CHAN{ch}:SCAL?', set: ':CHAN{ch}:SCAL {value}', parse: parseScpiNumber },
      offset: { get: ':CHAN{ch}:OFFS?', set: ':CHAN{ch}:OFFS {value}', parse: parseScpiNumber },
      coupling: { get: ':CHAN{ch}:COUP?', set: ':CHAN{ch}:COUP {value}' },
      probeAttenuation: { get: ':CHAN{ch}:PROB?', set: ':CHAN{ch}:PROB {value}', parse: parseScpiNumber },
      bandwidthLimit: { get: ':CHAN{ch}:BWL?', set: ':CHAN{ch}:BWL {value}', parse: parseBandwidthLimit, format: formatBandwidthLimit },
      inverted: { get: ':CHAN{ch}:INV?', set: ':CHAN{ch}:INV {value}', parse: parseScpiBool, format: formatScpiBool },
      label: { get: ':CHAN{ch}:LAB?', set: ':CHAN{ch}:LAB {value}' },

      // Measurements
      measuredFrequency: { get: ':MEAS:ITEM? FREQ,CHAN{ch}', parse: parseScpiNumber, readonly: true },
      measuredPeriod: { get: ':MEAS:ITEM? PER,CHAN{ch}', parse: parseScpiNumber, readonly: true },
      measuredVpp: { get: ':MEAS:ITEM? VPP,CHAN{ch}', parse: parseScpiNumber, readonly: true },
      // ... all other measurements
    },
  },
};
```

---

### Phase 3: Implement Siglent SDS Driver

**File:** `src/drivers/implementations/siglent/sds.ts`

**Features:** `['segmented', 'wavegen', 'bode']` (SDS1104X-U example)

**Key differences from Rigol:**
- Different command syntax: `C1:TRA ON` vs `:CHAN1:DISP ON`
- Waveform query: `C1:WF? DAT2` with WAVEDESC header
- Port 5025 vs Rigol's 5555
- Supports input impedance (50Ω/1MΩ)
- Different trigger commands: `:TRIGger:RUN` vs `:RUN`

```typescript
const sdsFeatures = ['segmented', 'wavegen', 'bode'] as const satisfies readonly OscFeatureId[];

const sdsSpec: DriverSpec<SiglentSDS, SiglentSDSChannel, typeof sdsFeatures> = {
  features: sdsFeatures,
  // ...

  // Input impedance requires notSupported on Rigol but works on Siglent
  channels: {
    properties: {
      inputImpedance: {
        get: ':CHAN{ch}:IMP?',
        set: ':CHAN{ch}:IMP {value}',
        parse: parseInputImpedance,
      },
    },
  },
};
```

**Reference:** `docs/drivers/osc/siglent_sds_scpi_reference.md`

---

### Phase 4: Implement Keysight InfiniiVision Driver

**File:** `src/drivers/implementations/keysight/infiniivision.ts`

**Features:** `['segmented']` (varies by model/option)

**Key differences:**
- Standard SCPI syntax, closest to Rigol
- Uses `:DIGitize` for reliable single acquisition
- Supports HiSLIP (port 4880) for high speed
- No GND coupling (only AC/DC)

```typescript
const infiniivisionSpec: DriverSpec<KeysightInfiniivision, KeysightInfiniivisionChannel> = {
  // ...

  channels: {
    properties: {
      // GND coupling not supported
      coupling: {
        get: ':CHAN{ch}:COUP?',
        set: ':CHAN{ch}:COUP {value}',
        // Only AC/DC valid - GND returns error
      },
    },
  },
};
```

**Reference:** `docs/drivers/osc/keysight_infiniivision_scpi_reference.md`

---

### Phase 5: Implement Tektronix MSO Driver

**File:** `src/drivers/implementations/tektronix/mso.ts`

**Features:** `['digital']` (MSO series has logic analyzer)

**Key differences:**
- No leading colon in commands
- Run/stop: `ACQuire:STATE RUN` vs `:RUN`
- Single: `ACQuire:STOPAfter SEQuence` + `ACQuire:STATE RUN`
- Waveform: `CURVe?` instead of `:WAVeform:DATA?`
- Probe uses GAIN (reciprocal of attenuation)
- Port 4000

```typescript
const msoSpec: DriverSpec<TektronixMSO, TektronixMSOChannel> = {
  // ...

  properties: {
    // No leading colons
    timebase: { get: 'HOR:SCAle?', set: 'HOR:SCAle {value}', parse: parseScpiNumber },
    running: { get: 'ACQ:STATE?', parse: (s) => s.includes('1'), readonly: true },
  },

  commands: {
    run: 'ACQ:STATE RUN',
    stop: 'ACQ:STATE STOP',
    // single is complex - needs method implementation
  },

  methods: {
    single: async (ctx) => {
      let result = await ctx.write('ACQ:STOPA SEQ');
      if (!result.ok) return result;
      return ctx.write('ACQ:STATE RUN');
    },
  },

  channels: {
    properties: {
      // Tektronix uses gain (reciprocal of attenuation)
      probeAttenuation: {
        get: 'CH{ch}:PRO:GAIN?',
        set: 'CH{ch}:PRO:GAIN {value}',
        parse: (s) => 1 / parseScpiNumber(s),  // Convert gain to attenuation
        format: (v) => (1 / v).toString(),     // Convert attenuation to gain
      },
    },
  },
};
```

**Reference:** `docs/drivers/osc/tektronix_mso_scpi_reference.md`

---

### Phase 6: Implement R&S RTx Driver (Optional)

**File:** `src/drivers/implementations/rohde-schwarz/rtx.ts`

**Features:** `['segmented', 'mask']`

**Key differences:**
- Uses `ACLimit`/`DCLimit` instead of AC/DC for coupling
- `RUN`/`RUNSingle`/`STOP` commands
- Probe attenuation via `PROBe<n>:SETup:ATTenuation:MANual`
- Waveform via `CHANnel<n>:DATA?`

**Reference:** `docs/drivers/osc/rohde_schwarz_rtx_scpi_reference.md`

---

## Feature Detection Pattern

Users can check for features at runtime:

```typescript
import { hasDecode, hasWavegen, hasSegmented } from 'visa-ts/drivers/features';

const scope = await driver.connect(resource);
if (scope.ok) {
  // Compile-time: features array is typed
  console.log(scope.value.features); // readonly ['segmented', 'wavegen', 'bode']

  // Runtime: type guards narrow the type
  if (hasDecode(scope.value)) {
    // Serial decode methods available
    await scope.value.configureI2CDecode(/* ... */);
  }

  if (hasWavegen(scope.value)) {
    // Built-in wavegen available
    await scope.value.setWavegenFrequency(1000);
  }
}
```

---

## Type Normalization

### TriggerSource
Different vendors use different channel naming:
- Rigol: `CHAN1`, `CHAN2`, `EXT`, `ACLine`
- Siglent: `C1`, `C2`, `EXT`, `LINE`
- Keysight: `CHANnel1`, `EXTernal`, `LINE`
- Tektronix: `CH1`, `AUX`, `LINE`

**Solution:** Use canonical form in interface (`CH1`, `CH2`, `EXT`, `LINE`), drivers translate.

### BandwidthLimit
Different vendors have different options:
- Rigol: OFF, 20M
- Siglent: OFF, 20M, 200M
- Keysight: OFF, 25M (ON)
- Tektronix: FULL, any frequency

**Solution:** Use string union with common values, drivers map to device-specific:
```typescript
export type BandwidthLimit = 'OFF' | '20MHZ' | '100MHZ' | '200MHZ' | 'FULL';
```

### Coupling
- Rigol/Tektronix: AC, DC, GND
- Keysight: AC, DC only
- R&S: ACLimit, DCLimit, GND

**Solution:** Keep `'AC' | 'DC' | 'GND'`, Keysight returns `notSupported()` for GND.

---

## File Structure

```
src/drivers/
├── equipment/
│   └── oscilloscope.ts             # Comprehensive base interface
├── features/
│   └── osc-features.ts             # Feature brands and type guards
└── implementations/
    ├── rigol/
    │   ├── scope.ts                # features: [] (entry-level)
    │   └── ds1054z.ts              # features: [] (specific model)
    ├── siglent/
    │   └── sds.ts                  # features: ['segmented', 'wavegen', 'bode']
    ├── keysight/
    │   └── infiniivision.ts        # features: ['segmented']
    ├── tektronix/
    │   └── mso.ts                  # features: ['digital']
    └── rohde-schwarz/
        └── rtx.ts                  # features: ['segmented', 'mask']
```

---

## Command Syntax Quick Reference

| Operation | Rigol | Siglent | Keysight | Tektronix | R&S |
|-----------|-------|---------|----------|-----------|-----|
| Run | `:RUN` | `:TRIGger:RUN` | `:RUN` | `ACQ:STATE RUN` | `RUN` |
| Stop | `:STOP` | `:TRIGger:STOP` | `:STOP` | `ACQ:STATE STOP` | `STOP` |
| Single | `:SINGle` | `:TRIGger:SINGle` | `:SINGle` | `ACQ:STOPA SEQ;ACQ:STATE RUN` | `RUNS` |
| V/div | `:CHAN1:SCAL` | `:CHAN1:SCALe` | `:CHAN1:SCALe` | `CH1:SCAle` | `CHAN1:SCALe` |
| T/div | `:TIM:SCAL` | `:TIMebase:SCALe` | `:TIM:SCALe` | `HOR:SCAle` | `TIM:SCALe` |
| Trig level | `:TRIG:EDG:LEV` | `:TRIG:EDGE:LEVel` | `:TRIG:LEV` | `TRIG:A:LEV:CH1` | `TRIG:A:LEV1` |
| Measure | `:MEAS:ITEM? FREQ,CH1` | `:MEAS:ITEM? FREQ,C1` | `:MEAS:FREQ? CHAN1` | `MEAS:MEAS1:VAL?` | `MEAS1:RES?` |
| Waveform | `:WAV:DATA?` | `:WAV:DATA?` | `:WAV:DATA?` | `CURV?` | `CHAN1:DATA?` |
| Screenshot | `:DISP:DATA? ON,OFF,PNG` | `:PRINt? PNG` | `:DISP:DATA? PNG` | `SAV:IMAG` | `HCOP:DATA?` |

---

## Open Questions (Resolved)

1. ~~TriggerSource type~~ → Use string union with canonical forms, drivers translate.

2. ~~Waveform channel parameter~~ → Use `number | string` - number for analog channels, string for math/digital.

3. ~~Measurement methods vs generic measure()~~ → Keep individual methods for discoverability and documentation.

4. ~~Segmented memory~~ → Feature (`segmented`), not standard.

5. ~~Math/FFT~~ → Defer to features, complex and varies significantly.

6. ~~Serial decode~~ → Feature (`decode`), model-specific and complex.

---

## Priority

1. **Phase 1** - Verify base interface (should be complete)
2. **Phase 2** - Verify Rigol driver (should be complete)
3. **Phase 3** - Siglent SDS (validates different SCPI dialect)
4. **Phase 4** - Keysight (validates professional scope, standard SCPI)
5. **Phase 5** - Tektronix (validates unique command structure)
6. **Phase 6** - R&S (optional, lowest priority)
